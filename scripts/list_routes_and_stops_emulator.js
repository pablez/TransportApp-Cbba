/* Lista todos los documentos en `routes` y sus subcolecciones `stops` en el emulador.
Usage:
  node scripts/list_routes_and_stops_emulator.js --project <projectId>
*/

const admin = require('firebase-admin');

const raw = process.argv.slice(2);
let projectId = 'transportapp-cochabamba';
for (let i = 0; i < raw.length; i++) {
  if (raw[i] === '--project' && raw[i+1]) { projectId = raw[i+1]; }
  if (raw[i].startsWith('--project=')) { projectId = raw[i].split('=')[1]; }
}

// If running in emulator, avoid loading real credentials
if (process.env.FIRESTORE_EMULATOR_HOST && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

admin.initializeApp({ projectId });
const db = admin.firestore();

(async () => {
  try {
    console.log(`Emulator mode: using projectId=${projectId}`);
    const snap = await db.collection('routes').get();
    console.log(`Found ${snap.size} routes:`);
    for (const doc of snap.docs) {
      console.log('---');
      console.log('route id:', doc.id);
      console.log(JSON.stringify(doc.data(), null, 2));
      const stopsSnap = await db.collection('routes').doc(doc.id).collection('stops').orderBy('order').get();
      console.log(`  stops: ${stopsSnap.size}`);
      for (const s of stopsSnap.docs) {
        console.log('   -', s.id, JSON.stringify(s.data(), null, 2));
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('Error listing routes and stops:', err);
    process.exit(2);
  }
})();
