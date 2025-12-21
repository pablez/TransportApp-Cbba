import { GeoPoint } from 'firebase/firestore';

export function geoPointToLatLng(gp) {
  if (!gp) return null;
  // Firestore GeoPoint in web SDK has .latitude and .longitude
  const lat = gp.latitude ?? gp.lat ?? (gp._lat ?? null) ?? null;
  const lng = gp.longitude ?? gp.lng ?? (gp._long ?? null) ?? null;
  if (lat == null || lng == null) return null;
  return { latitude: Number(lat), longitude: Number(lng) };
}

export function normalizePath(pathArray) {
  if (!Array.isArray(pathArray)) return [];
  const out = [];
  for (const p of pathArray) {
    const latlng = geoPointToLatLng(p);
    if (latlng) out.push(latlng);
  }
  return out;
}

export function fromLngLatArray(coords) {
  if (!Array.isArray(coords)) return [];
  return coords.map(([lng, lat]) => ({ latitude: Number(lat), longitude: Number(lng) }));
}

// Helper to convert legacy coordinates objects {lat,lng} into GeoPoint if needed
export function toGeoPointObj(obj) {
  if (!obj) return null;
  const lat = obj.latitude ?? obj.lat ?? null;
  const lng = obj.longitude ?? obj.lng ?? null;
  if (lat == null || lng == null) return null;
  return new GeoPoint(Number(lat), Number(lng));
}
