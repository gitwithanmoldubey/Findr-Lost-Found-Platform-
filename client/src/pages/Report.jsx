import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-react';
import { AlertTriangle, Upload } from 'lucide-react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { API_BASE } from '../lib/api';
import { defaultMarkerIcon } from '../lib/map';
import { useTheme } from '../lib/theme';

L.Marker.prototype.options.icon = defaultMarkerIcon;

const categories = ['Phone', 'Wallet', 'ID/Document', 'Keys', 'Bag', 'Electronics', 'Jewellery', 'Other'];
const theftKeywords = ['stolen', 'snatched', 'robbed', 'thief', 'gun', 'knife'];

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(event) {
      setPosition(event.latlng);
    }
  });

  return <Marker position={position} />;
}

export default function Report() {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'lost';
  const [type, setType] = useState(initialType);
  const [category, setCategory] = useState('Phone');
  const [position, setPosition] = useState({ lat: 28.6139, lng: 77.2090 });
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [description, setDescription] = useState('');
  const { darkMode } = useTheme();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const hasTheftWarning = useMemo(
    () => theftKeywords.some((keyword) => description.toLowerCase().includes(keyword)),
    [description]
  );

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    setImageFile(file || null);
    setPreviewUrl(file ? URL.createObjectURL(file) : '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('type', type === 'lost' ? 'Lost' : 'Found');
      formData.append('title', event.target.title.value);
      formData.append('category', category);
      formData.append('brand', event.target.brand.value);
      formData.append('description', event.target.description.value);
      formData.append('contactInfo', event.target.contactInfo.value);
      formData.append('lat', position.lat);
      formData.append('lng', position.lng);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await fetch(`${API_BASE}/api/items`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit report');
      }

      navigate('/dashboard');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-shell page-narrow">
      <h1 style={{ marginBottom: '0.5rem' }}>Report an Item</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>
        Add a clear title, identifying details, and the precise location so the matching engine has useful signals.
      </p>

      <SignedOut>
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Authentication Required</h2>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>
            Sign in with Clerk to publish a report and access the recovery dashboard.
          </p>
          <Link to="/sign-in" className="btn btn-primary">Login / Sign Up</Link>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="glass-card">
          <div className="type-selector">
            <button type="button" className={`type-btn lost ${type === 'lost' ? 'active' : ''}`} onClick={() => setType('lost')}>I Lost Something</button>
            <button type="button" className={`type-btn found ${type === 'found' ? 'active' : ''}`} onClick={() => setType('found')}>I Found Something</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Item Title</label>
              <input type="text" name="title" className="form-control" placeholder="Black iPhone 14 Pro with blue case" required />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select name="category" className="form-control" value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Brand / Reference</label>
              <input type="text" name="brand" className="form-control" placeholder="Apple, Samsonite, Titan, JBL..." />
            </div>

            <div className="form-group">
              <label className="form-label">Description & Identifying Marks</label>
              <textarea
                name="description"
                className="form-control"
                placeholder="Mention stickers, cracks, initials, contents, and what happened."
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
              {hasTheftWarning && (
                <div className="badge badge-danger" style={{ marginTop: '0.75rem' }}>
                  <AlertTriangle size={16} /> AI Theft Detection warning: this report may be escalated to the police portal.
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Upload Image</label>
              <label className="upload-box">
                <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                <Upload size={18} />
                <span>{imageFile ? imageFile.name : 'Choose an image (optional)'}</span>
              </label>
              {previewUrl && <img src={previewUrl} alt="Preview" className="preview-image" />}
            </div>

            <div className="form-group">
              <label className="form-label">Your Contact Number / Email</label>
              <input type="text" name="contactInfo" className="form-control" placeholder="So people can coordinate recovery" required />
            </div>

            <div className="form-group">
              <label className="form-label">Map Location</label>
              <div className="map-frame">
                <MapContainer center={[28.6139, 77.2090]} zoom={12} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url={darkMode ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'} />
                  <LocationMarker position={position} setPosition={setPosition} />
                </MapContainer>
              </div>
              <p className="text-muted" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                Current pin: {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
              </p>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>
      </SignedIn>
    </div>
  );
}
