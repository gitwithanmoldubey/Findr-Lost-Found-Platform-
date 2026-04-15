import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { ShieldCheck, Siren } from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { apiFetch } from '../lib/api';
import { defaultMarkerIcon } from '../lib/map';
import { useTheme } from '../lib/theme';

L.Marker.prototype.options.icon = defaultMarkerIcon;

export default function PolicePortal() {
  const { getToken } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [stationData, setStationData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { darkMode } = useTheme();

  const loadData = async () => {
    const [incidentData, nearestStation, analyticsData] = await Promise.all([
      apiFetch('/api/police/incidents'),
      apiFetch('/api/police/nearest'),
      apiFetch('/api/analytics/admin')
    ]);
    setIncidents(incidentData);
    setStationData(nearestStation);
    setAnalytics(analyticsData);
  };

  useEffect(() => {
    loadData().catch((error) => console.error(error)).finally(() => setLoading(false));
  }, []);

  const updatePoliceStatus = async (id, policeStatus) => {
    try {
      const token = await getToken();
      await apiFetch(`/api/police/incidents/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ policeStatus })
      });
      await loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const center = incidents[0]?.location?.coordinates
    ? [incidents[0].location.coordinates[1], incidents[0].location.coordinates[0]]
    : [28.6139, 77.2090];

  return (
    <div className="container page-shell">
      <div className="section-heading">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Siren color="var(--danger)" /> Police Portal</h1>
          <p className="text-muted">Monitor theft-flagged reports, update case status, and review nearest-station simulation data.</p>
        </div>
        <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--danger)' }}>{incidents.length}</div>
          <div className="text-muted">Active flags</div>
        </div>
      </div>
      {analytics && (
        <div className="card-grid" style={{ marginBottom: '1rem' }}>
          <article className="glass-card"><h3>{analytics.totalLostItems}</h3><p className="text-muted">Total lost items</p></article>
          <article className="glass-card"><h3>{analytics.totalFoundItems}</h3><p className="text-muted">Total found items</p></article>
          <article className="glass-card"><h3>{analytics.matchSuccessRate}%</h3><p className="text-muted">Match success rate</p></article>
          <article className="glass-card"><h3>{analytics.activeUsers}</h3><p className="text-muted">Active users</p></article>
        </div>
      )}

      <div className="police-grid">
        <div className="map-frame map-tall">
          {loading ? <div className="centered-panel">Loading secure view...</div> : (
            <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }}>
              <TileLayer url={darkMode ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'} />
              {incidents.map((item) => {
                if (!item.location?.coordinates) return null;
                const [lng, lat] = item.location.coordinates;
                return (
                  <Marker key={item._id} position={[lat, lng]}>
                    <Popup>
                      <strong>{item.title}</strong>
                      <br />
                      AI confidence: {item.aiConfidence}%
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>

        <div className="glass-card nearest-station-card">
          <p className="badge badge-neutral">Simulated nearest station</p>
          {stationData && (
            <>
              <h3 style={{ marginTop: '1rem' }}>{stationData.nearestStation.name}</h3>
              <p className="text-muted">Approx. distance {stationData.nearestStation.distanceKm} km from the selected hotspot.</p>
              <div className="station-list">
                {stationData.alternatives.map((station) => (
                  <div key={station.name} className="station-row">
                    <span>{station.name}</span>
                    <span className="text-muted">{station.distanceKm} km</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="list-stack" style={{ marginTop: '2rem' }}>
        {incidents.map((item) => (
          <article key={item._id} className="glass-card incident-card">
            {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="item-thumb incident-thumb" /> : <div className="item-thumb incident-thumb placeholder-thumb">No image</div>}
            <div className="incident-body">
              <div className="item-card-topline">
                <strong>{item.title}</strong>
                <span className="badge badge-danger"><ShieldCheck size={14} /> {item.aiConfidence}% confidence</span>
              </div>
              <p className="text-muted">{item.description}</p>
              <p>{item.category} - {item.contactInfo}</p>
              <div className="action-row">
                <button type="button" className="btn btn-outline" onClick={() => updatePoliceStatus(item._id, 'investigating')}>Under Investigation</button>
                <button type="button" className="btn btn-primary" onClick={() => updatePoliceStatus(item._id, 'recovered')}>Mark as Recovered</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
