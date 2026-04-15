const Item = require('../models/Item');
const Match = require('../models/Match');
const { notifyUser } = require('./notifier');

const MATCH_RADIUS_KM = 5;
const MATCH_THRESHOLD = 55;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineDistanceInKm([lng1, lat1], [lng2, lat2]) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

function levenshteinDistance(a = '', b = '') {
  const source = a.toLowerCase().trim();
  const target = b.toLowerCase().trim();

  if (!source.length) return target.length;
  if (!target.length) return source.length;

  const matrix = Array.from({ length: source.length + 1 }, () => Array(target.length + 1).fill(0));

  for (let i = 0; i <= source.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= target.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= source.length; i += 1) {
    for (let j = 1; j <= target.length; j += 1) {
      const cost = source[i - 1] === target[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[source.length][target.length];
}

function titleSimilarityScore(a = '', b = '') {
  const longest = Math.max(a.trim().length, b.trim().length, 1);
  const distance = levenshteinDistance(a, b);
  return Math.max(0, 1 - distance / longest);
}

function calculateMatchScore(baseItem, candidate) {
  if (baseItem.category !== candidate.category) {
    return { isMatch: false, score: 0, reason: 'category_mismatch' };
  }

  const distanceKm = haversineDistanceInKm(baseItem.location.coordinates, candidate.location.coordinates);
  if (distanceKm > MATCH_RADIUS_KM) {
    return { isMatch: false, score: 0, reason: 'outside_radius' };
  }

  const similarity = titleSimilarityScore(baseItem.title, candidate.title);
  const distanceScore = 1 - distanceKm / MATCH_RADIUS_KM;
  const brandBoost = baseItem.brand && candidate.brand && baseItem.brand.toLowerCase() === candidate.brand.toLowerCase() ? 1 : 0;
  const imageBoost = baseItem.imageUrl && candidate.imageUrl
    && baseItem.imageUrl.split('/').pop() === candidate.imageUrl.split('/').pop() ? 1 : 0;
  const descriptionBoost = baseItem.description && candidate.description
    && candidate.description.toLowerCase().includes(baseItem.title.toLowerCase()) ? 0.25 : 0;

  const score = Math.round(
    similarity * 65
    + Math.max(0, distanceScore) * 25
    + brandBoost * 7
    + imageBoost * 5
    + descriptionBoost * 3
  );

  return {
    isMatch: score >= MATCH_THRESHOLD,
    score,
    distanceKm,
    similarity
  };
}

async function syncItemStatus(itemId, status) {
  await Item.findByIdAndUpdate(itemId, { status });
}

async function runMatchingForItem(itemDocument) {
  const baseItem = itemDocument._id ? itemDocument : await Item.findById(itemDocument);
  if (!baseItem || baseItem.status === 'recovered') {
    return [];
  }

  const oppositeType = baseItem.type === 'Lost' ? 'Found' : 'Lost';
  const candidates = await Item.find({
    _id: { $ne: baseItem._id },
    type: oppositeType,
    category: baseItem.category,
    status: { $ne: 'recovered' }
  });

  const createdOrUpdatedMatches = [];

  for (const candidate of candidates) {
    const result = calculateMatchScore(baseItem, candidate);
    const lostItem = baseItem.type === 'Lost' ? baseItem : candidate;
    const foundItem = baseItem.type === 'Found' ? baseItem : candidate;

    if (!result.isMatch) {
      await Match.findOneAndDelete({ lostItem: lostItem._id, foundItem: foundItem._id, status: 'pending' });
      continue;
    }

    const existingMatch = await Match.findOne({ lostItem: lostItem._id, foundItem: foundItem._id });
    const match = await Match.findOneAndUpdate(
      { lostItem: lostItem._id, foundItem: foundItem._id },
      {
        score: result.score,
        status: 'pending'
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    await syncItemStatus(lostItem._id, 'matched');
    await syncItemStatus(foundItem._id, 'matched');
    createdOrUpdatedMatches.push(match);

    if (!existingMatch) {
      await notifyUser({
        userId: lostItem.user,
        email: null,
        event: 'match:found',
        title: 'New possible match found',
        body: `A ${foundItem.category} report looks similar to your lost item.`,
        data: { matchId: match._id.toString(), score: match.score }
      });
      await notifyUser({
        userId: foundItem.user,
        email: null,
        event: 'match:found',
        title: 'New possible match found',
        body: `A lost report may match the item you found.`,
        data: { matchId: match._id.toString(), score: match.score }
      });
    }
  }

  return createdOrUpdatedMatches;
}

async function runMatchingForUser(userId) {
  const items = await Item.find({ user: userId, status: { $ne: 'recovered' } });
  const results = [];

  for (const item of items) {
    const matches = await runMatchingForItem(item);
    results.push(...matches);
  }

  return results;
}

module.exports = {
  MATCH_RADIUS_KM,
  calculateMatchScore,
  haversineDistanceInKm,
  levenshteinDistance,
  runMatchingForItem,
  runMatchingForUser,
  titleSimilarityScore
};
