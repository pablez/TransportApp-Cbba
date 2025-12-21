/* Verifica la migración: compara `routes` con `routes_backup`.
Usage:
  node scripts/verify_migration.js --project <projectId> --key="path/to/key.json"
Outputs un resumen al stdout y un archivo `migration_report.json` en el directorio actual.
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

function isGeoPointLike(v) {
  return v && (typeof v.latitude === 'number' && typeof v.longitude === 'number')
    || (typeof v.lat === 'number' && typeof v.lng === 'number');
}

(async () => {
  try {
    const report = { checked: 0, issues: [], summary: {} };
    const routesSnap = await db.collection('routes').get();
    report.summary.totalRoutes = routesSnap.size;

    for (const doc of routesSnap.docs) {
      const id = doc.id;
      const data = doc.data();
      const itemReport = { id, problems: [] };

      // Check path
      if (!data.path || !Array.isArray(data.path) || data.path.length === 0) {
        itemReport.problems.push('missing_or_empty_path');
      } else {
        // check each element
        for (let i = 0; i < data.path.length; i++) {
          const p = data.path[i];
          if (!isGeoPointLike(p)) {
            itemReport.problems.push(`path_invalid_element_index_${i}`);
            break;
          }
        }
      }

      // If legacy coordinates exist, note
      if (data.coordinates) {
        if (!Array.isArray(data.coordinates)) itemReport.problems.push('coordinates_not_array');
        else {
          // check first element shape
          const c0 = data.coordinates[0];
          if (c0 && !isGeoPointLike(c0)) itemReport.problems.push('coordinates_elements_invalid');
        }
      }

      // Check stops subcollection
      const stopsSnap = await db.collection('routes').doc(id).collection('stops').get();
      if (stopsSnap.empty) {
        itemReport.problems.push('no_stops');
      } else {
        for (const s of stopsSnap.docs) {
          const sd = s.data();
          if (!sd.location || !isGeoPointLike(sd.location)) {
            itemReport.problems.push(`stop_${s.id}_missing_or_invalid_location`);
            break;
          }
          if (sd.order == null || typeof sd.order !== 'number') {
            itemReport.problems.push(`stop_${s.id}_missing_or_invalid_order`);
            break;
          }
        }
      }

      // Check backup presence
      const backupDoc = await db.collection('routes_backup').doc(id).get();
      if (!backupDoc.exists) {
        itemReport.problems.push('backup_missing');
      }

      if (itemReport.problems.length) report.issues.push(itemReport);
      report.checked++;
    }

    report.summary.issuesCount = report.issues.length;
    const out = JSON.stringify(report, null, 2);
    fs.writeFileSync('migration_report.json', out);
    console.log('Verification complete. Report written to migration_report.json');
    console.log(`Total routes checked: ${report.checked}, issues: ${report.issues.length}`);
    if (report.issues.length) console.log('First issues sample:', JSON.stringify(report.issues.slice(0,5), null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Verification failed:', err);
    process.exit(1);
  }
})();
