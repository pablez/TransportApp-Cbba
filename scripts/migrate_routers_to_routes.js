#!/usr/bin/env node
/*
  Script de migración: routers -> routes
  - modo dry-run por defecto (no escribe)
  - usar --apply para ejecutar los writes
  - copia los docs originales a `routes_backup/{id}` si --backup
  - batching con límite seguro
  - soporta FIRESTORE_EMULATOR_HOST

  Uso:
    node scripts/migrate_routers_to_routes.js         # dry-run
    node scripts/migrate_routers_to_routes.js --apply --backup

  Recomendado: probar en Firebase Emulator antes de producción.
*/

const admin = require('firebase-admin');
const fs = require('fs');
const { argv } = require('process');

const APPLY = argv.includes('--apply');
const BACKUP = argv.includes('--backup');
const BATCH_LIMIT = 400; // seguridad < 500
const PROJECT_ARG = (argv.find(a => a.startsWith('--project=')) || '').split('=')[1];
const KEY_ARG = (argv.find(a => a.startsWith('--key=')) || '').split('=')[1] || process.env.GOOGLE_APPLICATION_CREDENTIALS || null;
const PROJECT_ID = PROJECT_ARG
  || process.env.GCLOUD_PROJECT
  || process.env.GOOGLE_CLOUD_PROJECT
  || process.env.FIREBASE_PROJECT_ID
  || process.env.GCLOUD_PROJECT_ID
  || null;

function initAdmin() {
  const usingEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
  
  if (!admin.apps.length) {
    if (usingEmulator) {
      // Emulador: no necesita credenciales, pero sí projectId explícito
      // Limpiar GOOGLE_APPLICATION_CREDENTIALS para evitar conflictos
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      console.log('🔧 Emulator mode: using projectId=%s', PROJECT_ID || 'demo-project');
      admin.initializeApp({ projectId: PROJECT_ID || 'demo-project' });
    } else {
      // Producción: preferir key explícita (--key or env GOOGLE_APPLICATION_CREDENTIALS)
      if (KEY_ARG) {
        if (!fs.existsSync(KEY_ARG)) {
          console.error('ERROR: credentials file not found:', KEY_ARG);
          console.error('Set a valid path with --key=path/to/key.json or set GOOGLE_APPLICATION_CREDENTIALS to a valid file.');
          process.exit(2);
        }
        console.log('☁️  Production mode: using service account key from', KEY_ARG);
        const opts = { credential: admin.credential.cert(KEY_ARG) };
        if (PROJECT_ID) opts.projectId = PROJECT_ID;
        admin.initializeApp(opts);
      } else {
        // fall back to application default credentials (gcloud ADC)
        try {
          console.log('☁️  Production mode: using application default credentials');
          const opts = { credential: admin.credential.applicationDefault() };
          if (PROJECT_ID) opts.projectId = PROJECT_ID;
          admin.initializeApp(opts);
        } catch (e) {
          console.error('ERROR: no credentials found. Provide a service account key with --key=path or run:');
          console.error('  gcloud auth application-default login');
          process.exit(2);
        }
      }
    }
  }
  
  const db = admin.firestore();
  // Facilitar debugging de nulos/undefined durante migración
  db.settings({ ignoreUndefinedProperties: true });
  console.log('✅ Firestore init -> emulator=%s, projectId=%s', usingEmulator, PROJECT_ID || '(auto)');
  return db;
}

function toTimestamp(value) {
  if (!value) return null;
  if (value instanceof admin.firestore.Timestamp) return value;
  if (typeof value === 'string') {
    const d = new Date(value);
    if (!isNaN(d)) return admin.firestore.Timestamp.fromDate(d);
  }
  if (typeof value === 'number') {
    // assume epoch ms
    return admin.firestore.Timestamp.fromMillis(value);
  }
  return null;
}

