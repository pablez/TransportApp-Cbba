const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const fs = require('fs');

const PROJECT_ID = 'transportapp-cochabamba';
let testEnv;

describe('Firestore rules', () => {
  before(async function() {
    this.timeout(20000);
    // Detect FIRESTORE_EMULATOR_HOST (host:port) to run tests against emulator
    const emulator = process.env.FIRESTORE_EMULATOR_HOST;
    const firestoreConfig = { rules: fs.readFileSync('config/firestore.rules', 'utf8') };
    if (emulator) {
      const parts = emulator.split(':');
      firestoreConfig.host = parts[0];
      firestoreConfig.port = Number(parts[1]) || 8080;
      console.log('Using emulator at', firestoreConfig.host + ':' + firestoreConfig.port);
    } else {
      console.log('FIRESTORE_EMULATOR_HOST not set — tests expect emulator. You can run with:');
      console.log('  $env:FIRESTORE_EMULATOR_HOST = "localhost:8080" (PowerShell)');
      console.log('or wrap with: firebase emulators:exec "npx mocha tests/firestore.rules.test.js"');
    }

    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: firestoreConfig
    });
  });

  after(async () => {
    if (testEnv) {
      try { await testEnv.clearFirestore(); } catch (e) { console.warn('clearFirestore failed', e.message || e); }
      await testEnv.cleanup();
    }
  });

  it('guest can read public route but cannot create route', async () => {
    const adminCtx = testEnv.authenticatedContext('adminUid', { role: 'admin' });
    const adminDb = adminCtx.firestore();
    await adminDb.collection('routes').doc('r1').set({ name: 'Public', public: true });

    const unauth = testEnv.unauthenticatedContext();
    const unauthDb = unauth.firestore();
    await assertSucceeds(unauthDb.collection('routes').doc('r1').get());
    await assertFails(unauthDb.collection('routes').doc('r2').set({ name: 'X' }));
  });

  it('driver can write own driverLocation', async () => {
    const driver = testEnv.authenticatedContext('driver1', { role: 'DRIVER' });
    const db = driver.firestore();
    const data = { driverId: 'driver1', latitude: -17.37, longitude: -66.18, isOnline: true };
    await assertSucceeds(db.collection('driverLocations').doc('driver1').set(data));
  });

  it('other user cannot write driverLocation for someone else', async () => {
    const driver = testEnv.authenticatedContext('driver1', { role: 'DRIVER' });
    const other = testEnv.authenticatedContext('user2', { role: 'PASSENGER' });
    const otherDb = other.firestore();
    const data = { driverId: 'driver1', latitude: -17.37, longitude: -66.18 };
    await assertFails(otherDb.collection('driverLocations').doc('driver1').set(data));
  });

  it('user can read own user doc, admin can read any', async () => {
    const user = testEnv.authenticatedContext('u1', { role: 'PASSENGER' });
    const userDb = user.firestore();
    await userDb.collection('users').doc('u1').set({ email: 'u1@example.com' });

    await assertSucceeds(userDb.collection('users').doc('u1').get());

    const admin = testEnv.authenticatedContext('admin1', { role: 'admin' });
    const adminDb = admin.firestore();
    await assertSucceeds(adminDb.collection('users').doc('u1').get());
  });

  it('vehicle create only by owner or admin', async () => {
    const driver = testEnv.authenticatedContext('d1', { role: 'DRIVER' });
    const db = driver.firestore();
    await assertSucceeds(db.collection('vehicles').doc('v1').set({ driverId: 'd1', plate: 'WTF123' }));

    const other = testEnv.authenticatedContext('u2', { role: 'PASSENGER' });
    const otherDb = other.firestore();
    await assertFails(otherDb.collection('vehicles').doc('v1').set({ driverId: 'd1', plate: 'X' }));
  });

});
