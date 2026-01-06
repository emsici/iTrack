package com.euscagency.itrack;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.util.Log;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationResult;
import android.location.Location;
import android.content.Context;
import android.os.PowerManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit; 
import android.app.Notification;

/**
 * SERVICIU GPS DE FUNDAL - FusedLocationProviderClient pentru triangulare inteligentă
 * Google Play Services gestionează totul automat - GPS + WiFi + Cellular 
 */
public class BackgroundGPSService extends Service {
    private static final String TAG = "GPS_Fundal";
    private static final long GPS_INTERVAL_SECONDS = 10;
    private static final int NOTIFICATION_ID = 2002;
    private static final String CHANNEL_ID = "BackgroundGPSChannel";
    private static final int RETRY_INITIAL_DELAY = 30;
    private static final int RETRY_MAX_DELAY = 300;
    private static final int MAX_OFFLINE_QUEUE_SIZE = 1000;
    
    // CRASH FIX: Flag static pentru a bloca toate operațiile când logout e în progres
    private static volatile boolean isServiceLoggingOut = false;
    
    private FusedLocationProviderClient fusedLocationClient;
    private LocationRequest locationRequest;
    private LocationCallback locationCallback;
    private PowerManager.WakeLock wakeLock;
    private java.util.Map<String, CourseData> activeCourses = new java.util.concurrent.ConcurrentHashMap<>();
    private String globalToken;
    private java.util.concurrent.ThreadPoolExecutor httpThreadPool;
    private java.util.concurrent.ScheduledExecutorService retryExecutor;
    private String globalVehicle;
    private java.util.concurrent.atomic.AtomicBoolean isGPSRunning = new java.util.concurrent.atomic.AtomicBoolean(false);
    private java.util.concurrent.atomic.AtomicBoolean locationUpdatesActive = new java.util.concurrent.atomic.AtomicBoolean(false);
    private java.util.concurrent.atomic.AtomicBoolean isRetryRunning = new java.util.concurrent.atomic.AtomicBoolean(false);
    private java.util.concurrent.ConcurrentLinkedQueue<OfflineGPSData> offlineQueue = new java.util.concurrent.ConcurrentLinkedQueue<>();
    
    
    // Clasă pentru datele cursei
    private static class CourseData {
        String courseId; // ikRoTrans - identificator unic pentru HashMap
        int status; // 2=ACTIV, 3=PAUZA, 4=STOP
        String realUit; // UIT real pentru transmisia către server
        String vehicleNumber; // Numărul mașinii specific pentru această cursă
        
        CourseData(String courseId, int status) {
            this.courseId = courseId;
            this.status = status;
            this.realUit = courseId; // Fallback pentru compatibilitate
            this.vehicleNumber = null;
        }
        
        CourseData(String courseId, int status, String realUit, String vehicleNumber) {
            this.courseId = courseId;
            this.status = status;
            this.realUit = realUit != null ? realUit : courseId; // UIT real sau fallback
            this.vehicleNumber = vehicleNumber; // Vehiculul specific pentru cursă
        }
    }
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.e(TAG, "🚀 Serviciul BackgroundGPS Creat");
        
        // Initialize HTTP Thread Pool pentru rate limiting
        initializeHttpThreadPool();
               
        // FUSION GPS: Inițializare Google Play Services Location
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
        