function toGeoPoint(item) {
  // Accept both {lat, lng} and [lng, lat]
  if (!item) return null;
  // object with latitude/longitude
  if (item.latitude != null && item.longitude != null) {
    return new admin.firestore.GeoPoint(Number(item.latitude), Number(item.longitude));
  }
  // object with lat/lng (lowercase)
  if (item.lat != null && item.lng != null) {
    return new admin.firestore.GeoPoint(Number(item.lat), Number(item.lng));
  }
  // array coordinates like [lng, lat] or [lat, lng] — try to detect
  if (Array.isArray(item) && item.length >= 2) {
    const a0 = Number(item[0]);
    const a1 = Number(item[1]);
    if (!isNaN(a0) && !isNaN(a1)) {
      // assume format [lng, lat] (common in some sources)
      // but fallback: if values are within lat range (-90..90) assume [lat, lng]
      if (Math.abs(a0) <= 90 && Math.abs(a1) <= 180) {
        // a0 likely lat, a1 likely lng
        return new admin.firestore.GeoPoint(a0, a1);
      }
      // otherwise treat as [lng, lat]
      return new admin.firestore.GeoPoint(a1, a0);
    }
  }
  // coordinates property as array on item: coordinates: [ {lat,lng}, ... ]
  if (item.coordinates && Array.isArray(item.coordinates) && item.coordinates.length) {
    const c = item.coordinates[0];
    if (c) return toGeoPoint(c);
  }
  return null;
}

async function migrate() {
  const db = initAdmin();
  console.log('Starting migration (apply=%s, backup=%s)', APPLY, BACKUP);

  // Fuente legacy: `routes` (si tu proyecto ya usa `routes`) — ajustar si necesitas otra colección
  const sourceRef = db.collection('routes');
  const snapshot = await sourceRef.get();
  console.log('Found %d source documents', snapshot.size);

  let batch = db.batch();
  let ops = 0;
  let migrated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const id = doc.id;

    // Build new route doc
    const route = {};
    route.name = data.name || data.title || '';
    if (data.color) route.color = data.color;
    if (data.fareBase != null) route.fareBase = Number(data.fareBase);
    route.public = !!data.public;
    route.createdBy = data.createdBy || null;
    const createdAt = toTimestamp(data.createdAt);
    if (createdAt) route.createdAt = createdAt;
    route.schemaVersion = 1;

    // geometry: derive from coordinates or points
    const path = [];
    if (Array.isArray(data.coordinates) && data.coordinates.length) {
      // coordinates likely array of {lat,lng}
      for (const c of data.coordinates) {
        const gp = toGeoPoint(c);
        if (gp) path.push(gp);
      }
    }
    if (path.length) route.path = path;

    // Prepare writes
    const routeRef = db.collection('routes').doc(id);

    if (APPLY) {
      batch.set(routeRef, route, { merge: true });
      ops++;
    } else {
      console.log('[dry-run] would create route', id, JSON.stringify(route, null, 2));
    }

    // convert points -> subcollection stops
    if (Array.isArray(data.points) && data.points.length) {
      let order = 0;
      for (const p of data.points) {
        const stop = {};
        stop.name = p.name || `stop-${order}`;
        stop.street = p.street || null;
        stop.order = order;
        const gp = toGeoPoint(p);
        if (gp) stop.location = gp;

        const stopRef = routeRef.collection('stops').doc();
        if (APPLY) {
          batch.set(stopRef, stop);
          ops++;
        } else {
          console.log('[dry-run] would create stop for route', id, JSON.stringify(stop, null, 2));
        }
        order++;

        if (ops >= BATCH_LIMIT) {
          console.log('Committing batch of %d ops...', ops);
          await batch.commit();
          batch = db.batch();
          ops = 0;
        }
      }
    }

    // optional backup of original
    if (BACKUP && APPLY) {
      const backupRef = db.collection('routes_backup').doc(id);
      batch.set(backupRef, data, { merge: true });
      ops++;
    }

    migrated++;
  }

  if (APPLY && ops > 0) {
    console.log('Committing final batch of %d ops...', ops);
    await batch.commit();
  }

  console.log('Migration finished. Processed %d router documents.', migrated);
  if (!APPLY) console.log('Dry-run complete. Rerun with --apply to perform writes.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

module.exports = { migrate };