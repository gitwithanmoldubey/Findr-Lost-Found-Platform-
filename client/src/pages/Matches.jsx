import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { apiFetch } from '../lib/api';
import { defaultMarkerIcon, getStatusMarker } from '../lib/map';
import { useTheme } from '../lib/theme';

L.Marker.prototype.options.icon = defaultMarkerIcon;

export default function Matches() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const { darkMode } = useTheme();
  const categories = ['Phone', 'Wallet', 'ID/Document', 'Keys', 'Bag', 'Electronics', 'Jewellery', 'Other'];
  const typeFilters = ['All', 'Lost', 'Found'];

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== 'All') params.set('type', filter);
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    params.set('sortBy', sortBy);

    apiFetch(`/api/items?${params.toString()}`)
      .then(setItems)
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, [filter, query, category, sortBy]);

  const center = items[0]?.location?.coordinates
    ? [items[0].location.coordinates[1], items[0].location.coordinates[0]]
    : [28.6139, 77.2090];

  return (
    <div className="container page-shell">
      <div className="section-heading">
        <div>
          <p className="text-muted">Browse all recent reports and filter them by loss or recovery type.</p>
        </div>
        <div className="tab-row">
          {typeFilters.map((option) => (
            <button key={option} type="button" className={`tab-pill ${filter === option ? 'active' : ''}`} onClick={() => setFilter(option)}>
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '1rem' }}>
        <div className="tab-row">
          <input className="form-control" placeholder="Search by title/brand/description" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((categoryOption) => (
              <option key={categoryOption} value={categoryOption}>{categoryOption}</option>
            ))}
          </select>
          <select className="form-control" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Newest</option>
            <option value="aiConfidence">AI Confidence</option>
          </select>
        </div>
      </div>

      <div className="map-frame map-tall">
        {loading ? (
          <div className="centered-panel">Loading map and cards...</div>
        ) : (
          <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }}>
            <TileLayer url={darkMode ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'} />
            {items.map((item) => {
              if (!item.location?.coordinates) return null;
              const [lng, lat] = item.location.coordinates;
              return (
                <Marker key={item._id} position={[lat, lng]} icon={getStatusMarker(item.type)}>
                  <Popup>
                    <strong>{item.type} - {item.category}</strong>
                    <br />
                    {item.title}
                    <br />
                    {item.brand || 'No brand listed'}
                    <br />
                    {item.contactInfo}
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>

      <div className="card-grid" style={{ marginTop: '2rem' }}>
        {items.map((item) => (
          <article key={item._id} className="glass-card item-card">
            {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="item-thumb" /> : <div className="item-thumb placeholder-thumb">No image</div>}
            <div className="item-card-body">
              <div className="item-card-topline">
                <span className={`badge ${item.type === 'Lost' ? 'badge-danger' : 'badge-success'}`}>{item.type}</span>
                <span className="text-muted">{new Date(item.date).toLocaleDateString()}</span>
              </div>
              <h3>{item.title}</h3>
              <p className="text-muted">{item.description}</p>
              <p><strong>{item.category}</strong> - {item.brand || 'Brand not provided'}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
