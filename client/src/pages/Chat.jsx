import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SignedIn, SignedOut, useAuth, useUser } from '@clerk/clerk-react';
import { SendHorizontal } from 'lucide-react';
import { apiFetch } from '../lib/api';

function ChatContent() {
  const { matchId } = useParams();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [match, setMatch] = useState(null);
  const [text, setText] = useState('');

  const loadChat = useCallback(async () => {
    const token = await getToken();
    const data = await apiFetch(`/api/chat/${matchId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    setMessages(data.messages);
    setMatch(data.match);
  }, [getToken, matchId]);

  useEffect(() => {
    loadChat().catch((error) => alert(error.message));
    const intervalId = setInterval(() => {
      loadChat().catch(() => {});
    }, 3000);

    return () => clearInterval(intervalId);
  }, [loadChat]);

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!text.trim()) return;

    try {
      const token = await getToken();
      await apiFetch(`/api/chat/${matchId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
      setText('');
      await loadChat();
    } catch (error) {
      alert(error.message);
    }
  };

  if (!match) {
    return <div className="glass-card centered-panel">Loading chat...</div>;
  }

  return (
    <div className="chat-layout">
      <div className="glass-card">
        <p className="text-muted">Match context</p>
        <div className="match-pair">
          {[match.lostItem, match.foundItem].map((item) => (
            <div key={item._id} className="pair-column compact">
              <span className={`badge ${item.type === 'Lost' ? 'badge-danger' : 'badge-success'}`}>{item.type}</span>
              <h3>{item.title}</h3>
              <p className="text-muted">{item.category} - {item.brand || 'No brand listed'}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card chat-card">
        <div className="chat-stream">
          {messages.map((message) => {
            const mine = message.sender === user?.id;
            return (
              <div key={message._id} className={`chat-row ${mine ? 'mine' : ''}`}>
                <div className={`chat-bubble ${mine ? 'mine' : ''}`}>
                  <p>{message.text}</p>
                  <span className="text-muted">{new Date(message.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            );
          })}
        </div>
        <form onSubmit={sendMessage} className="chat-form">
          <input value={text} onChange={(event) => setText(event.target.value)} className="form-control" placeholder="Write a message about pickup, proof, or handoff details..." />
          <button type="submit" className="btn btn-primary"><SendHorizontal size={16} /> Send</button>
        </form>
      </div>
    </div>
  );
}

export default function Chat() {
  return (
    <div className="container page-shell">
      <SignedOut>
        <div className="glass-card centered-panel">
          <h2>Sign in to continue this conversation</h2>
          <Link to="/sign-in" className="btn btn-primary">Go to Login</Link>
        </div>
      </SignedOut>
      <SignedIn>
        <ChatContent />
      </SignedIn>
    </div>
  );
}
