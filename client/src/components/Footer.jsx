import React from 'react';
import { Link } from 'react-router-dom';

const CONTACT = {
  name: 'Anmol Dubey',
  linkedin: 'https://www.linkedin.com/in/anmol23/',
  email: 'mailto:anmoldubey2310@gmail.com'
};

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-shell">
        <div>
          <p className="footer-eyebrow">Lost & Found Platform</p>
          <h3 style={{ marginBottom: '0.75rem' }}>Built to turn nearby reports into real recoveries.</h3>
          <p className="text-muted" style={{ maxWidth: '36rem' }}>
            Report items, surface likely matches, and coordinate safe handoffs between owners,
            finders, and police teams.
          </p>
        </div>
        <div className="footer-links">
          <Link to="/report">Report Item</Link>
          <Link to="/matches">Live Map</Link>
          <Link to="/police-portal">Police Portal</Link>
          <a href={CONTACT.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
          <a href={CONTACT.email}>Email</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>Made by {CONTACT.name}</span>
        <span>Copyright {new Date().getFullYear()} Findr</span>
      </div>
    </footer>
  );
}
