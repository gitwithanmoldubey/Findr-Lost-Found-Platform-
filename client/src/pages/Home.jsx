import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Camera, MapPinned, Search, ShieldAlert, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const showcaseImages = [
    'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80'
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55 } }
  };

  return (
    <div style={{ overflowX: 'hidden' }}>
      <section className="container home-hero">
        <div className="hero-grid">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <p className="badge badge-neutral" style={{ marginBottom: '1rem' }}>Smart matching + safe recovery workflow</p>
            <h1 className="hero-title">Lost it nearby? Let the right people find it faster.</h1>
            <p className="hero-copy">
              Findr helps owners, finders, and police teams coordinate around location signals,
              title similarity, and item evidence instead of scattered messages.
            </p>
            <div className="cta-group">
              <Link to="/report?type=lost" className="btn btn-outline">
                <AlertCircle size={18} /> I Lost Something
              </Link>
              <Link to="/report?type=found" className="btn btn-primary">
                <Search size={18} /> I Found Something
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="hero-panel glass-card">
            <div className="hero-panel-grid">
              <div>
                <p className="text-muted">Active workflow</p>
                <h3>Report, match, chat, recover.</h3>
              </div>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="status-dot status-dot-danger"></span>
                  <strong>Lost item posted</strong>
                  <p className="text-muted">Location and title become searchable signals.</p>
                </div>
                <div className="stat-card">
                  <span className="status-dot status-dot-success"></span>
                  <strong>Found report lands nearby</strong>
                  <p className="text-muted">Smart matching scores the likely pair automatically.</p>
                </div>
                <div className="stat-card">
                  <span className="status-dot"></span>
                  <strong>Safe handoff</strong>
                  <p className="text-muted">Users can confirm matches and chat inside the app.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="feature-band">
        <div className="container">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="glass-card journey-shell">
            <div className="journey-header">
              <p className="badge badge-neutral">
              <Sparkles size={14} /> Recovery Journey
            </p>
              <h2>More visual, faster, and safer recovery flow.</h2>
            </div>
            <div className="journey-content">
              <div className="timeline-grid">
                <article className="timeline-card">
                  <div className="timeline-step">01</div>
                  <h3>Report with proof</h3>
                  <p className="text-muted">Add photos, exact location, and key details.</p>
                </article>
                <article className="timeline-card">
                  <div className="timeline-step">02</div>
                  <h3>AI + location matching</h3>
                  <p className="text-muted">System checks nearby reports automatically.</p>
                </article>
                <article className="timeline-card">
                  <div className="timeline-step">03</div>
                  <h3>Claim verification</h3>
                  <p className="text-muted">Owner verifies proof before contact sharing.</p>
                </article>
                <article className="timeline-card">
                  <div className="timeline-step">04</div>
                  <h3>Safe handoff</h3>
                  <p className="text-muted">Recovered item closes the loop with trust score.</p>
                </article>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 22 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="journey-image-column"
              >
                <div className="journey-image-card">
                  <img src={showcaseImages[0]} alt="Recovered bag example" />
                </div>
                <div className="journey-image-card small">
                  <img src={showcaseImages[1]} alt="Recovered phone example" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="feature-band colorful-band">
        <div className="container image-feature-grid">
          <motion.article variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="image-feature-card">
            <img src={showcaseImages[2]} alt="Colorful recovery highlight" />
            <div className="image-feature-content">
              <p className="badge badge-neutral"><Camera size={14} /> Visual-first reports</p>
              <h3>Image-rich listings improve matching quality.</h3>
              <p className="text-muted">More photos + better metadata = faster shortlisting.</p>
            </div>
          </motion.article>
          <motion.article variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="image-feature-card">
            <div className="image-feature-content">
              <p className="badge badge-neutral"><ShieldAlert size={14} /> Safety mode</p>
              <h3>Fraud-resistant claim flow built into dashboard.</h3>
              <p className="text-muted">Proof request + owner approval makes handoff safer.</p>
              <Link to="/dashboard" className="btn btn-primary">Open Dashboard</Link>
            </div>
          </motion.article>
          <motion.article variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="image-feature-card gradient">
            <div className="image-feature-content">
              <p className="badge badge-neutral"><MapPinned size={14} /> Geo smart</p>
              <h3>Location maps + colorful cards + live updates.</h3>
              <p className="text-muted">Scroll and discover reports in a cleaner visual layout.</p>
            </div>
          </motion.article>
        </div>
      </section>

      <section className="floating-band">
        <div className="container floating-shell">
          <div className="floating-orb orb-one"></div>
          <div className="floating-orb orb-two"></div>
          <div className="floating-orb orb-three"></div>
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="glass-card final-cta"
          >
            <h2>Ready to recover items faster?</h2>
            <p className="text-muted">
              Start with one report. The system will handle discovery, matching, claim verification, and secure coordination.
            </p>
            <div className="cta-group">
              <Link to="/report?type=lost" className="btn btn-outline">
                <AlertCircle size={18} /> Report Lost Item
              </Link>
              <Link to="/matches" className="btn btn-primary">
                <Search size={18} /> Explore Live Matches
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
