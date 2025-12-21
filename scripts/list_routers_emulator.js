/* Lista documentos en la colección `routes` usando Admin SDK. Diseñado para ejecutarse dentro de `firebase emulators:exec`.
Usage:
  node scripts/list_routes_emulator.js --project <projectId>
*/

const admin = require('firebase-admin');

// parse simple args
const raw = process.argv.slice(2);
let projectId = 'transportapp-cochabamba';
for (let i = 0; i < raw.length; i++) {
  if (raw[i] === '--project' && raw[i+1]) { projectId = raw[i+1]; }
  if (raw[i].startsWith('--project=')) { projectId = raw[i].split('=')[1]; }
}

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.warn('Warning: FIRESTORE_EMULATOR_HOST not set. This script is intended to run inside the emulator (emulators:exec).');
}

admin.initializeApp({ projectId });
const db = admin.firestore();

(async () => {
  try {
    console.log(`Emulator mode: using projectId=${projectId}`);
    const snapshot = await db.collection('routes').get();
    console.log(`Found ${snapshot.size} route document(s)`);
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('---');
      console.log('id:', doc.id);
      console.log(JSON.stringify(data, null, 2));
    });
    process.exit(0);
  } catch (err) {
    console.error('Error listing routes:', err);
    process.exit(2);
  }
})();
