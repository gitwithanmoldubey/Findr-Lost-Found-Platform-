const UserReputation = require('../models/UserReputation');

function computeBadges(score, successfulReturns) {
  const badges = [];
  if (score >= 50) badges.push('Trusted User');
  if (successfulReturns >= 3) badges.push('Verified Finder');
  return badges;
}

async function applyReputationDelta(userId, { scoreDelta = 0, successfulReturnsDelta = 0, fakeReportsDelta = 0 }) {
  const reputation = await UserReputation.findOneAndUpdate(
    { userId },
    {
      $inc: {
        score: scoreDelta,
        successfulReturns: successfulReturnsDelta,
        fakeReports: fakeReportsDelta
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  reputation.badges = computeBadges(reputation.score, reputation.successfulReturns);
  await reputation.save();
  return reputation;
}

module.exports = {
  applyReputationDelta
};
