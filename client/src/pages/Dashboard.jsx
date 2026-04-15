import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-react';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { apiFetch } from '../lib/api';

function DashboardContent() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [items, setItems] = useState([]);
  const [matches, setMatches] = useState([]);
  const [tab, setTab] = useState('lost');
  const [loading, setLoading] = useState(true);
  const [reputation, setReputation] = useState(null);
  const [pageError, setPageError] = useState('');

  const getAuthHeaders = async () => {
    const token = await getToken();
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const loadData = async () => {
    if (!isLoaded || !isSignedIn) return;
    const headers = await getAuthHeaders();
    if (!headers) return;

    const [itemsResult, matchesResult, reputationResult] = await Promise.allSettled([
      apiFetch('/api/items/mine', { headers }),
      apiFetch('/api/matches', { headers }),
      apiFetch('/api/reputation/me', { headers })
    ]);

    if (itemsResult.status === 'fulfilled') {
      setItems(itemsResult.value);
    } else {
      setItems([]);
    }

    if (matchesResult.status === 'fulfilled') {
      setMatches(matchesResult.value);
    } else {
      setMatches([]);
    }

    if (reputationResult.status === 'fulfilled') {
      setReputation(reputationResult.value);
    } else {
      setReputation({ score: 0, badges: [] });
    }

    if (
      itemsResult.status === 'rejected'
      && matchesResult.status === 'rejected'
      && reputationResult.status === 'rejected'
    ) {
      setPageError('Dashboard data load nahi ho paaya. Please server restart karke try karo.');
    } else {
      setPageError('');
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    loadData()
      .catch(() => setPageError('Dashboard data load nahi ho paaya. Please try again.'))
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn]);

  const handleConfirm = async (matchId) => {
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      await apiFetch(`/api/matches/${matchId}/confirm`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      });
      await loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCreateClaim = async (matchId) => {
    try {
      const proofText = window.prompt('Enter proof details (bill number, extra description, identifiers):');
      if (!proofText) return;
      const headers = await getAuthHeaders();
      if (!headers) return;
      await apiFetch(`/api/claims/${matchId}`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ proofText })
      });
      alert('Claim submitted for owner review.');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRunMatching = async () => {
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      await apiFetch('/api/matches/run', {
        method: 'POST',
        headers
      });
      await loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const currentItems = items.filter((item) => {
    if (tab === 'lost') return item.type === 'Lost';
    if (tab === 'found') return item.type === 'Found';
    return false;
  });

  if (loading) {
    return <div className="centered-panel glass-card">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-stack">
      <div className="section-heading">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">Track your reports, run the matcher again, and open recovery chats from one place.</p>
          {pageError && <p className="badge badge-danger" style={{ marginTop: '0.5rem' }}>{pageError}</p>}
          {reputation && (
            <p className="text-muted">
              Trust score: <strong>{reputation.score}</strong> | Badges: {reputation.badges?.join(', ') || 'No badges yet'}
            </p>
          )}
        </div>
        <button type="button" className="btn btn-outline" onClick={handleRunMatching}>
          <RefreshCw size={16} /> Run Matching Again
        </button>
      </div>

      <div className="tab-row">
        <button type="button" className={`tab-pill ${tab === 'lost' ? 'active' : ''}`} onClick={() => setTab('lost')}>My Lost Items</button>
        <button type="button" className={`tab-pill ${tab === 'found' ? 'active' : ''}`} onClick={() => setTab('found')}>My Found Items</button>
        {matches.length > 0 && <button type="button" className={`tab-pill ${tab === 'matches' ? 'active' : ''}`} onClick={() => setTab('matches')}>Matched Items</button>}
      </div>

      {tab !== 'matches' && (
        <div className="card-grid">
          {currentItems.length === 0 && (
            <article className="glass-card centered-panel">No items yet in this section.</article>
          )}
          {currentItems.map((item) => (
            <article key={item._id} className="glass-card item-card">
              {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="item-thumb" /> : <div className="item-thumb placeholder-thumb">No image</div>}
              <div className="item-card-body">
                <div className="item-card-topline">
                  <span className={`badge ${item.type === 'Lost' ? 'badge-danger' : 'badge-success'}`}>{item.type}</span>
                  <span className="badge badge-neutral">{item.status}</span>
                </div>
                <h3>{item.title}</h3>
                <p className="text-muted">{item.description}</p>
                <p>{item.category} - {item.brand || 'No brand listed'}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === 'matches' && (
        <div className="match-grid">
          {matches.length === 0 && (
            <article className="glass-card centered-panel">No matches yet. Try "Run Matching Again".</article>
          )}
          {matches.map((match) => (
            <article key={match._id} className="glass-card match-card">
              <div className="match-pair">
                {[match.lostItem, match.foundItem].map((item) => (
                  <div key={item._id} className="pair-column">
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="item-thumb" /> : <div className="item-thumb placeholder-thumb">No image</div>}
                    <span className={`badge ${item.type === 'Lost' ? 'badge-danger' : 'badge-success'}`}>{item.type}</span>
                    <h3>{item.title}</h3>
                    <p className="text-muted">{item.description}</p>
                  </div>
                ))}
              </div>
              <div className="match-actions">
                <span className="badge badge-neutral">Score {match.score}</span>
                <span className="badge badge-neutral">{match.status}</span>
                <Link to={`/chat/${match._id}`} className="btn btn-outline"><MessageSquare size={16} /> Start Chat</Link>
                <button type="button" className="btn btn-primary" onClick={() => handleConfirm(match._id)}>Claim Item</button>
                <button type="button" className="btn btn-outline" onClick={() => handleCreateClaim(match._id)}>Submit Proof</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="container page-shell">
      <SignedOut>
        <div className="glass-card centered-panel">
          <h2>Sign in to access your dashboard</h2>
          <p className="text-muted">Your reports, matches, and chat threads appear here once you're authenticated.</p>
          <Link to="/sign-in" className="btn btn-primary">Go to Login</Link>
        </div>
      </SignedOut>
      <SignedIn>
        <DashboardContent />
      </SignedIn>
    </div>
  );
}
