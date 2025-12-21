/* Seed some legacy `routes` documents into Firestore emulator.
Usage:
  node scripts/seed_routes_emulator.js --project <projectId>
Designed to run inside `firebase emulators:exec`.
*/

const admin = require('firebase-admin');

const raw = process.argv.slice(2);
let projectId = 'transportapp-cochabamba';
for (let i = 0; i < raw.length; i++) {
  if (raw[i] === '--project' && raw[i+1]) { projectId = raw[i+1]; }
  if (raw[i].startsWith('--project=')) { projectId = raw[i].split('=')[1]; }
}

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.warn('Warning: FIRESTORE_EMULATOR_HOST not set. This script is intended to run inside the emulator (emulators:exec).');
}

// If running inside the emulator, ensure we don't try to read real credentials
if (process.env.FIRESTORE_EMULATOR_HOST) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('Emulator detected — clearing GOOGLE_APPLICATION_CREDENTIALS for local run');
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
}

admin.initializeApp({ projectId });
const db = admin.firestore();

(async () => {
  try {
    console.log('Seeding emulator with sample legacy routes...');

    const samples = [
      {
        id: 'legacy-1',
        data: {
          title: 'Linea 1',
          color: '#ff0000',
          fareBase: '2.5',
          public: true,
          createdBy: 'user_demo_1',
          createdAt: '2023-01-01T12:00:00Z',
          coordinates: [
            { latitude: -17.3933, longitude: -66.1568 },
            { latitude: -17.3940, longitude: -66.1575 }
          ],
          points: [
            { name: 'Parada A', street: 'C/ Principal', latitude: -17.3933, longitude: -66.1568 },
            { name: 'Parada B', street: 'Av Secundaria', latitude: -17.3940, longitude: -66.1575 }
          ]
        }
      },
      {
        id: 'legacy-2',
        data: {
          name: 'Ruta vieja',
          color: 'blue',
          fareBase: 3,
          public: false,
          createdBy: 'user_demo_2',
          createdAt: Date.now(),
          coordinates: [ { latitude: -17.3950, longitude: -66.1600 }, { latitude: -17.3960, longitude: -66.1610 } ],
          points: [
            { name: 'Stop X', street: null, latitude: -17.3950, longitude: -66.1600 }
          ]
        }
      }
    ];

    for (const s of samples) {
      await db.collection('routes').doc(s.id).set(s.data);
      console.log('Created sample route:', s.id);
    }

    const snap = await db.collection('routes').get();
    console.log('Total routes in emulator now:', snap.size);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(2);
  }
})();
