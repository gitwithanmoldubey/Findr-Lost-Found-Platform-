import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, SignIn, SignUp, UserButton, useUser } from '@clerk/clerk-react';
import { LayoutDashboard, MapPin, Moon, Sun } from 'lucide-react';
import Home from './pages/Home';
import Report from './pages/Report';
import Matches from './pages/Matches';
import PolicePortal from './pages/PolicePortal';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Footer from './components/Footer';
import { ThemeContext, useTheme } from './lib/theme';
import { connectSocket } from './lib/socket';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key');
}

function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('findr-theme') !== 'light');

  useEffect(() => {
    document.body.classList.toggle('light-mode', !darkMode);
    localStorage.setItem('findr-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const value = useMemo(() => ({
    darkMode,
    toggleTheme: () => setDarkMode((current) => !current)
  }), [darkMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function ThemeToggle() {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      <span>{darkMode ? 'Light' : 'Dark'}</span>
    </button>
  );
}

function Navbar() {
  const location = useLocation();
  const { user } = useUser();

  return (
    <nav className="navbar glass">
      <div className="container nav-content">
        <Link to="/" className="logo nav-brand">
          <MapPin size={24} color="var(--primary)" />
          <span>Findr</span>
        </Link>
        <div className="nav-links nav-actions">
          <Link to="/report" className={`nav-link ${location.pathname === '/report' ? 'active' : ''}`}>Report Item</Link>
          <Link to="/matches" className={`nav-link ${location.pathname === '/matches' ? 'active' : ''}`}>Live Map</Link>
          <Link to="/police-portal" className={`nav-link ${location.pathname === '/police-portal' ? 'active' : ''}`}>Police Portal</Link>
          <SignedIn>
            <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
              <LayoutDashboard size={16} /> Dashboard
            </Link>
          </SignedIn>
          <div className="nav-user-block">
            <ThemeToggle />
            <SignedIn>
              {user && <span className="text-muted">Hi, {user.firstName || 'there'}</span>}
              <UserButton />
            </SignedIn>
            <SignedOut>
              <Link to="/sign-in" className="nav-link">Login</Link>
              <Link to="/sign-up" className="btn btn-primary btn-compact">Sign Up</Link>
            </SignedOut>
          </div>
        </div>
      </div>
    </nav>
  );
}

function AppShell() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user?.id) return undefined;
    const socket = connectSocket(user.id);
    if (!socket) return undefined;

    const handlers = ['match:found', 'match:claimed', 'claim:submitted', 'claim:reviewed'].map((eventName) => {
      const handler = (payload) => {
        setNotifications((current) => [payload, ...current].slice(0, 3));
      };
      socket.on(eventName, handler);
      return { eventName, handler };
    });

    return () => {
      handlers.forEach(({ eventName, handler }) => socket.off(eventName, handler));
    };
  }, [user?.id]);

  return (
    <Router>
      <Navbar />
      {notifications.length > 0 && (
        <div className="container" style={{ marginTop: '1rem' }}>
          <div className="glass-card" style={{ padding: '1rem' }}>
            {notifications.map((entry) => (
              <p key={`${entry.createdAt}-${entry.title}`} style={{ margin: '0.35rem 0' }}>
                <strong>{entry.title}:</strong> {entry.body}
              </p>
            ))}
          </div>
        </div>
      )}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<Report />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat/:matchId" element={<Chat />} />
          <Route path="/police-portal" element={<PolicePortal />} />
          <Route path="/sign-in/*" element={<div className="auth-shell"><SignIn routing="path" path="/sign-in" /></div>} />
          <Route path="/sign-up/*" element={<div className="auth-shell"><SignUp routing="path" path="/sign-up" /></div>} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </ClerkProvider>
  );
}
