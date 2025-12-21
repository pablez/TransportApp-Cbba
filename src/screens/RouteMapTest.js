import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import MapView, { Polyline, Marker, UrlTile } from 'react-native-maps';
import rnPath from '../data/rn_path.json';
import tokens from '../styles/designTokens';
import { collection, doc, getDoc, getFirestore } from 'firebase/firestore';
import { initializeAppIfNeeded, firebaseApp } from '../config/firebase';
import { normalizePath, fromLngLatArray } from '../utils/geo';
import LocationService from '../services/LocationService';

export default function RouteMapTest({ route, navigation }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [path, setPath] = useState([]);
  const [stops, setStops] = useState([]);

  const routeId = route?.params?.routeId ?? null;

  useEffect(() => {
    let app = null;
    try {
      app = initializeAppIfNeeded();
    } catch (e) {
      // already initialized or error
      app = firebaseApp;
    }

    const db = getFirestore(app);

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // If no routeId provided, use local test path (rn_path.json)
        if (!routeId) {
          if (Array.isArray(rnPath) && rnPath.length > 0) {
            setPath(rnPath);
            setLoading(false);
            return;
          } else {
            setError('No routeId provided and local test path is empty.');
            setLoading(false);
            return;
          }
        }
        const docRef = doc(db, 'routes', routeId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          setError('Route not found: ' + routeId);
          setLoading(false);
          return;
        }
        const data = snap.data();
        const normalized = normalizePath(data.path ?? data.coordinates ?? data.points ?? []);
        setPath(normalized);

        // If no stored path, try to calculate via OpenRouteService using stops or coordinates
        if ((!normalized || normalized.length === 0)) {
          try {
            // Prefer explicit stops subcollection first
            let start = null;
            let end = null;
            if (data.stops && Array.isArray(data.stops) && data.stops.length >= 2) {
              start = { latitude: data.stops[0].location?.latitude ?? data.stops[0].lat, longitude: data.stops[0].location?.longitude ?? data.stops[0].lng };
              const last = data.stops[data.stops.length - 1];
              end = { latitude: last.location?.latitude ?? last.lat, longitude: last.location?.longitude ?? last.lng };
            } else if (Array.isArray(data.coordinates) && data.coordinates.length >= 2) {
              // coordinates may be stored as [[lng,lat], ...]
              const first = data.coordinates[0];
              const last = data.coordinates[data.coordinates.length - 1];
              start = { latitude: first[1], longitude: first[0] };
              end = { latitude: last[1], longitude: last[0] };
            }

            if (start && end) {
              const routeRes = await LocationService.getOptimalRoute(start, end, 'driving-car');
              // Log whether proxy or direct ORS was used (LocationService logs too)
              console.log('RouteMapTest: routeRes source info', { success: routeRes.success, coordsCount: Array.isArray(routeRes.coordinates) ? routeRes.coordinates.length : 0 });
              if (routeRes.success && Array.isArray(routeRes.coordinates)) {
                const converted = fromLngLatArray(routeRes.coordinates);
                setPath(converted);
              }
            }
          } catch (e) {
            console.warn('No se pudo calcular ruta con ORS:', e.message || e);
          }
        }

        // load stops subcollection if present
        try {
          const stopsCol = collection(db, `routes/${routeId}/stops`);
          const stopsSnap = await (await import('firebase/firestore')).getDocs(stopsCol);
          const stopsList = [];
          stopsSnap.forEach(s => stopsList.push({ id: s.id, ...s.data() }));
          setStops(stopsList);
        } catch (e) {
          // ignore if no stops
        }

        setLoading(false);
      } catch (e) {
        setError(e.message || String(e));
        setLoading(false);
      }
    }

    load();
  }, [routeId]);

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color={tokens.COLORS.primary} /></View>
  );

  if (error) return (
    <View style={styles.center}><Text style={styles.error}>{error}</Text></View>
  );

  const initialRegion = path.length > 0 ? {
    latitude: path[0].latitude,
    longitude: path[0].longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  } : { latitude: -17.385, longitude: -66.156, latitudeDelta: 0.2, longitudeDelta: 0.2 };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion}>
        {/* Tile layer via local proxy to ORS (set ORS_TILES_URL in proxy env) */}
        <UrlTile
          urlTemplate="http://localhost:8080/tiles/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
        {path.length > 0 && (
          <Polyline coordinates={path} strokeWidth={4} strokeColor={tokens.COLORS.primary} />
        )}
        {stops.map(s => {
          const lat = s.location?.latitude ?? s.lat ?? s.latitude;
          const lng = s.location?.longitude ?? s.lng ?? s.longitude;
          if (lat == null || lng == null) return null;
          return (
            <Marker key={s.id} coordinate={{ latitude: Number(lat), longitude: Number(lng) }} title={s.name ?? s.title ?? ''} />
          );
        })}
      </MapView>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Route: {routeId}</Text>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: 'red', padding: 16 },
  footer: { padding: tokens.SPACING.md, backgroundColor: tokens.COLORS.surface, alignItems: 'center' },
  footerText: { color: tokens.COLORS.onSurface },
});
