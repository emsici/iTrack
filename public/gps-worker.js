/**
 * Web Worker pentru transmisia GPS în background
 * Rulează independent de thread-ul principal al aplicației
 */

let isActive = false;
let gpsTimerInterval = null;
let workerConfig = null;

// Ascultă mesajele de la thread-ul principal
self.addEventListener('message', function(event) {
  const { type, config } = event.data;
  
  console.log('[GPS Worker] Mesaj primit:', type);
  
  switch (type) {
    case 'START_GPS':
      startGpsTransmission(config);
      break;
    case 'STOP_GPS':
      stopGpsTransmission();
      break;
    case 'PING':
      self.postMessage({ type: 'PONG', timestamp: Date.now() });
      break;
  }
});

async function startGpsTransmission(config) {
  if (isActive) {
    console.log('[GPS Worker] Serviciul este deja activ');
    return;
  }
  
  workerConfig = config;
  isActive = true;
  
  console.log('[GPS Worker] Pornesc transmisia GPS pentru:', {
    vehicleNumber: config.vehicleNumber,
    uit: config.uit,
    hasToken: !!config.token
  });
  
  // Prima transmisie imediată
  await transmitGpsData();
  
  // Programează transmisia la fiecare 60 secunde
  gpsTimerInterval = setInterval(async () => {
    if (isActive) {
      console.log('[GPS Worker] 🕐 Transmisie automată la 60s');
      await transmitGpsData();
    }
  }, 60000);
  
  // Notifică thread-ul principal că serviciul a pornit
  self.postMessage({ 
    type: 'GPS_STARTED', 
    timestamp: Date.now(),
    config: workerConfig
  });
}

function stopGpsTransmission() {
  console.log('[GPS Worker] Opresc transmisia GPS');
  
  isActive = false;
  
  if (gpsTimerInterval) {
    clearInterval(gpsTimerInterval);
    gpsTimerInterval = null;
  }
  
  // Notifică thread-ul principal că serviciul s-a oprit
  self.postMessage({ 
    type: 'GPS_STOPPED', 
    timestamp: Date.now() 
  });
}

async function transmitGpsData() {
  if (!workerConfig) {
    console.error('[GPS Worker] Nu am configurație pentru transmisie');
    return;
  }
  
  try {
    console.log(`[GPS Worker] Transmit la ${new Date().toLocaleTimeString()}`);
    
    // Cere coordonatele GPS de la thread-ul principal
    const gpsData = await requestGpsFromMainThread();
    
    if (!gpsData) {
      console.warn('[GPS Worker] Nu am primit coordonate GPS');
      return;
    }
    
    const payload = {
      lat: gpsData.lat,
      lng: gpsData.lng,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      viteza: Math.round(gpsData.speed || 0),
      directie: Math.round(gpsData.heading || 0),
      altitudine: Math.round(gpsData.altitude || 0),
      baterie: gpsData.battery || 100,
      numar_inmatriculare: workerConfig.vehicleNumber,
      uit: workerConfig.uit,
      status: 2, // transport activ
      hdop: Math.min(Math.round((gpsData.accuracy || 10) / 5), 10),
      gsm_signal: 85
    };
    
    console.log('[GPS Worker] Date GPS pentru transmisie:', {
      lat: payload.lat,
      lng: payload.lng,
      viteza: payload.viteza,
      directie: payload.directie,
      baterie: payload.baterie
    });
    
    // Transmite către API
    const response = await fetch('https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${workerConfig.token}`
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      console.log(`[GPS Worker] ✅ Transmisie reușită: ${response.status}`);
      
      // Notifică thread-ul principal despre succesul transmisiei
      self.postMessage({
        type: 'GPS_TRANSMITTED',
        timestamp: Date.now(),
        success: true,
        data: payload
      });
    } else {
      console.error(`[GPS Worker] ❌ Eroare transmisie: ${response.status}`);
      
      self.postMessage({
        type: 'GPS_TRANSMITTED',
        timestamp: Date.now(),
        success: false,
        error: `HTTP ${response.status}`
      });
    }
    
  } catch (error) {
    console.error('[GPS Worker] Eroare critică la transmisie:', error);
    
    self.postMessage({
      type: 'GPS_TRANSMITTED',
      timestamp: Date.now(),
      success: false,
      error: error.message
    });
  }
}

// Cere coordonatele GPS de la thread-ul principal și așteaptă răspunsul
function requestGpsFromMainThread() {
  return new Promise((resolve) => {
    const requestId = Date.now();
    
    // Timeout pentru cererea GPS
    const timeout = setTimeout(() => {
      console.warn('[GPS Worker] Timeout la cererea GPS');
      resolve(null);
    }, 15000);
    
    // Ascultă răspunsul
    const messageHandler = (event) => {
      if (event.data.type === 'GPS_RESPONSE' && event.data.requestId === requestId) {
        clearTimeout(timeout);
        self.removeEventListener('message', messageHandler);
        resolve(event.data.gpsData);
      }
    };
    
    self.addEventListener('message', messageHandler);
    
    // Cere coordonatele GPS
    self.postMessage({
      type: 'GPS_REQUEST',
      requestId: requestId,
      timestamp: Date.now()
    });
  });
}

console.log('[GPS Worker] Worker GPS inițializat și pregătit');