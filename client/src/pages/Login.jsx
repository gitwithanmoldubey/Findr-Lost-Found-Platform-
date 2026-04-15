import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSub = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if(res.ok) {
        login(data.user, data.token);
        navigate('/');
      } else {
        setError(data.error);
      }
    } catch(err) {
      setError('Server Error');
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <UserCircle size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '1.5rem' }}>Welcome Back</h2>
        
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}
        
        <form onSubmit={handleSub} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="form-control" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="form-control" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Login</button>
        </form>

        <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent)' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
