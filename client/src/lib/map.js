import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

export const defaultMarkerIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41]
});

export function getStatusMarker(type) {
  const color = type === 'Lost' ? '#ef4444' : '#10b981';

  return L.divIcon({
    className: 'custom-map-marker',
    html: `<span style="display:block;width:18px;height:18px;border-radius:999px;background:${color};border:3px solid rgba(255,255,255,0.85);box-shadow:0 10px 24px rgba(0,0,0,0.28);"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
}
