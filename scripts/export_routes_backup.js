/* Exporta la colección `routes_backup` a `routes_backup_export.json`.
Usage:
  node scripts/export_routes_backup.js --project <projectId> --key="path/to/key.json"
*/

const fs = require('fs');
const admin = require('firebase-admin');

const raw = process.argv.slice(2);
let projectId = 'transportapp-cochabamba';
let keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || null;
for (let i = 0; i < raw.length; i++) {
  if (raw[i] === '--project' && raw[i+1]) projectId = raw[i+1];
  if (raw[i].startsWith('--project=')) projectId = raw[i].split('=')[1];
  if (raw[i].startsWith('--key=')) keyPath = raw[i].split('=')[1];
}

if (!keyPath) {
  console.error('ERROR: no service account key provided. Use --key=path/to/key.json or set GOOGLE_APPLICATION_CREDENTIALS');
  process.exit(2);
}
if (!fs.existsSync(keyPath)) {
  console.error('ERROR: key file not found:', keyPath);
  process.exit(2);
}

admin.initializeApp({ credential: admin.credential.cert(keyPath), projectId });
const db = admin.firestore();

(async () => {
  try {
    console.log('Exporting routes_backup...');
    const snapshot = await db.collection('routes_backup').get();
    const out = {};
    for (const doc of snapshot.docs) {
      out[doc.id] = doc.data();
      // also include any subcollections if needed (not expected for backup)
      const subcols = await db.collection('routes_backup').doc(doc.id).listCollections();
      if (subcols.length) {
        out[doc.id]['_subcollections'] = {};
        for (const c of subcols) {
          const csnap = await c.get();
          out[doc.id]['_subcollections'][c.id] = {};
          for (const sd of csnap.docs) {
            out[doc.id]['_subcollections'][c.id][sd.id] = sd.data();
          }
        }
      }
    }
    const filename = 'routes_backup_export.json';
    fs.writeFileSync(filename, JSON.stringify(out, null, 2));
    console.log('Export complete:', filename);
    process.exit(0);
  } catch (err) {
    console.error('Export failed:', err);
    process.exit(1);
  }
})();