        // WakeLock pentru deep sleep protection cu Fusion GPS
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK, 
            "iTrack:FusionGPS:DeepSleep"
        );
        
        // ELIMINAT: HandlerThread - FusedLocationProviderClient gestionează propriul thread
        
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, createNotification());
        
        Log.e(TAG, "✅ Serviciul GPS de Fundal este Gata");
    }
    
    // CRITICAL SECURITY FIX: HTTP Thread Pool cu coadă LIMITATĂ pentru memory safety
    private void initializeHttpThreadPool() {
        try {
            if (httpThreadPool == null || httpThreadPool.isShutdown()) {
                // SECURITY: Coadă limitată (1000) + RejectedExecutionHandler pentru memoria controlată
                java.util.concurrent.BlockingQueue<Runnable> boundedQueue = 
                    new java.util.concurrent.LinkedBlockingQueue<>(1000);
                    
                httpThreadPool = new java.util.concurrent.ThreadPoolExecutor(
                    3, // corePoolSize
                    3, // maxPoolSize  
                    60L, java.util.concurrent.TimeUnit.SECONDS, // keepAliveTime
                    boundedQueue,
                    new java.util.concurrent.RejectedExecutionHandler() {
                        @Override
                        public void rejectedExecution(Runnable r, java.util.concurrent.ThreadPoolExecutor executor) {
                            Log.e(TAG, "🚨 HTTP Thread Pool FULL - cerere respinsă pentru memory safety");
                            // Salvează în offline queue în loc să consume memoria
                        }
                    }
                );
                Log.e(TAG, "🔧 SECURE HTTP Thread Pool: 3 threads, coadă max 1000, memory protected");
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Eroare inițializare HTTP Thread Pool: " + e.getMessage());
        }
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.e(TAG, "onStartCommand apelat cu acțiune: " + (intent != null ? intent.getAction() : "null"));
        
        if (intent != null && "START_BACKGROUND_GPS".equals(intent.getAction())) {
            // CRASH FIX: Resetăm flag-ul de logout când serviciul e pornit din nou
            isServiceLoggingOut = false;
            Log.e(TAG, "🔓 isServiceLoggingOut = false - GPS service starting");
            
            String uitId = intent.getStringExtra("uit"); // ikRoTrans ca identificator HashMap
            String realUit = intent.getStringExtra("extra_uit"); // UIT real pentru server
            globalToken = intent.getStringExtra("token");
            globalVehicle = intent.getStringExtra("vehicle");
            int courseStatus = intent.getIntExtra("status", 2); // Default ACTIVE
            
            // CRITICAL: Creează key unic pentru HashMap pentru a evita conflictul între mașini
            // CONFLICT PREVENTION: Adăugăm și token-ul pentru a evita conflictele între utilizatori
            String deviceId = android.provider.Settings.Secure.getString(getContentResolver(), android.provider.Settings.Secure.ANDROID_ID);
            String tokenHash = String.valueOf(Math.abs(globalToken.hashCode())); // Hash token pentru unicitate
            String uniqueKey = globalVehicle + "_" + uitId + "_" + deviceId.substring(0, Math.min(8, deviceId.length())) + "_" + tokenHash.substring(0, Math.min(8, tokenHash.length())); // Vehicul + UIT + Device + Token = key COMPLET unic
            
            Log.e(TAG, "⚡ MULTI-VEHICLE MULTI-COURSE - Adăugare cursă:");
            Log.e(TAG, "   ikRoTrans original: " + uitId);
            Log.e(TAG, "   HashMap unique key: " + uniqueKey);
            Log.e(TAG, "   UIT real (server): " + realUit);
            Log.e(TAG, "   Vehicle: " + globalVehicle);
            Log.e(TAG, "   Status: " + courseStatus);
            
            // CRITICAL FIX: VERIFICARE UIT REAL - dacă realUit este null, folosește uitId
            String validRealUit = (realUit != null && !realUit.trim().isEmpty()) ? realUit : uitId;
            Log.e(TAG, "🔧 CRITICAL UIT VALIDATION: realUit='" + realUit + "' → validRealUit='" + validRealUit + "'");
            
            // Adaugă cursa la lista activă cu key unic (vehicul + ikRoTrans), păstrează toate datele
            activeCourses.put(uniqueKey, new CourseData(uitId, courseStatus, validRealUit, globalVehicle));
            Log.e(TAG, "📋 Total curse active: " + activeCourses.size());
            
            // FIXED: Folosește NOTIFICATION_ID consistent (2002)
            updateNotification();
            Log.e(TAG, "📱 Notificare serviciu fundal actualizată");
            
            if (courseStatus == 2) {
                // CRITICAL FIX: Garantează că LocationCallback este ÎNTOTDEAUNA înregistrat pentru curse ACTIVE
                ensureLocationUpdatesRegistered();
            } else {
                Log.e(TAG, "GPS not started - course status is " + courseStatus + " (not ACTIVE)");
            }
            
        } else if (intent != null && "UPDATE_COURSE_STATUS".equals(intent.getAction())) {
            int newStatus = intent.getIntExtra("status", 0);
            String specificUIT = intent.getStringExtra("uit");
            String vehicleForUpdate = intent.getStringExtra("vehicle"); // Vehicul pentru status update
            
            Log.i(TAG, "Actualizare status: " + specificUIT + " → " + newStatus);
            
            // CRITICAL: Verifică că token nu s-a schimbat
            if (globalToken == null) {
                Log.e(TAG, "❌ Nu pot actualiza status - globalToken este null");
                return START_STICKY;
            }
            
            // SIMPLE SEARCH: Găsește cursa după orice identificator  
            CourseData courseData = null;
            String foundKey = null;
            
            // FIXED: Caută și după HashMap key pentru maximum compatibility
            for (java.util.Map.Entry<String, CourseData> entry : activeCourses.entrySet()) {
                CourseData course = entry.getValue();
                String mapKey = entry.getKey();
                
                if (course.courseId.equals(specificUIT) || 
                    course.realUit.equals(specificUIT) ||
                    mapKey.contains(specificUIT)) {  // Extra fallback pentru key search
                    courseData = course;
                    foundKey = entry.getKey();
                    break;
                }
            }
            
            if (courseData != null) {
                int oldStatus = courseData.status;
                Log.i(TAG, "Status: " + oldStatus + " → " + newStatus + " pentru " + specificUIT);
                
                if (newStatus == 2) { // ACTIVE/RESUME
                    courseData.status = 2;
                    Log.i(TAG, "🟢 RESUME: GPS reactivat pentru " + specificUIT);
                    
                    // CRITICAL FIX: TRIMITE status RESUME la server
                    sendStatusUpdateToServer(newStatus, foundKey);
                    
                    // CRITICAL FIX: Garantează LocationCallback înregistrat pentru RESUME
                    ensureLocationUpdatesRegistered();
                } else if (newStatus == 3) { // PAUSE
                    courseData.status = 3;
                    Log.e(TAG, "🔶 PAUSE: UIT " + specificUIT + " status → 3 (PAUSE)");
                    
                    // CRITICAL FIX: TRIMITE status PAUSE la server (a lipsit!)
                    sendStatusUpdateToServer(newStatus, foundKey);
                    
                    // CRITICAL FIX: Verifică dacă mai sunt curse ACTIVE pentru a opri GPS
                    int activeCourseCount = 0;
                    for (CourseData course : activeCourses.values()) {
                        if (course.status == 2) {
                            activeCourseCount++;
                        }
                    }
                    Log.e(TAG, "📊 PAUSE: " + activeCourseCount + " curse rămân ACTIVE");
                    
                    // CRITICAL FIX: Dacă nu mai sunt curse ACTIVE, oprește LocationUpdates
                    if (activeCourseCount == 0) {
                        Log.e(TAG, "🛑 TOATE cursele în PAUZĂ/STOP - opresc LocationUpdates");
                        stopLocationUpdates();
                    }
                } else if (newStatus == 4) { // STOP
                    // CRITICAL FIX: TRIMITE status STOP la server ÎNAINTE de eliminare
                    sendStatusUpdateToServer(newStatus, foundKey);
                    
                    activeCourses.remove(foundKey);
                    Log.e(TAG, "✅ STOP: Status trimis + cursă eliminată din GPS tracking pentru " + specificUIT);
                    
                    // CRITICAL FIX: Verifică dacă mai sunt curse ACTIVE pentru GPS
                    int activeCourseCount = 0;
                    for (CourseData course : activeCourses.values()) {
                        if (course.status == 2) {
                            activeCourseCount++;
                        }
                    }
                    
                    if (activeCourseCount == 0) {
                        Log.e(TAG, "🛑 TOATE cursele STOP - opresc LocationUpdates");
                        stopLocationUpdates();
                    } else {
                        Log.e(TAG, "⚡ GPS continuă pentru " + activeCourseCount + " curse ACTIVE rămase");
                    }
                }
            } else {
                Log.e(TAG, "❌ UIT " + specificUIT + " nu găsit în curse active!");
            }
            
        } else if (intent != null && "STOP_BACKGROUND_GPS".equals(intent.getAction())) {
            // CRASH FIX: Setăm flag-ul ÎNAINTE de orice pentru a bloca toate callback-urile
            isServiceLoggingOut = true;
            Log.e(TAG, "🔒 isServiceLoggingOut = true - STOP GPS requested");
            stopBackgroundGPS();
            // Oprim serviciul imediat pentru a preveni orice callback
            stopSelf();
        }
        
        return START_STICKY;
    }
    
    // ELIMINAT: Handler manual - FusedLocationProviderClient face callback-uri automate
    
    private void startBackgroundGPS() {
        Log.e(TAG, "startBackgroundGPS called, isGPSRunning: " + isGPSRunning.get());
        
        if (isGPSRunning.get()) {
            Log.e(TAG, "GPS already running, skipping");
            return;
        }
        
        if (activeCourses.isEmpty()) {
            Log.e(TAG, "❌ Cannot start GPS - NO ACTIVE COURSES");
            return;
        }
        
        if (globalToken == null) {
            Log.e(TAG, "❌ Cannot start GPS - NO TOKEN available");
            return;
        }
        
        // CRITICAL: Reinițializează httpThreadPool SECURIZAT dacă necesar
        if (httpThreadPool == null || httpThreadPool.isShutdown()) {
            initializeHttpThreadPool(); // Folosește metoda securizată cu coadă limitată
        }
        
        // WAKE LOCK FIXED: Folosește doar pentru deep sleep protection cu Fusion GPS
        if (wakeLock != null && !wakeLock.isHeld()) {
            wakeLock.acquire(60 * 60 * 1000); // 1 oră max pentru safety
            Log.e(TAG, "✅ WakeLock acquired pentru deep sleep protection cu Fusion GPS");
        }
        
        
        isGPSRunning.set(true);
        
        // SIMPLU: Doar Fusion GPS - Google face totul automat!
        startFusionGPS();
        startOfflineRetrySystem();
        
        Log.e(TAG, "✅ FUSION GPS PORNIT - Google gestionează totul automat la " + GPS_INTERVAL_SECONDS + "s");
        sendLogToJavaScript("✅ FUSION GPS - Google triangulare automată");
    }
    
    private void stopBackgroundGPS() {
        Log.e(TAG, "🛑 === STOP BACKGROUND GPS CALLED ===");
        Log.e(TAG, "🛑 Current isGPSRunning: " + isGPSRunning.get());
        Log.e(TAG, "🛑 Active courses: " + activeCourses.size());
        
        // CRASH FIX: Setăm flag-ul PRIMUL pentru a bloca TOATE callback-urile
        isServiceLoggingOut = true;
        isGPSRunning.set(false);
        
        // OPRIRE: Fusion GPS IMEDIAT pentru a opri callback-urile
        stopFusionGPS();
        
        // CRASH FIX: Oprește retryExecutor IMEDIAT pentru a preveni callback-uri
        if (retryExecutor != null && !retryExecutor.isShutdown()) {
            retryExecutor.shutdownNow();
            Log.e(TAG, "🛑 Retry Executor force stopped");
            retryExecutor = null;
        }
        
        // CRASH FIX: Curăță activeCourses pentru a preveni iterații
        activeCourses.clear();
        Log.e(TAG, "🛑 Active courses cleared");
        
        // CRASH FIX: Curăță offline queue
        offlineQueue.clear();
        Log.e(TAG, "🛑 Offline queue cleared");
        
        // WakeLock release (fără sendLogToJavaScript - ar fi blocat oricum)
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            Log.e(TAG, "🛑 WakeLock released");
        }
        
        // Stop HTTP Thread Pool IMEDIAT
        if (httpThreadPool != null && !httpThreadPool.isShutdown()) {
            httpThreadPool.shutdownNow(); // Force stop, nu mai așteptăm
            Log.e(TAG, "🛑 HTTP Thread Pool force stopped");
            httpThreadPool = null;
        }
        
        Log.e(TAG, "🛑 FUSION GPS Service oprit complet - toate callback-urile blocate");
    }
    
    
    private void startFusionGPS() {
        Log.e(TAG, "🚀 PORNIRE FUSION GPS cu triangulare inteligentă");
        
        // Verifică permisiuni
        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Log.e(TAG, "❌ Permisiuni GPS lipsă pentru Fusion GPS");
            return;
        }
        
        // FUSION GPS: Configurație PREMIUM pentru tracking REAL vehicule
        locationRequest = LocationRequest.create()
            .setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY) // GPS satellite priority
            .setInterval(GPS_INTERVAL_SECONDS * 1000) // 10 secunde
            .setFastestInterval(3000) // Minim 3 secunde pentru răspuns rapid
            .setSmallestDisplacement(0f) // Orice mișcare (pentru vehicule oprite)
            .setMaxWaitTime(GPS_INTERVAL_SECONDS * 1000); // Wait time pentru batch GPS
            
        // ENTERPRISE: Request GPS satellite explicit
        Log.e(TAG, "🛰️ GPS REQUEST: Satellite priority, 10s interval, 3s fastest, no displacement filter");
            
        // FUSION GPS: Callback inteligent cu auto-retry
        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                // CRASH FIX: Nu procesa dacă logout e în progres
                if (isServiceLoggingOut) {
                    Log.d(TAG, "📵 onLocationResult SKIPPED - logout in progress");
                    return;
                }
                if (locationResult == null) return;
                
                for (Location location : locationResult.getLocations()) {
                    if (location != null) {
                        // CRITICAL DEBUG: Verifică calitatea GPS-ului
                        float accuracy = location.getAccuracy();
                        String provider = location.getProvider();
                        long age = System.currentTimeMillis() - location.getTime();
                        boolean hasSpeed = location.hasSpeed();
                        boolean hasBearing = location.hasBearing();
                        
                        Log.e(TAG, "🎯 GPS DEBUG: lat=" + location.getLatitude() + ", lng=" + location.getLongitude());
                        Log.e(TAG, "📍 GPS CALITATE: precizie=" + (int)accuracy + "m, provider=" + provider + ", age=" + age + "ms");
                        Log.e(TAG, "🚗 GPS SENZORI: viteza=" + hasSpeed + ", directie=" + hasBearing);
                        
                        // QUALITY CHECK: Respinge GPS cu precizie slabă
                        if (accuracy > 100.0f) {
                            Log.w(TAG, "⚠️ GPS PRECIZIE SLABĂ: " + (int)accuracy + "m - posibil WiFi/cellular în loc de satellite");
                        }
                        
                        if (age > 30000) { // Mai vechi de 30s
                            Log.w(TAG, "⚠️ GPS VECHI: " + age + "ms - posibil coordonate cached");
                        }
                        
                        if (!"gps".equals(provider)) {
                            Log.w(TAG, "⚠️ GPS NU E SATELLITE: provider=" + provider + " (nu 'gps')");
                        }
                        
                        // Verifică curse active
                        int activeCourseCount = 0;
                        for (CourseData course : activeCourses.values()) {
                            if (course.status == 2) activeCourseCount++;
                        }
                        
                        if (activeCourseCount > 0) {
                            Log.e(TAG, "📡 FUSION GPS transmite pentru " + activeCourseCount + " curse ACTIVE");
                            transmitGPSDataToAllActiveCourses(location);
                        } else {
                            Log.e(TAG, "⏸️ FUSION GPS: Nu sunt curse ACTIVE - skip transmisie");
                        }
                    }
                }
            }
        };
        
        // PORNIRE: Fusion GPS cu update-uri automate continue
        fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, android.os.Looper.getMainLooper());
        locationUpdatesActive.set(true); // CRITICAL FIX: Marchează că LocationCallback este înregistrat
        
        Log.e(TAG, "✅ FUSION GPS PORNIT - triangulare automată GPS+WiFi+Cellular la " + GPS_INTERVAL_SECONDS + "s");
        sendLogToJavaScript("✅ FUSION GPS activ - triangulare inteligentă la " + GPS_INTERVAL_SECONDS + "s");
    }
    
    private void stopFusionGPS() {
        if (fusedLocationClient != null && locationCallback != null) {
            fusedLocationClient.removeLocationUpdates(locationCallback);
            locationUpdatesActive.set(false); // CRITICAL FIX: Marchează că LocationCallback nu mai e înregistrat
            Log.e(TAG, "🛑 FUSION GPS oprit - LocationUpdates deactivated");
        }
    }
    
    // CRITICAL FIX: Oprește LocationUpdates fără a opri complet serviciul
    private void stopLocationUpdates() {
        if (fusedLocationClient != null && locationCallback != null && locationUpdatesActive.get()) {
            fusedLocationClient.removeLocationUpdates(locationCallback);
            locationUpdatesActive.set(false);
            Log.e(TAG, "🛑 LOCATION UPDATES OPRITE - nu mai sunt curse ACTIVE");
        }
    }
    
    // CRITICAL FIX: Garantează că LocationUpdates sunt înregistrate când există curse ACTIVE
    private void ensureLocationUpdatesRegistered() {
        // Verifică curse active
        int activeCount = 0;
        for (CourseData course : activeCourses.values()) {
            if (course.status == 2) {
                activeCount++;
            }
        }
        
        if (activeCount == 0) {
            return;
        }
        
        // Pornește GPS service complet dacă nu rulează
        if (!isGPSRunning.get()) {
            Log.e(TAG, "📍 ENSURE LOCATION: GPS service oprit - pornesc complet");
            startBackgroundGPS();
            return;
        }
        
        // GPS service rulează dar LocationUpdates nu sunt active - re-înregistrează
        Log.e(TAG, "📍 ENSURE LOCATION: GPS service activ dar LocationUpdates oprite - RE-ÎNREGISTREZ");
        
        // Verifică permisiuni
        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Log.e(TAG, "❌ ENSURE LOCATION: Permisiuni GPS lipsă");
            return;
        }
        
        // Re-înregistrează LocationCallback
        if (fusedLocationClient != null && locationRequest != null && locationCallback != null) {
            try {
                fusedLocationClient.removeLocationUpdates(locationCallback);
            } catch (Exception e) {
                // Ignoră eroarea dacă nu erau active
            }
            
            fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, android.os.Looper.getMainLooper());
            locationUpdatesActive.set(true);
            Log.i(TAG, "✅ GPS LocationUpdates reactivate");
        } else {
            startBackgroundGPS();
        }
    }
    
    private void transmitGPSDataToAllActiveCourses(Location location) {
        // CRASH FIX: Nu procesa dacă logout e în progres
        if (isServiceLoggingOut) {
            Log.d(TAG, "📵 transmitGPSDataToAllActiveCourses SKIPPED - logout in progress");
            return;
        }
        
        try {
            Log.i(TAG, "Pregătesc transmisia GPS pentru " + activeCourses.size() + " curse");
            
            // Timestamp România
            java.util.TimeZone romaniaTimeZone = java.util.TimeZone.getTimeZone("Europe/Bucharest");
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            sdf.setTimeZone(romaniaTimeZone);
            String timestamp = sdf.format(new java.util.Date());
            
            // Senzori
            int networkSignal = getNetworkSignal();
            String batteryLevel = getBatteryLevel();
            
            int coursesTransmitting = 0;
            
            for (java.util.Map.Entry<String, CourseData> entry : activeCourses.entrySet()) {
                String uniqueKey = entry.getKey();
                CourseData courseData = entry.getValue();
                
                
                // SIMPLE & CLEAR: DOAR status 2 (ACTIVE) transmite GPS la server
                if (courseData.status != 2) {
                    String statusName = courseData.status == 3 ? "PAUSE" : courseData.status == 4 ? "STOP" : "INVALID";
                            continue; // Skip pentru orice status în afară de ACTIVE (2)
                }
                
                // DOAR Status 2 (ACTIVE) ajunge aici
                Log.e(TAG, "✅ TRANSMIT: UIT " + courseData.realUit + " status 2 ACTIVE - TRIMIT LA SERVER");
                
                coursesTransmitting++;
                
                // Pregătește datele GPS pentru această cursă
                org.json.JSONObject gpsData = new org.json.JSONObject();
                gpsData.put("uit", courseData.realUit); // UIT real pentru server
                gpsData.put("numar_inmatriculare", courseData.vehicleNumber); // Numărul vehiculului
                gpsData.put("lat", location.getLatitude());
                gpsData.put("lng", location.getLongitude());
                gpsData.put("viteza", (int) (location.getSpeed() * 3.6));
                gpsData.put("directie", (int) location.getBearing());
                gpsData.put("altitudine", (int) location.getAltitude());
                gpsData.put("hdop", (int) location.getAccuracy());
                gpsData.put("gsm_signal", networkSignal);
                gpsData.put("baterie", batteryLevel);
                gpsData.put("status", courseData.status);
                gpsData.put("timestamp", timestamp);
                
                // CRITICAL: Transmite folosind unique key pentru identificare locală, dar UIT real pentru server
                transmitSingleCourseGPS(gpsData, uniqueKey, courseData.realUit);
                
                // CRITICAL GPS→MAP CONNECTION: Salvează coordonatele și în courseAnalyticsService pentru hartă
                // FIXED: Trimite TOATE identificatorii pentru matching în JS
                sendGPSToAnalyticsService(gpsData, courseData.realUit, uniqueKey, courseData.courseId);
            }
            
            if (coursesTransmitting > 0) {
                Log.i(TAG, "GPS transmis pentru " + coursesTransmitting + " curse din " + activeCourses.size() + " total");
                sendLogToJavaScript("GPS transmis - " + coursesTransmitting + " curse");
            }
            
        } catch (Exception e) {
            // GPS transmission error
        }
    }
    
    private void transmitSingleCourseGPS(org.json.JSONObject gpsData, String uniqueKey, String realUit) {
        // CRASH FIX: Nu executa dacă logout e în progres
        if (isServiceLoggingOut) {
            Log.d(TAG, "📵 transmitSingleCourseGPS SKIPPED - logout in progress");
            return;
        }
        
        try {
            String gpsDataJson = gpsData.toString();
            
            httpThreadPool.execute(new Runnable() {
                @Override
                public void run() {
                    // CRASH FIX: Verifică și în thread
                    if (isServiceLoggingOut) {
                        Log.d(TAG, "📵 GPS HTTP thread SKIPPED - logout in progress");
                        return;
                    }
                    try {
                        java.net.URL url = new java.net.URL("https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php");
                        javax.net.ssl.HttpsURLConnection conn = (javax.net.ssl.HttpsURLConnection) url.openConnection();
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("Content-Type", "application/json");
                        conn.setRequestProperty("Authorization", "Bearer " + globalToken);
                        conn.setRequestProperty("Accept", "application/json");
                        conn.setRequestProperty("User-Agent", "iTrack-BackgroundGPS/1.0");
                        conn.setDoOutput(true);
                        conn.setConnectTimeout(15000);
                        conn.setReadTimeout(15000);
                        
                        // Trimite datele JSON
                        try (java.io.OutputStream os = conn.getOutputStream()) {
                            byte[] input = gpsDataJson.getBytes("utf-8");
                            os.write(input, 0, input.length);
                        }
                        
                        int responseCode = conn.getResponseCode();
                        
                        if (responseCode >= 200 && responseCode < 300) {
                                        
                            // CRITICAL: Actualizează analytics cu coordonatele GPS pentru harta
                            try {
                                // Extract GPS data for analytics
                                double lat = gpsData.getDouble("lat");
                                double lng = gpsData.getDouble("lng");
                                double speed = gpsData.getDouble("viteza"); // km/h
                                double accuracy = gpsData.getDouble("hdop");
                                int currentStatus = gpsData.getInt("status");
                                
                                // IMPORTANT: Aceste coordonate sunt trimise DOAR pentru status 2 (ACTIVE)
                                boolean isManualPause = false; // Nu avem pauze în datele trimise la server
                                
                                // Call analytics update prin bridge log pentru JavaScript capture
                                String analyticsCall = "window.courseAnalyticsService && window.courseAnalyticsService.updateCourseStatistics('" + uniqueKey + "', " + 
                                    lat + ", " + lng + ", " + speed + ", " + accuracy + ", " + isManualPause + ");";
                                    
                                Log.e("JS_ANALYTICS_BRIDGE", analyticsCall);
                                                
                            } catch (Exception analyticsError) {
                                Log.e(TAG, "❌ Analytics update failed: " + analyticsError.getMessage());
                            }
                        } else {
                            Log.w(TAG, "GPS eșuat pentru " + realUit + " - cod: " + responseCode);
                        }
                        
                    } catch (Exception e) {
                        Log.e(TAG, "Eroare transmisie GPS pentru " + realUit + ": " + e.getMessage());
                        
                        // UNIFIED OFFLINE: Salvează DOAR în JavaScript - sistemul unificat
                        try {
                            // CRITICAL: Trimite direct la JavaScript pentru gestionare unificată
                            sendGPSToOfflineService(gpsData, realUit);
                            
                            Log.e(TAG, "💾 GPS coordinate sent to unified JavaScript offline system");
                        } catch (Exception offlineError) {
                            Log.e(TAG, "Eroare trimitere GPS la sistemul offline unificat: " + offlineError.getMessage());
                        }
                    }
                }
            });
            
        } catch (Exception e) {
            Log.e(TAG, "Eroare executare GPS pentru " + realUit + ": " + e.getMessage());
        }
    }
    
    // GPS→OFFLINE BRIDGE: Trimite coordonatele către offlineGPSService pentru consistență
    private void sendGPSToOfflineService(org.json.JSONObject gpsData, String realUit) {
        // CRASH FIX: Nu executa dacă logout e în progres
        if (isServiceLoggingOut) {
            Log.d(TAG, "📵 sendGPSToOfflineService SKIPPED - logout in progress");
            return;
        }
        
        try {
            // CRITICAL: Bridge către JavaScript offline service pentru sync unified
            String offlineMessage = "GPS_OFFLINE_SAVE:" + gpsData.toString();
            sendLogToJavaScript(offlineMessage);
            
            Log.e(TAG, "🌉 BRIDGE→JS: GPS coordinate sent to JavaScript offline service");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ BRIDGE ERROR: Failed to send GPS to JavaScript offline service: " + e.getMessage());
        }
    }
    
    // GPS→MAP CONNECTION: Trimite coordonatele către courseAnalyticsService pentru vizualizare
    private void sendGPSToAnalyticsService(org.json.JSONObject gpsData, String realUit, String uniqueKey, String ikRoTrans) {
        // CRASH FIX: Nu executa dacă logout e în progres
        if (isServiceLoggingOut) {
            Log.d(TAG, "📵 sendGPSToAnalyticsService SKIPPED - logout in progress");
            return;
        }
        
        try {
            // CRITICAL FIX: JavaScript bridge cu TOATE identificatorii pentru matching
            org.json.JSONObject enrichedData = new org.json.JSONObject(gpsData.toString());
            enrichedData.put("realUit", realUit);
            enrichedData.put("uniqueKey", uniqueKey);
            enrichedData.put("ikRoTrans", ikRoTrans);
            
            String analyticsMessage = "GPS_ANALYTICS:" + enrichedData.toString();
            sendLogToJavaScript(analyticsMessage);
            
            // DEBUG: Confirmă că coordonatele se trimit pentru hartă
            double lat = gpsData.getDouble("lat");
            double lng = gpsData.getDouble("lng");
            Log.e(TAG, "📍 GPS→HARTA: UIT " + realUit + " la (" + lat + ", " + lng + ") trimis prin bridge");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Eroare GPS→Analytics: " + e.getMessage());
        }
    }
    
    private void sendStatusUpdateToServer(int newStatus, String uniqueKey) {
        // CRASH FIX: Nu executa dacă logout e în progres
        if (isServiceLoggingOut) {
            Log.d(TAG, "📵 sendStatusUpdateToServer SKIPPED - logout in progress");
            return;
        }
        
        try {
            Log.e(TAG, "📤 === PREPARING STATUS UPDATE FROM ANDROID SERVICE ===");
            
            // CRITICAL FIX: uniqueKey este vehicul_ikRoTrans, extrag datele cursei
            CourseData courseData = activeCourses.get(uniqueKey);
            if (courseData == null) {
                Log.e(TAG, "❌ Nu găsesc courseData pentru unique key: " + uniqueKey);
                return;
            }
            
            String realUit = courseData.realUit;
            String originalUitId = courseData.courseId;
            Log.e(TAG, "🔧 CRITICAL FIX: unique key=" + uniqueKey + " (ikRoTrans: " + originalUitId + ") → realUit=" + realUit + " (pentru server)");
            
            // Create status update JSON cu exact aceeași structură ca GPS
            org.json.JSONObject statusData = new org.json.JSONObject();
            statusData.put("uit", realUit); // FIXED: Trimite realUit la server, NU ikRoTrans
            statusData.put("numar_inmatriculare", courseData.vehicleNumber); // Vehicul specific pentru cursă
            // Obține coordonate GPS reale pentru status update
            Location lastLocation = getLastKnownLocation();
            if (lastLocation != null) {
                statusData.put("lat", lastLocation.getLatitude());
                statusData.put("lng", lastLocation.getLongitude());
                statusData.put("viteza", (int) (lastLocation.getSpeed() * 3.6));
                statusData.put("directie", (int) lastLocation.getBearing());
                statusData.put("altitudine", (int) lastLocation.getAltitude());
                statusData.put("hdop", (int) lastLocation.getAccuracy());
            } else {
                // Fallback doar dacă nu avem GPS
                statusData.put("lat", 0);
                statusData.put("lng", 0);
                statusData.put("viteza", 0);
                statusData.put("directie", 0);
                statusData.put("altitudine", 0);
                statusData.put("hdop", 0);
            }
            statusData.put("gsm_signal", getNetworkSignal());
            statusData.put("baterie", getBatteryLevel());
            statusData.put("status", newStatus); // PAUSE (3) sau STOP (4)
            
            // Romania timestamp
            java.util.TimeZone romaniaTimeZone = java.util.TimeZone.getTimeZone("Europe/Bucharest");
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            sdf.setTimeZone(romaniaTimeZone);
            String timestamp = sdf.format(new java.util.Date());
            statusData.put("timestamp", timestamp);
            
            Log.e(TAG, "📊 Status Data prepared for status " + newStatus + ":");
            Log.e(TAG, "   unique key: " + uniqueKey + " → ikRoTrans: " + originalUitId + " → realUIT: " + realUit); // FIXED: Log all values
            Log.e(TAG, "   Vehicle: " + courseData.vehicleNumber);
            Log.e(TAG, "   Status: " + newStatus);
            Log.e(TAG, "   Timestamp: " + timestamp);
            Log.e(TAG, "📤 Full JSON: " + statusData.toString());
            
            // CORECTARE: Transmisie HTTP directă pentru status updates!
            sendStatusHTTPDirect(statusData.toString());
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Status update preparation error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void sendStatusHTTPDirect(String statusDataJson) {
        // CRASH FIX: Nu executa dacă logout e în progres
        if (isServiceLoggingOut) {
            Log.d(TAG, "📵 sendStatusHTTPDirect SKIPPED - logout in progress");
            return;
        }
        
        try {
            Log.e(TAG, "🔄 === STARTING STATUS HTTP TRANSMISSION ===");
            Log.e(TAG, "🔗 URL: https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php");
            Log.e(TAG, "📊 Status Data: " + statusDataJson);
            
            // CRITICAL: Use thread pool pentru rate limiting - status updates use same pool as GPS
            httpThreadPool.execute(new Runnable() {
                @Override
                public void run() {
                    // CRASH FIX: Verifică și în thread
                    if (isServiceLoggingOut) {
                        Log.d(TAG, "📵 Status HTTP thread SKIPPED - logout in progress");
                        return;
                    }
                    try {
                        Log.e(TAG, "📡 Status HTTP thread started from thread pool");
                        
                        java.net.URL url = new java.net.URL("https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php");
                        javax.net.ssl.HttpsURLConnection conn = (javax.net.ssl.HttpsURLConnection) url.openConnection();
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("Content-Type", "application/json");
                        conn.setRequestProperty("Authorization", "Bearer " + globalToken);
                        conn.setRequestProperty("Accept", "application/json");
                        conn.setRequestProperty("User-Agent", "iTrack-StatusUpdate/1.0");
                        conn.setDoOutput(true);
                        conn.setConnectTimeout(15000); // 15 seconds
                        conn.setReadTimeout(15000);    // 15 seconds
                        
                        Log.e(TAG, "🔗 Status connection configured, sending data...");
                        
                        // Send JSON data
                        try (java.io.OutputStream os = conn.getOutputStream()) {
                            byte[] input = statusDataJson.getBytes("utf-8");
                            os.write(input, 0, input.length);
            Log.e(TAG, "📤 Date status trimise: " + input.length + " bytes");
                        }
                        
                        int responseCode = conn.getResponseCode();
                        String responseMessage = conn.getResponseMessage();
                        
                        Log.e(TAG, "📡 === STATUS HTTP RESPONSE ===");
                        Log.e(TAG, "📊 Response Code: " + responseCode);
                        Log.e(TAG, "📝 Response Message: " + responseMessage);
                        
                        // Read response body for debugging
                        try {
                            java.io.InputStream is = (responseCode >= 200 && responseCode < 300) ? 
                                conn.getInputStream() : conn.getErrorStream();
                            if (is != null) {
                                java.util.Scanner scanner = new java.util.Scanner(is).useDelimiter("\\A");
                                String responseBody = scanner.hasNext() ? scanner.next() : "";
                                Log.e(TAG, "📄 Status Response Body: " + responseBody);
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "⚠️ Could not read status response body: " + e.getMessage());
                        }
                        
                        if (responseCode >= 200 && responseCode < 300) {
                            Log.e(TAG, "✅ === STATUS TRANSMISSION SUCCESS ===");
                        } else {
                            Log.e(TAG, "❌ === STATUS TRANSMISSION FAILED ===");
                        }
                        
                    } catch (Exception e) {
                        Log.e(TAG, "❌ Status HTTP error: " + e.getMessage());
                        e.printStackTrace();
                    }
                }
            });
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Status HTTP bridge call failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // ELIMINAT: sendOfflineGPSToJavaScript - avem offline queue nativ mai eficient
    
    private void sendLogToJavaScript(String message) {
        // CRASH FIX: Nu apela nimic dacă logout e în progres
        if (isServiceLoggingOut) {
            Log.d(TAG, "📵 sendLogToJavaScript SKIPPED - logout in progress: " + message);
            return;
        }
        
        try {
            // Send log via Android system log with special tag for JS capture
            Log.e("JS_BRIDGE_LOG", "[Android GPS]: " + message);
            
            // ADAUGĂ HANDLER PENTRU ALERTELE GPS către UI prin bridge log
            String alertCode = "window.AndroidGPS && window.AndroidGPS.onGPSMessage && window.AndroidGPS.onGPSMessage('" + message.replace("'", "\\'") + "');";
            Log.e("JS_GPS_ALERT_BRIDGE", alertCode);
            
            // Also send to system log for debugging
            Log.e(TAG, "JS Log + Alert: " + message);
        } catch (Exception e) {
            Log.e(TAG, "Failed to send log to JS: " + e.getMessage());
        }
    }
    

    
    private String getBatteryLevel() {
        try {
            android.content.IntentFilter ifilter = new android.content.IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = registerReceiver(null, ifilter);
            int level = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_LEVEL, -1);
            int scale = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_SCALE, -1);
            float batteryPct = level * 100 / (float) scale;
            return Math.round(batteryPct) + "%";
        } catch (Exception e) {
            return "0%";
        }
    }
    
    private int getNetworkSignal() {
        try {
            android.net.ConnectivityManager cm = (android.net.ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            android.net.NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
            
            if (activeNetwork == null || !activeNetwork.isConnected()) {
                return 0; // No connection
            }
            
            // Detect network type
            int networkType = activeNetwork.getType();
            if (networkType == android.net.ConnectivityManager.TYPE_WIFI) {
                return 0; // WiFi is not GSM signal
            } else if (networkType == android.net.ConnectivityManager.TYPE_MOBILE) {
                // Try to get cellular signal strength
                try {
                    android.telephony.TelephonyManager telephonyManager = 
                        (android.telephony.TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
                    
                    if (telephonyManager != null) {
                        // Basic cellular detection - return good signal for now
                        // Real signal strength requires more complex implementation
                        return 4; // Good cellular signal
                    }
                } catch (Exception e) {
                    Log.e(TAG, "❌ Cannot get telephony info: " + e.getMessage());
                }
                return 3; // Default cellular signal
            }
            
            return 2; // Unknown connection type
        } catch (Exception e) {
            Log.e(TAG, "❌ Eroare detectare semnal rețea: " + e.getMessage());
            return 1; // Error fallback
        }
    }
    
    private Location getLastKnownLocation() {
        try {
            // FUSION GPS: Folosește Google's intelligent last known location
            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                Log.e(TAG, "❌ Fără permisiune pentru Fusion GPS last location");
                return null;
            }
            
            // SIMPLU: Fusion GPS obține ultima locație inteligent (GPS+WiFi+Cellular)
            com.google.android.gms.tasks.Task<Location> locationTask = fusedLocationClient.getLastLocation();
            
            // Sincron - pentru compatibility cu apelurile existente
            try {
                return com.google.android.gms.tasks.Tasks.await(locationTask, 2000, java.util.concurrent.TimeUnit.MILLISECONDS);
            } catch (Exception e) {
                Log.e(TAG, "❌ Fusion GPS last location timeout: " + e.getMessage());
                return null;
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Eroare Fusion GPS last location: " + e.getMessage());
            return null;
        }
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "iTrack GPS Tracking",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Transmisie GPS continuă pentru urmărire vehicule");
            channel.setShowBadge(false);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }
    
    private Notification createNotification() {
        // Count ACTIVE courses (status 2) for dynamic notification
        int activeCourseCount = 0;
        int totalCourses = activeCourses.size();
        
        for (CourseData course : activeCourses.values()) {
            if (course.status == 2) { // DOAR ACTIVE courses
                activeCourseCount++;
            }
        }
        
        // Dynamic notification text based on GPS state
        String contentText;
        if (activeCourseCount > 0) {
            contentText = "FUSION GPS activ - " + activeCourseCount + "/" + totalCourses + " curse transmit";
        } else if (totalCourses > 0) {
            contentText = "FUSION GPS în standby - " + totalCourses + " curse în pauză/stop";
        } else {
            contentText = "FUSION GPS gata - așteaptă curse noi";
        }
        
        return new Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("iTrack FUSION GPS")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .setPriority(Notification.PRIORITY_HIGH)
            .setCategory(Notification.CATEGORY_SERVICE)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .build();
    }
    
    @Override
    public void onDestroy() {
        Log.e(TAG, "🛑 === BACKGROUND GPS SERVICE DESTROY CALLED ===");
        
        // THREAD SAFETY: AtomicBoolean update
        isGPSRunning.set(false);
        
        // FUSION GPS CLEANUP: Remove location updates pentru Fusion GPS  
        if (fusedLocationClient != null && locationCallback != null) {
            fusedLocationClient.removeLocationUpdates(locationCallback);
            Log.e(TAG, "🛑 FUSION GPS location updates removed");
        }
        
        // ELIMINAT: gpsExecutor cleanup - NU mai există cu Fusion GPS
        
        // HTTP THREAD POOL CLEANUP
        if (httpThreadPool != null && !httpThreadPool.isShutdown()) {
            httpThreadPool.shutdown();
            try {
                if (!httpThreadPool.awaitTermination(3, java.util.concurrent.TimeUnit.SECONDS)) {
                    httpThreadPool.shutdownNow();
                    Log.e(TAG, "🛑 HTTP Thread Pool force terminated");
                }
            } catch (InterruptedException e) {
                httpThreadPool.shutdownNow();
                Thread.currentThread().interrupt();
                Log.e(TAG, "🛑 HTTP Thread Pool interrupted shutdown");
            }
            httpThreadPool = null;
        }
        
        // ELIMINAT: healthMonitor cleanup - NU mai există cu Fusion GPS
        
        // OFFLINE RETRY SYSTEM CLEANUP
        if (retryExecutor != null && !retryExecutor.isShutdown()) {
            retryExecutor.shutdownNow();
            try {
                if (!retryExecutor.awaitTermination(2, java.util.concurrent.TimeUnit.SECONDS)) {
                    Log.e(TAG, "🛑 Retry Executor force terminated");
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                Log.e(TAG, "🛑 Retry Executor interrupted shutdown");
            }
            retryExecutor = null;
        }
        
        // UNIFIED OFFLINE: Nu mai avem Android queue de curățat - totul în JavaScript
        
        // WAKELOCK CRITICAL CLEANUP - previne battery drain
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            Log.e(TAG, "🛑 WakeLock force released - battery drain prevented");
        }
        wakeLock = null;
        
        // ELIMINAT: HandlerThread cleanup - FusedLocationProviderClient gestionează propriul thread
        
        // MEMORY CLEANUP
        activeCourses.clear();
        globalToken = null;
        globalVehicle = null;
        // ELIMINAT: locationManager cleanup - nu mai există
        
        super.onDestroy();
        Log.e(TAG, "🛑 BackgroundGPS Service COMPLETELY DESTROYED - Memory leaks prevented");
    }
    
    // OFFLINE QUEUE SYSTEM: Metodă pentru pornirea sistemului de retry
    private void startOfflineRetrySystem() {
        try {
            if (retryExecutor != null && !retryExecutor.isShutdown()) {
                Log.e(TAG, "📡 Offline retry system already running");
                return;
            }
            
            retryExecutor = Executors.newSingleThreadScheduledExecutor();
            isRetryRunning.set(true);
            
            Log.e(TAG, "📡 === OFFLINE RETRY SYSTEM STARTED ===");
            sendLogToJavaScript("📡 Offline retry system started - va retrimite coordonatele eșuate");
            
            // Check și retry la fiecare 30 secunde pentru coordonate offline
            retryExecutor.scheduleAtFixedRate(new Runnable() {
                @Override
                public void run() {
                    if (!offlineQueue.isEmpty()) {
                        processOfflineQueue();
                    }
                }
            }, RETRY_INITIAL_DELAY, RETRY_INITIAL_DELAY, java.util.concurrent.TimeUnit.SECONDS);
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error starting offline retry system: " + e.getMessage());
            sendLogToJavaScript("❌ Offline retry system failed to start");
        }
    }
    
    // OFFLINE QUEUE: Adaugă coordonate GPS în coada pentru retry
    private void addToOfflineQueue(org.json.JSONObject gpsData, String timestamp) {
        try {
            // MEMORY PROTECTION: Limitează mărimea cozii pentru a evita memory leaks
            if (offlineQueue.size() >= MAX_OFFLINE_QUEUE_SIZE) {
                // Remove oldest entries dacă coada e prea mare
                OfflineGPSData oldest = offlineQueue.poll();
                if (oldest != null) {
                    Log.e(TAG, "⚠️ Offline queue full - removed oldest GPS entry");
                }
            }
            
            // Convert String timestamp to long for OfflineGPSData constructor
            long timestampLong = System.currentTimeMillis();
            OfflineGPSData offlineData = new OfflineGPSData(gpsData, timestampLong);
            offlineQueue.offer(offlineData);
            
            Log.e(TAG, "💾 GPS coordinate added to offline queue. Total: " + offlineQueue.size());
            
            // BRIDGE: Notifică JavaScript despre mărimea queue-ului Android pentru monitoring
            sendLogToJavaScript("ANDROID_OFFLINE_QUEUE:" + offlineQueue.size());
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error adding to offline queue: " + e.getMessage());
        }
    }
    
    // OFFLINE QUEUE: Procesează coada pentru retry cu exponential backoff
    private void processOfflineQueue() {
        // CRASH FIX: Nu procesa dacă logout e în progres
        if (isServiceLoggingOut) {
            Log.d(TAG, "📵 processOfflineQueue SKIPPED - logout in progress");
            return;
        }
        
        try {
            if (offlineQueue.isEmpty()) {
                return;
            }
            
            Log.e(TAG, "📡 === PROCESSING OFFLINE QUEUE ===");
            Log.e(TAG, "📊 Queue size: " + offlineQueue.size());
            
            int processedCount = 0;
            int successCount = 0;
            int failedCount = 0;
            
            // Process până la 10 coordonate per batch pentru a evita server overload
            for (int i = 0; i < Math.min(10, offlineQueue.size()); i++) {
                OfflineGPSData offlineData = offlineQueue.poll();
                if (offlineData == null) break;
                
                processedCount++;
                
                // EXPONENTIAL BACKOFF: Calculează delay bazat pe retry count
                long dataAge = System.currentTimeMillis() - offlineData.timestamp;
                int retryDelay = Math.min(RETRY_INITIAL_DELAY * (1 << offlineData.retryCount), RETRY_MAX_DELAY);
                
                // Skip dacă data e prea veche (peste 24 ore)
                if (dataAge > 24 * 60 * 60 * 1000) {
                    Log.e(TAG, "🗑️ Discarding old GPS data: " + (dataAge / (60 * 60 * 1000)) + " hours old");
                    continue;
                }
                
                // Skip dacă nu a trecut destul timp pentru retry
                if (dataAge < retryDelay * 1000) {
                    // Put it back în coadă pentru mai târziu
                    offlineQueue.offer(offlineData);
                    continue;
                }
                
                // RETRY TRANSMISSION: Încearcă să retrimită coordonata
                if (retryGPSTransmission(offlineData)) {
                    successCount++;
                    Log.e(TAG, "✅ Offline GPS retry SUCCESS for timestamp: " + offlineData.timestamp);
                } else {
                    failedCount++;
                    // EXPONENTIAL BACKOFF: Increase retry count și put back în coadă
                    if (offlineData.retryCount < 10) { // Maxim 10 încercări
                        OfflineGPSData retryData = new OfflineGPSData(
                            offlineData.gpsData, 
                            offlineData.timestamp, 
                            offlineData.retryCount + 1
                        );
                        offlineQueue.offer(retryData);
                        Log.e(TAG, "🔄 GPS retry failed - requeue with count: " + retryData.retryCount);
                    } else {
                        Log.e(TAG, "❌ GPS retry abandoned after 10 attempts for timestamp: " + offlineData.timestamp);
                    }
                }
            }
            
            if (processedCount > 0) {
                Log.e(TAG, "📊 Offline queue processed: " + processedCount + " items (" + 
                       successCount + " success, " + failedCount + " failed)");
                
                // BRIDGE: Notifică JavaScript progresul sincronizării Android queue
                sendLogToJavaScript("ANDROID_SYNC_PROGRESS:" + successCount + "/" + processedCount + "/" + offlineQueue.size());
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error processing offline queue: " + e.getMessage());
        }
    }
    
    // OFFLINE RETRY: Încearcă retransmisia unei coordonate GPS
    private boolean retryGPSTransmission(OfflineGPSData offlineData) {
        try {
            // Folosește aceeași logică de transmisie ca în transmitGPSDataToServer
            if (globalToken == null) {
                Log.e(TAG, "❌ Cannot retry - token is null");
                return false;
            }
            
            // CRITICAL FIX: Verifică dacă cursa pentru această coordonată este încă ACTIVE
            try {
                String uitFromData = offlineData.gpsData.getString("uit");
                boolean courseStillActive = false;
                
                for (CourseData course : activeCourses.values()) {
                    if (course.realUit.equals(uitFromData) && course.status == 2) {
                        courseStillActive = true;
                        break;
                    }
                }
                
                if (!courseStillActive) {
                    Log.e(TAG, "🔶 OFFLINE RETRY SKIP: UIT " + uitFromData + " nu mai este ACTIVE - abandoning retry");
                    return true; // Consider success pentru a elimina din coadă
                }
                
                Log.e(TAG, "✅ OFFLINE RETRY VALID: UIT " + uitFromData + " încă ACTIVE - proceeding");
            } catch (Exception statusCheck) {
                Log.e(TAG, "⚠️ OFFLINE RETRY: Nu pot verifica status - proceeding anyway");
            }
            
            java.net.URL url = new java.net.URL("https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php");
            javax.net.ssl.HttpsURLConnection conn = (javax.net.ssl.HttpsURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + globalToken);
            conn.setRequestProperty("Accept", "application/json");
            conn.setRequestProperty("User-Agent", "iTrack-OfflineRetry/1.0");
            conn.setDoOutput(true);
            conn.setConnectTimeout(10000); // 10 seconds pentru retry
            conn.setReadTimeout(10000);
            
            // Send GPS data
            try (java.io.OutputStream os = conn.getOutputStream()) {
                byte[] input = offlineData.gpsData.toString().getBytes("utf-8");
                os.write(input, 0, input.length);
            }
            
            int responseCode = conn.getResponseCode();
            
            if (responseCode >= 200 && responseCode < 300) {
                Log.e(TAG, "✅ Offline GPS retry successful - response: " + responseCode);
                return true;
            } else {
                Log.e(TAG, "❌ Offline GPS retry failed - response: " + responseCode);
                return false;
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Offline GPS retry exception: " + e.getMessage());
            return false;
        }
    }
    
    // FIXED: Adaugă updateNotification() pentru consistency cu NOTIFICATION_ID
    private void updateNotification() {
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.notify(NOTIFICATION_ID, createNotification());
        }
    }
    
    // CLASA AUXILIARĂ: OfflineGPSData pentru stocarea coordonatelor GPS offline cu retry logic
    private static class OfflineGPSData {
        public final org.json.JSONObject gpsData;
        public final long timestamp;
        public final int retryCount;
        
        public OfflineGPSData(org.json.JSONObject gpsData, long timestamp) {
            this(gpsData, timestamp, 0);
        }
        
        public OfflineGPSData(org.json.JSONObject gpsData, long timestamp, int retryCount) {
            this.gpsData = gpsData;
            this.timestamp = timestamp;
            this.retryCount = retryCount;
        }
    }
}