// Script pentru testarea sistemului offline în browser console

console.log('=== SISTEM OFFLINE GPS DEBUG ===');

// 1. Verifică starea actuală
async function checkOfflineStatus() {
  console.log('📊 Navigator online:', navigator.onLine);
  
  try {
    const stored = localStorage.getItem('cap_offline_gps_coordinates');
    const coordinates = stored ? JSON.parse(stored) : [];
    console.log('💾 Coordonate offline salvate:', coordinates.length);
    coordinates.forEach((coord, i) => {
      console.log(`  ${i+1}. ${coord.lat}, ${coord.lng} - UIT: ${coord.uit} - ${coord.timestamp}`);
    });
  } catch (error) {
    console.log('❌ Eroare citire coordonate offline:', error);
  }
}

// 2. Forțează salvare offline
async function forceOfflineSave() {
  try {
    // Import dinamic
    const module = await import('/src/services/offlineGPS.js');
    const { saveGPSCoordinateOffline } = module;
    
    const testGPS = {
      lat: 44.2583 + Math.random() * 0.01,
      lng: 26.1755 + Math.random() * 0.01,
      timestamp: new Date().toISOString(),
      viteza: Math.floor(Math.random() * 80),
      directie: Math.floor(Math.random() * 360),
      altitudine: 100,
      baterie: 85,
      numar_inmatriculare: 'IF03CWT',
      uit: '6E8W324493000172',
      status: '2',
      hdop: '1.0',
      gsm_signal: '4'
    };
    
    await saveGPSCoordinateOffline(testGPS, 'test123', 'IF03CWT', 'token123', 2);
    console.log('✅ Coordonată test salvată offline');
    await checkOfflineStatus();
  } catch (error) {
    console.log('❌ Eroare salvare test:', error);
  }
}

// 3. Test sincronizare
async function testSync() {
  try {
    const module = await import('/src/services/offlineGPS.js');
    const { syncOfflineGPS } = module;
    
    console.log('🔄 Încercare sincronizare...');
    const result = await syncOfflineGPS();
    console.log('📊 Rezultat sync:', result);
  } catch (error) {
    console.log('❌ Eroare sincronizare:', error);
  }
}

// Execută verificări
checkOfflineStatus();

// Adaugă funcții la window pentru folosire
window.checkOfflineStatus = checkOfflineStatus;
window.forceOfflineSave = forceOfflineSave;
window.testSync = testSync;

console.log('🛠️ Funcții disponibile:');
console.log('  checkOfflineStatus() - verifică starea');
console.log('  forceOfflineSave() - salvează coordonată test');
console.log('  testSync() - testează sincronizarea');
