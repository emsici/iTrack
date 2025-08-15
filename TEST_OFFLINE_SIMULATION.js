// TEST SIMULARE OFFLINE - Pentru demonstrarea funcționalității

// FUNCȚIE PENTRU TESTAREA OFFLINE
window.testOfflineSystem = function() {
  console.log('🧪 ÎNCEPE TESTUL SISTEMULUI OFFLINE');
  console.log('📡 Simulez răspunsuri non-200 de la server pentru a testa salvarea offline...');
  
  // Salvează funcția originală
  const originalFetch = window.fetch;
  let saveCount = 0;
  
  // Înlocuiește temporar fetch pentru a simula răspunsuri de eroare
  window.fetch = async function(...args) {
    const url = args[0];
    
    // Dacă este request către gps.php, simulează eroare
    if (typeof url === 'string' && url.includes('gps.php')) {
      saveCount++;
      console.log(`💾 SIMULARE OFFLINE #${saveCount}: Răspuns 500 pentru ${url}`);
      
      // Returnează promisiune cu răspuns de eroare
      return Promise.resolve({
        status: 500,
        ok: false,
        statusText: 'Internal Server Error',
        data: 'Simulated offline error',
        json: () => Promise.resolve({ error: 'Simulated offline' })
      });
    }
    
    // Pentru toate celelalte request-uri, folosește fetch-ul normal
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ Fetch interceptat - toate cererile GPS vor primi status 500');
  console.log('🔍 Urmărește consolele pentru mesajele "💾 OFFLINE SAVE"');
  console.log('📱 În aplicație vei vedea contorul de coordonate offline crescând');
  console.log('⏰ Testul va rula 30 secunde, apoi se va restaura');
  
  // Restaurează după 30 secunde
  setTimeout(() => {
    window.fetch = originalFetch;
    console.log('🔄 FETCH RESTAURAT - sistem revenit la normal');
    console.log(`📊 REZULTAT TEST: ${saveCount} coordonate simulate offline`);
    console.log('🚀 Acum coordonatele offline vor fi sincronizate automat');
  }, 30000);
  
  return `Test offline pornit! Durată: 30 secunde. Urmărește consola pentru detalii.`;
};

// FUNCȚIE PENTRU OPRIREA TESTULUI
window.stopOfflineTest = function() {
  console.log('🛑 OPRESC TESTUL OFFLINE MANUAL');
  location.reload(); // Reîncarcă pagina pentru a restaura totul
};

console.log('🧪 TEST OFFLINE READY!');
console.log('📝 Pentru a testa sistemul offline, rulează în consolă:');
console.log('   testOfflineSystem()');
console.log('📝 Pentru a opri testul manual:');
console.log('   stopOfflineTest()');