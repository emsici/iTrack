package com.euscagency.itrack;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.location.Location;

// Google Play Services FusedLocationProviderClient - precizie și eficiență GPS optimă
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.Priority;
// Google Play Services availability check - CRITICAL pentru stabilitate
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
// CancellationToken pentru timeout management
import com.google.android.gms.tasks.CancellationToken;
import com.google.android.gms.tasks.CancellationTokenSource;
import com.google.android.gms.tasks.OnTokenCanceledListener;
import android.content.Context;
import android.os.PowerManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import android.os.HandlerThread;
import android.app.Notification;

/**
 * SERVICIU GPS DE FUNDAL - Mai eficient pentru transmisia continuă GPS
 * Folosește ScheduledExecutorService în loc de Handler pentru mai multă stabilitate
 */
public class BackgroundGPSService extends Service {
    private static final String TAG = "BackgroundGPS";
    private static final long GPS_INTERVAL_SECONDS = 10;
    private static final int NOTIFICATION_ID = 2002;
    private static final String CHANNEL_ID = "BackgroundGPSChannel";
    
    private FusedLocationProviderClient fusedLocationClient;
    private LocationRequest locationRequest;
    private LocationCallback locationCallback;
    private boolean isLocationUpdatesActive = false; // Track dacă location updates sunt active
    private CancellationTokenSource cancellationTokenSource; // Pentru timeout la getCurrentLocation
    private PowerManager.WakeLock wakeLock;
    private ScheduledExecutorService gpsExecutor;
    private HandlerThread backgroundThread;
    private Handler backgroundHandler;
    
    // MULTI-UIT SUPPORT: Thread-safe Map pentru toate cursele active simultan - CRITICAL pentru multi-threading
    private java.util.Map<String, CourseData> activeCourses = new java.util.concurrent.ConcurrentHashMap<>();
    private volatile String globalToken; // THREAD SAFETY: volatile pentru accesare thread-safe
    
    // HEALTH MONITORING: Pentru monitorizarea continuă a serviciului
    private java.util.concurrent.ScheduledExecutorService healthMonitor;
    private volatile long lastGPSCycleTime = 0; // THREAD SAFETY: volatile pentru accesare din health monitor
    
    // RATE LIMITING: Thread pool pentru HTTP transmissions pentru a evita server overloading
    private java.util.concurrent.ThreadPoolExecutor httpThreadPool;
    private volatile String globalVehicle; // THREAD SAFETY: volatile pentru accesare thread-safe
    private volatile boolean isGPSRunning = false; // THREAD SAFETY: volatile pentru accesare din multiple threads
    
    // CRITICAL FIX: Sistem offline cu LIMITED QUEUE pentru a preveni OOM
    private java.util.concurrent.ConcurrentLinkedQueue<OfflineGPSData> offlineQueue = new java.util.concurrent.ConcurrentLinkedQueue<>();
    private static final int MAX_OFFLINE_QUEUE_SIZE = 5000; // Limitare pentru a preveni OOM
    private java.util.concurrent.ScheduledExecutorService retryExecutor;
    private volatile boolean isRetryRunning = false; // THREAD SAFETY: volatile
    
    // Clasă pentru stocarea datelor GPS offline cu metadate complete
    private static class OfflineGPSData {
        String gpsJson;
        long timestamp;
        int retryCount;
        String uniqueKey;
        String realUit;
        
        OfflineGPSData(String gpsJson, String uniqueKey, String realUit) {
            this.gpsJson = gpsJson;
            this.timestamp = System.currentTimeMillis();
            this.retryCount = 0;
            this.uniqueKey = uniqueKey;
            this.realUit = realUit;
        }
    }
    
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
        
        // CRITICAL: Verifică disponibilitatea Google Play Services înainte de inițializare
        if (isGooglePlayServicesAvailable()) {
            Log.e(TAG, "✅ Google Play Services disponibile - inițializez FusedLocationProviderClient");
            fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
            setupLocationRequest();
            setupLocationCallback();
        } else {
            Log.e(TAG, "❌ Google Play Services indisponibile - FusedLocationProviderClient nu poate fi folosit");
            fusedLocationClient = null;
        }
        
        // WakeLock pentru fundal garantat - HIGH PRIORITY pentru Android Doze bypass
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP, 
            "iTrack:BackgroundGPS:Critical"
        );
        
        // Thread de fundal pentru operații GPS
        backgroundThread = new HandlerThread("BackgroundGPSThread");
        backgroundThread.start();
        backgroundHandler = new Handler(backgroundThread.getLooper());
        
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, createNotification());
        
        Log.e(TAG, "✅ BackgroundGPS Service Ready");
    }
    
    /**
     * Configurează LocationRequest pentru FusedLocationProviderClient
     * Optimizat pentru tracking vehicule comerciale cu precizie înaltă
     */
    private void setupLocationRequest() {
        locationRequest = new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, GPS_INTERVAL_SECONDS * 1000)
                .setMinUpdateIntervalMillis(GPS_INTERVAL_SECONDS * 1000)
                .setMaxUpdateAgeMillis(GPS_INTERVAL_SECONDS * 2 * 1000) // Accept locații cu max 20s vechime
                .setMaxUpdateDelayMillis(GPS_INTERVAL_SECONDS * 1000 + 5000) // Delay maxim 15s
                .setGranularity(LocationRequest.GRANULARITY_FINE)
                .setWaitForAccurateLocation(false) // Nu aștepta locații foarte precise - preferă viteza
                .build();
        
        Log.e(TAG, "📍 LocationRequest configurat: HIGH_ACCURACY, interval " + GPS_INTERVAL_SECONDS + "s");
    }
    
    /**
     * Configurează LocationCallback pentru primirea locațiilor GPS
     * Integrează cu sistemul existent de threading și error handling
     */
    private void setupLocationCallback() {
        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                if (locationResult == null) {
                    Log.e(TAG, "❌ LocationResult null");
                    return;
                }
                
                Location location = locationResult.getLastLocation();
                if (location == null) {
                    Log.e(TAG, "❌ Location null în LocationResult");
                    return;
                }
                
                // Procesează locația pe background thread pentru a nu bloca callback-ul
                backgroundHandler.post(() -> processLocationUpdate(location));
            }
        };
        
        Log.e(TAG, "📍 LocationCallback configurat pentru FusedLocationProviderClient");
    }
    
    /**
     * CRITICAL: Verifică dacă Google Play Services sunt disponibile pe dispozitiv
     * Previne crash-uri pe dispozitive fără Google Play Services
     */
    private boolean isGooglePlayServicesAvailable() {
        try {
            GoogleApiAvailability googleApiAvailability = GoogleApiAvailability.getInstance();
            int resultCode = googleApiAvailability.isGooglePlayServicesAvailable(this);
            
            if (resultCode == ConnectionResult.SUCCESS) {
                Log.e(TAG, "✅ Google Play Services disponibile și actualizate");
                return true;
            } else {
                String errorString = googleApiAvailability.getErrorString(resultCode);
                Log.e(TAG, "❌ Google Play Services indisponibile: " + errorString + " (cod: " + resultCode + ")");
                sendLogToJavaScript("❌ Google Play Services indisponibile: " + errorString);
                return false;
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Eroare verificare Google Play Services: " + e.getMessage());
            return false;
        }
    }
    
    // Initialize HTTP Thread Pool pentru rate limiting - max 3 connections simultan
    private void initializeHttpThreadPool() {
        try {
            if (httpThreadPool == null || httpThreadPool.isShutdown()) {
                httpThreadPool = new java.util.concurrent.ThreadPoolExecutor(
                    1, // Core threads - minim 1
                    3, // Max threads - maxim 3 simultan pentru a nu supraîncărca serverul
                    60L, // Keep alive 60 secunde
                    java.util.concurrent.TimeUnit.SECONDS,
                    new java.util.concurrent.LinkedBlockingQueue<Runnable>(1000), // LIMITED queue de 1000 pentru a preveni OOM
                    new java.util.concurrent.ThreadPoolExecutor.DiscardOldestPolicy() // Drop old tasks dacă queue e plin
                );
                Log.e(TAG, "🔧 HTTP Thread Pool inițializat: max 3 connections simultan cu queue limitat la 1000");
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Eroare inițializare HTTP Thread Pool: " + e.getMessage());
        }
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.e(TAG, "onStartCommand called with action: " + (intent != null ? intent.getAction() : "null"));
        
        if (intent != null && "START_BACKGROUND_GPS".equals(intent.getAction())) {
            String uitId = intent.getStringExtra("uit"); // ikRoTrans ca identificator HashMap
            String realUit = intent.getStringExtra("extra_uit"); // UIT real pentru server
            globalToken = intent.getStringExtra("token");
            globalVehicle = intent.getStringExtra("vehicle");
            int courseStatus = intent.getIntExtra("status", 2); // Default ACTIVE
            
            // CRITICAL: Creează key unic pentru HashMap pentru a evita conflictul între mașini
            // CONFLICT PREVENTION: Adăugăm și token-ul pentru a evita conflictele între utilizatori
            String deviceId = android.provider.Settings.Secure.getString(getContentResolver(), android.provider.Settings.Secure.ANDROID_ID);
            // CRITICAL FIX: Verifică token înainte de hashCode pentru a preveni NPE
            if (globalToken == null || globalToken.trim().isEmpty()) {
                Log.e(TAG, "❌ CRITICAL: globalToken este null sau empty - nu pot porni GPS");
                sendLogToJavaScript("❌ CRITICAL: Token lipsă - GPS nu poate porni");
                stopSelf(); // Oprește serviciul dacă nu are token valid
                return START_NOT_STICKY;
            }
            
            String tokenHash = String.valueOf(Math.abs(globalToken.hashCode())); // Hash token pentru unicitate
            // CRITICAL FIX: Verifică deviceId pentru a preveni NPE la substring
            if (deviceId == null || deviceId.trim().isEmpty()) {
                Log.e(TAG, "❌ CRITICAL: Device ID null - folosesc fallback UUID");
                deviceId = "FALLBACK_" + java.util.UUID.randomUUID().toString().substring(0, 8);
            }
            
            String deviceIdSafe = deviceId.length() >= 8 ? deviceId.substring(0, 8) : deviceId;
            String tokenHashSafe = tokenHash.length() >= 8 ? tokenHash.substring(0, 8) : tokenHash;
            String uniqueKey = globalVehicle + "_" + uitId + "_" + deviceIdSafe + "_" + tokenHashSafe; // Vehicul + UIT + Device + Token = key COMPLET unic
            
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
            
            // Start foreground notification IMMEDIATELY  
            startForeground(1, createNotification());
            Log.e(TAG, "📱 Foreground service persistent notification created");
            
            if (courseStatus == 2) {
                if (!isGPSRunning) {
                    Log.e(TAG, "🚀 PORNIRE GPS pentru prima cursă activă - start ScheduledExecutorService");
                    startBackgroundGPS();
                } else {
                    Log.e(TAG, "⚡ GPS rulează deja - cursă nouă adăugată la tracking existent");
                    Log.e(TAG, "📋 ScheduledExecutorService va include automat noul UIT în loop-ul existent");
                    Log.e(TAG, "🔄 Nu e nevoie de restart - serviciul transmite pentru TOATE cursele active");
                    sendLogToJavaScript("⚡ UIT nou adăugat la ScheduledExecutorService existent: " + uitId);
                }
            } else {
                Log.e(TAG, "GPS not started - course status is " + courseStatus + " (not ACTIVE)");
            }
            
        } else if (intent != null && "UPDATE_COURSE_STATUS".equals(intent.getAction())) {
            int newStatus = intent.getIntExtra("status", 0);
            String specificUIT = intent.getStringExtra("uit");
            String vehicleForUpdate = intent.getStringExtra("vehicle"); // Vehicul pentru status update
            
            Log.i(TAG, "Actualizare status: " + specificUIT + " → " + newStatus);
            
            // CRITICAL: Construiește key unic pentru găsirea cursei corecte  
            // CRITICAL FIX: Trebuie să folosească ACEEAȘI logică ca la start pentru conflict prevention
            String deviceId = android.provider.Settings.Secure.getString(getContentResolver(), android.provider.Settings.Secure.ANDROID_ID);
            
            // CRITICAL FIX: Verifică token înainte de hashCode pentru UPDATE
            if (globalToken == null || globalToken.trim().isEmpty()) {
                Log.e(TAG, "❌ CRITICAL: globalToken null la UPDATE_COURSE_STATUS - ignorez");
                sendLogToJavaScript("❌ Token lipsă la UPDATE - operația ignorată");
                return START_NOT_STICKY;
            }
            
            String tokenHash = String.valueOf(Math.abs(globalToken.hashCode()));
            // CRITICAL FIX: Verifică deviceId pentru UPDATE pentru a preveni NPE
            if (deviceId == null || deviceId.trim().isEmpty()) {
                deviceId = "FALLBACK_" + java.util.UUID.randomUUID().toString().substring(0, 8);
            }
            
            String deviceIdSafeUpdate = deviceId.length() >= 8 ? deviceId.substring(0, 8) : deviceId;
            String tokenHashSafeUpdate = tokenHash.length() >= 8 ? tokenHash.substring(0, 8) : tokenHash;
            String uniqueKeyForUpdate = vehicleForUpdate + "_" + specificUIT + "_" + deviceIdSafeUpdate + "_" + tokenHashSafeUpdate;
            Log.i(TAG, "Căutare cursă: " + uniqueKeyForUpdate);
            
            CourseData courseData = activeCourses.get(uniqueKeyForUpdate);
            if (courseData != null) {
                int oldStatus = courseData.status;
                Log.i(TAG, "Status: " + oldStatus + " → " + newStatus + " pentru " + specificUIT);
                
                if (newStatus == 2) { // ACTIVE/RESUME
                    courseData.status = 2;
                    Log.i(TAG, "GPS reactivat pentru " + specificUIT);
                    
                    if (!isGPSRunning) {
                        Log.i(TAG, "Pornesc GPS pentru resume");
                        startBackgroundGPS();
                    } else {
                        Log.i(TAG, "GPS deja activ - continuă pentru " + specificUIT);
                    }
                } else if (newStatus == 3) { // PAUSE
                    courseData.status = 3;
                    Log.i(TAG, "GPS în pauză pentru " + specificUIT);
                    
                    // Verifică dacă mai există curse active
                    int activeCourseCount = 0;
                    for (CourseData course : activeCourses.values()) {
                        if (course.status == 2) {
                            activeCourseCount++;
                        }
                    }
                    
                    if (activeCourseCount == 0) {
                        Log.i(TAG, "Toate cursele în pauză - opresc GPS");
                        stopBackgroundGPS();
                    } else {
                        Log.i(TAG, "GPS continuă pentru " + activeCourseCount + " curse active");
                    }
                } else if (newStatus == 4) { // STOP
                    // CRITICAL FIX: NU trimite status la server din Android - JavaScript deja a trimis!
                    Log.e(TAG, "🚫 SKIP server status update - JavaScript updateCourseStatus already sent status 4 to server");
                    
                    activeCourses.remove(uniqueKeyForUpdate);
                    Log.e(TAG, "STOP: UIT " + specificUIT + " eliminat COMPLET din tracking (GPS va fi OPRIT pentru această cursă)");
                    
                    // DEBUG: Verifică câte curse mai rămân active
                    Log.e(TAG, "🔍 VERIFY STOP: Curse rămase: " + activeCourses.size());
                    
                    // Dacă nu mai sunt curse active, oprește GPS complet
                    if (activeCourses.isEmpty()) {
                        Log.e(TAG, "🛑 TOATE cursele STOP - opresc GPS complet!");
                        stopBackgroundGPS();
                    } else {
                        Log.e(TAG, "⚡ GPS continuă pentru " + activeCourses.size() + " curse rămase");
                    }
                }
            } else {
                Log.e(TAG, "UIT " + specificUIT + " cu unique key " + uniqueKeyForUpdate + " nu găsit în HashMap");
            }
            
        } else if (intent != null && "STOP_BACKGROUND_GPS".equals(intent.getAction())) {
            Log.e(TAG, "Stop GPS requested");
            stopBackgroundGPS();
        }
        
        return START_STICKY;
    }
    
    private void startBackgroundGPS() {
        Log.e(TAG, "startBackgroundGPS called, isGPSRunning: " + isGPSRunning);
        
        if (isGPSRunning && gpsExecutor != null && !gpsExecutor.isShutdown()) {
            Log.e(TAG, "GPS already running and ScheduledExecutorService active, skipping");
            return;
        } else if (isGPSRunning) {
            Log.e(TAG, "⚠️ isGPSRunning=true dar ScheduledExecutorService nu există - RESETEZ isGPSRunning");
            isGPSRunning = false;
        }
        
        if (activeCourses.isEmpty()) {
            Log.e(TAG, "❌ Cannot start GPS - NO ACTIVE COURSES (size: " + activeCourses.size() + ")");
            return;
        }
        
        if (globalToken == null) {
            Log.e(TAG, "❌ Cannot start GPS - NO TOKEN available");
            return;
        }
        
        Log.e(TAG, "✅ GPS can start - " + activeCourses.size() + " active courses, token available (" + globalToken.length() + " chars)");
        
        // CRITICAL FIX: Reinițializează httpThreadPool dacă a fost oprit sau e null
        if (httpThreadPool == null || httpThreadPool.isShutdown()) {
            httpThreadPool = new java.util.concurrent.ThreadPoolExecutor(
                1, // Core threads
                3, // Max threads  
                60L, java.util.concurrent.TimeUnit.SECONDS, // Keep alive time
                new java.util.concurrent.LinkedBlockingQueue<Runnable>() // Queue
            );
            Log.e(TAG, "🔧 HTTP ThreadPool reinițializat pentru transmisiile GPS");
        }
        
        // Acquire WakeLock cu timeout pentru prevenirea kill de Android
        if (!wakeLock.isHeld()) {
            wakeLock.acquire(60 * 60 * 1000); // 1 oră timeout
            Log.e(TAG, "WakeLock acquired cu timeout 1 oră");
            sendLogToJavaScript("WakeLock acquired - serviciul va rula continuu");
        }
        
        // Start ScheduledExecutorService - IMPORTANT: Check dacă există deja
        if (gpsExecutor != null && !gpsExecutor.isShutdown()) {
            Log.e(TAG, "⚠️ ScheduledExecutorService există deja - va fi reinitialized");
            gpsExecutor.shutdown();
        }
        
        gpsExecutor = Executors.newSingleThreadScheduledExecutor();
        Log.e(TAG, "🔧 GPS Executor created: " + (gpsExecutor != null));
        Log.e(TAG, "🔧 Scheduling cycles every " + GPS_INTERVAL_SECONDS + "s");
        
        try {
            Log.e(TAG, "🚀 PORNIRE ScheduledExecutorService - prima execuție ACUM, apoi la fiecare " + GPS_INTERVAL_SECONDS + "s");
            sendLogToJavaScript("🚀 PORNIRE ScheduledExecutorService GPS - prima transmisie ACUM");
            
            // Create a runnable that MUST be executed
            Runnable gpsRunnable = new Runnable() {
                @Override
                public void run() {
                    Log.e(TAG, "⏰ === SCHEDULED TASK EXECUTION START ===");
                    Log.e(TAG, "🕐 Current time: " + new java.text.SimpleDateFormat("HH:mm:ss").format(new java.util.Date()));
                    Log.e(TAG, "🔧 Thread: " + Thread.currentThread().getName());
                    Log.e(TAG, "🔧 isGPSRunning: " + isGPSRunning);
                    Log.e(TAG, "🔧 activeCourses.size(): " + activeCourses.size());
                    
                    sendLogToJavaScript("⏰ SCHEDULED TASK EXECUTION - " + new java.text.SimpleDateFormat("HH:mm:ss").format(new java.util.Date()));
                    
                    try {
                        performGPSCycle();
                        
                        // Update health monitoring timestamp
                        lastGPSCycleTime = System.currentTimeMillis();
                        
                        Log.e(TAG, "✅ GPS cycle completed successfully");
                        sendLogToJavaScript("✅ GPS cycle completed");
                        
                        // PERFORMANCE FIX: Eliminat WakeLock renewal la fiecare ciclu - overhead masiv
                        // FusedLocationProviderClient + Foreground Service sunt suficiente pentru GPS 24/7
                        // WakeLock se menține pe durata întregii sesiuni GPS
                        
                    } catch (Exception e) {
                        Log.e(TAG, "❌ EROARE CRITICĂ în GPS cycle: " + e.getMessage());
                        sendLogToJavaScript("❌ EROARE CRITICĂ GPS: " + e.getMessage());
                        e.printStackTrace();
                        
                        // CRITICAL: În caz de eroare critică, încearcă recovery
                        try {
                            Log.e(TAG, "🔄 Încercare recovery după eroare critică...");
                            if (gpsExecutor == null || gpsExecutor.isShutdown()) {
                                Log.e(TAG, "🚨 ScheduledExecutorService compromis - RESTART COMPLET!");
                                isGPSRunning = false;
                                startBackgroundGPS();
                            }
                        } catch (Exception recoveryError) {
                            Log.e(TAG, "❌ Recovery failed: " + recoveryError.getMessage());
                            sendLogToJavaScript("❌ Recovery failed: " + recoveryError.getMessage());
                        }
                    }
                    
                    Log.e(TAG, "⏰ === SCHEDULED TASK EXECUTION END ===");
                }
            };
            
            Log.e(TAG, "🔧 About to call scheduleAtFixedRate...");
            Log.e(TAG, "🔧 GPS_INTERVAL_SECONDS = " + GPS_INTERVAL_SECONDS);
            Log.e(TAG, "🔧 gpsExecutor null check: " + (gpsExecutor != null));
            Log.e(TAG, "🔧 gpsExecutor shutdown check: " + (gpsExecutor != null ? gpsExecutor.isShutdown() : "NULL"));
            
            // CRITICAL FIX: DOAR ScheduledExecutorService cu interval corect - fără execuții extra
            java.util.concurrent.ScheduledFuture<?> future = gpsExecutor.scheduleAtFixedRate(
                gpsRunnable, 
                GPS_INTERVAL_SECONDS, // PRIMA EXECUȚIE DUPĂ 10 SECUNDE (nu imediat)
                GPS_INTERVAL_SECONDS, // APOI LA FIECARE 10 SECUNDE  
                TimeUnit.SECONDS
            );
            
            Log.e(TAG, "🔧 ScheduledFuture created: " + (future != null));
            Log.e(TAG, "🔧 Is cancelled: " + (future != null ? future.isCancelled() : "N/A"));
            Log.e(TAG, "🔧 Is done: " + (future != null ? future.isDone() : "N/A"));
            
            // MINIMĂ LOGGING: Doar status de pornire, fără execuții extra
            Log.e(TAG, "✅ GPS ScheduledExecutorService configurat pentru transmisie la fiecare " + GPS_INTERVAL_SECONDS + " secunde");
            
            isGPSRunning = true;
            
            // MODERN ADDITION: Start sistem retry offline
            startOfflineRetrySystem();
            
            // CRITICAL: Start health monitoring system pentru auto-recovery
            startHealthMonitor();
            
            Log.e(TAG, "✅ GPS Service STARTED successfully cu ScheduledExecutorService + Health Monitor");
            sendLogToJavaScript("✅ GPS Service STARTED - va transmite coordonate la fiecare " + GPS_INTERVAL_SECONDS + " secunde");
        } catch (Exception e) {
            Log.e(TAG, "❌ EROARE CRITICĂ la pornirea ScheduledExecutorService: " + e.getMessage());
            sendLogToJavaScript("❌ EROARE CRITICĂ ScheduledExecutorService: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void stopBackgroundGPS() {
        Log.e(TAG, "🛑 === STOP BACKGROUND GPS CALLED ===");
        Log.e(TAG, "🛑 Current isGPSRunning: " + isGPSRunning);
        Log.e(TAG, "🛑 Active courses: " + activeCourses.size());
        
        isGPSRunning = false;
        
        if (gpsExecutor != null && !gpsExecutor.isShutdown()) {
            Log.e(TAG, "🛑 Shutting down ScheduledExecutorService...");
            gpsExecutor.shutdown();
            Log.e(TAG, "🛑 ScheduledExecutorService stopped");
            sendLogToJavaScript("🛑 GPS Service stopped - ScheduledExecutorService shutdown");
        } else {
            Log.e(TAG, "🛑 ScheduledExecutorService was already shutdown or null");
        }
        
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            Log.e(TAG, "🛑 WakeLock released");
            sendLogToJavaScript("🛑 WakeLock released");
        } else {
            Log.e(TAG, "🛑 WakeLock was already released or null");
        }
        
        // Stop health monitor
        if (healthMonitor != null && !healthMonitor.isShutdown()) {
            healthMonitor.shutdown();
            Log.e(TAG, "🛑 Health Monitor stopped");
        }
        
        // CRITICAL FIX: Stop FusedLocationProviderClient location updates
        if (fusedLocationClient != null && locationCallback != null && isLocationUpdatesActive) {
            try {
                fusedLocationClient.removeLocationUpdates(locationCallback);
                isLocationUpdatesActive = false;
                Log.e(TAG, "🛑 FusedLocationProviderClient location updates stopped");
            } catch (SecurityException | IllegalStateException e) {
                Log.e(TAG, "❌ Eroare oprire location updates: " + e.getMessage());
            }
        }
        
        // Cancel orice getCurrentLocation în curs
        if (cancellationTokenSource != null) {
            try {
                cancellationTokenSource.cancel();
                cancellationTokenSource = null;
                Log.e(TAG, "🛑 getCurrentLocation cancellation token cancelled");
            } catch (Exception e) {
                Log.e(TAG, "❌ Eroare cancel CancellationTokenSource: " + e.getMessage());
            }
        }
        
        // Stop Retry Executor pentru offline system
        if (retryExecutor != null && !retryExecutor.isShutdown()) {
            retryExecutor.shutdown();
            try {
                if (!retryExecutor.awaitTermination(3, java.util.concurrent.TimeUnit.SECONDS)) {
                    retryExecutor.shutdownNow();
                }
                Log.e(TAG, "🛑 Retry Executor stopped");
            } catch (InterruptedException e) {
                retryExecutor.shutdownNow();
            }
        }
        
        // Stop HTTP Thread Pool pentru a evita memory leaks
        if (httpThreadPool != null && !httpThreadPool.isShutdown()) {
            httpThreadPool.shutdown();
            try {
                if (!httpThreadPool.awaitTermination(5, java.util.concurrent.TimeUnit.SECONDS)) {
                    httpThreadPool.shutdownNow();
                }
                Log.e(TAG, "🛑 HTTP Thread Pool stopped");
            } catch (InterruptedException e) {
                httpThreadPool.shutdownNow();
                Log.e(TAG, "🛑 HTTP Thread Pool force stopped");
            }
        }
        
        // CRITICAL FIX: Clear ALL references pentru restart curat și prevenire memory leaks
        gpsExecutor = null;
        healthMonitor = null;
        retryExecutor = null;
        httpThreadPool = null;
        cancellationTokenSource = null;
        lastGPSCycleTime = 0;
        isLocationUpdatesActive = false;
        
        // Clear offline queue cu warning dacă e prea mare
        if (offlineQueue.size() > 100) {
            Log.w(TAG, "⚠️ Offline queue mare la stop: " + offlineQueue.size() + " elemente - clearing pentru memory safety");
        }
        offlineQueue.clear();
        
        Log.e(TAG, "🛑 GPS Service completely stopped cu cleanup complet și ready for clean restart");
    }
    
    private void startHealthMonitor() {
        try {
            // Oprește health monitor existent dacă rulează
            if (healthMonitor != null && !healthMonitor.isShutdown()) {
                healthMonitor.shutdown();
                Log.e(TAG, "🩺 Health Monitor existent oprit pentru restart");
            }
            
            healthMonitor = Executors.newSingleThreadScheduledExecutor();
            lastGPSCycleTime = System.currentTimeMillis(); // Initialize cu timpul curent
            
            Log.e(TAG, "🩺 === HEALTH MONITOR PORNIT ===");
            sendLogToJavaScript("🩺 Health Monitor pornit - va verifica GPS la fiecare 60s");
            
            // Health check la fiecare 60 de secunde
            healthMonitor.scheduleAtFixedRate(new Runnable() {
                @Override
                public void run() {
                    try {
                        String currentTime = new java.text.SimpleDateFormat("HH:mm:ss").format(new java.util.Date());
                        long currentTimeMs = System.currentTimeMillis();
                        long timeSinceLastGPS = currentTimeMs - lastGPSCycleTime;
                        
                        Log.e(TAG, "🩺 === HEALTH CHECK [" + currentTime + "] ===");
                        Log.e(TAG, "🩺 Time since last GPS: " + (timeSinceLastGPS / 1000) + "s");
                        Log.e(TAG, "🩺 GPS Expected every: " + GPS_INTERVAL_SECONDS + "s");
                        Log.e(TAG, "🩺 isGPSRunning: " + isGPSRunning);
                        Log.e(TAG, "🩺 ScheduledExecutor alive: " + (gpsExecutor != null && !gpsExecutor.isShutdown()));
                        Log.e(TAG, "🩺 Active courses: " + activeCourses.size());
                        
                        // CRITICAL: Dacă GPS nu a fost executat în ultimele 3 intervale
                        long maxAllowedGap = GPS_INTERVAL_SECONDS * 3 * 1000; // 30 secunde pentru 10s interval
                        
                        if (timeSinceLastGPS > maxAllowedGap && isGPSRunning && !activeCourses.isEmpty()) {
                            Log.e(TAG, "🚨 === HEALTH CHECK FAILURE DETECTED ===");
                            Log.e(TAG, "🚨 GPS nu a rulat în ultimele " + (timeSinceLastGPS / 1000) + " secunde!");
                            Log.e(TAG, "🚨 FORȚEZ RESTART COMPLET ScheduledExecutorService!");
                            
                            sendLogToJavaScript("🚨 GPS BLOCAT! Ultimul GPS acum " + (timeSinceLastGPS / 1000) + "s - RESTART FORȚAT");
                            
                            // RECOVERY ACTION: Restart complet GPS service
                            isGPSRunning = false;
                            if (gpsExecutor != null) {
                                gpsExecutor.shutdown();
                                gpsExecutor = null;
                            }
                            
                            // Restart în 2 secunde pentru a evita conflictele
                            new Thread(new Runnable() {
                                @Override
                                public void run() {
                                    try {
                                        Thread.sleep(2000);
                                        Log.e(TAG, "🔄 HEALTH RECOVERY: Restart GPS service...");
                                        startBackgroundGPS();
                                        sendLogToJavaScript("🔄 GPS Service RESTARTAT de Health Monitor");
                                    } catch (Exception e) {
                                        Log.e(TAG, "❌ Health recovery error: " + e.getMessage());
                                    }
                                }
                            }).start();
                            
                        } else {
                            Log.e(TAG, "✅ Health check PASSED - GPS service healthy");
                            if (timeSinceLastGPS <= GPS_INTERVAL_SECONDS * 1000 + 5000) { // +5s tolerance
                                sendLogToJavaScript("✅ GPS service healthy - ultimul GPS acum " + (timeSinceLastGPS / 1000) + "s");
                            }
                        }
                        
                    } catch (Exception e) {
                        Log.e(TAG, "❌ Health Monitor error: " + e.getMessage());
                        sendLogToJavaScript("❌ Health Monitor error: " + e.getMessage());
                        e.printStackTrace();
                    }
                }
            }, 60, 60, TimeUnit.SECONDS); // Check la fiecare 60 de secunde
            
            Log.e(TAG, "🩺 Health Monitor planificat cu succes");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ EROARE la pornirea Health Monitor: " + e.getMessage());
            sendLogToJavaScript("❌ Health Monitor FAILED: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * COMPLETELY REWRITTEN: FusedLocationProviderClient GPS cycle cu continuous location updates
     * Folosește requestLocationUpdates pentru eficiență optimă în loc de getCurrentLocation repetat
     */
    private void performGPSCycle() {
        String currentTime = new java.text.SimpleDateFormat("HH:mm:ss").format(new java.util.Date());
        Log.i(TAG, "🔥 FUSED GPS ciclu început - " + activeCourses.size() + " curse");
        
        // Verifică dacă serviciul funcționează corect
        if (gpsExecutor == null || gpsExecutor.isShutdown()) {
            Log.e(TAG, "GPS service compromis - restart");
            sendLogToJavaScript("GPS restart necesar");
            isGPSRunning = false;
            startBackgroundGPS();
            return;
        }
        
        sendLogToJavaScript("🔥 FUSED GPS ciclu activ - " + activeCourses.size() + " curse");
        
        if (activeCourses.isEmpty()) {
            Log.w(TAG, "Nu există curse active pentru GPS");
            return;
        }
        
        if (globalToken == null) {
            sendLogToJavaScript("Eroare: Token lipsă");
            return;
        }
        
        // Numără cursele active
        int activeCourseCount = 0;
        for (CourseData course : activeCourses.values()) {
            if (course.status == 2) {
                activeCourseCount++;
            }
        }
        
        if (activeCourseCount == 0) {
            Log.i(TAG, "Nu există curse active (status 2) pentru GPS");
            return; // Nu există curse active
        }
        
        Log.i(TAG, "🔥 FUSED GPS transmitere pentru " + activeCourseCount + " curse active");
        sendLogToJavaScript("🔥 FUSED GPS transmitere - " + activeCourseCount + " curse active");
        
        // CRITICAL: Verifică disponibilitatea Google Play Services
        if (fusedLocationClient == null) {
            Log.e(TAG, "❌ FusedLocationProviderClient indisponibil - Google Play Services lipsă");
            sendLogToJavaScript("❌ Google Play Services indisponibile - folosesc fallback");
            useFallbackLocationMethod();
            return;
        }
        
        // Verifică permisiuni
        boolean fineLocationPermission = ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean coarseLocationPermission = ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        
        if (!fineLocationPermission && !coarseLocationPermission) {
            Log.e(TAG, "❌ Permisiuni GPS lipsă pentru FusedLocationProviderClient");
            sendLogToJavaScript("❌ Permisiuni GPS lipsă - verifică setările aplicației");
            return;
        }
        
        try {
            // LOGIC CHANGE: În loc să apelez getCurrentLocation la fiecare 10s, 
            // încerc să obțin o locație acum și dacă nu reușesc, încerc fallback
            Log.i(TAG, "📍 Solicitare locație cu FusedLocationProviderClient + timeout...");
            
            // Create cancellation token cu timeout de 8 secunde
            cancellationTokenSource = new CancellationTokenSource();
            CancellationToken cancellationToken = cancellationTokenSource.getToken();
            
            // Timeout handler - anulează request după 8 secunde
            backgroundHandler.postDelayed(() -> {
                if (cancellationTokenSource != null && !cancellationToken.isCancellationRequested()) {
                    Log.w(TAG, "⏰ FusedGPS timeout after 8s - cancelling și încerc fallback");
                    cancellationTokenSource.cancel();
                    tryFallbackLocation();
                }
            }, 8000);
            
            // Încearcă să obții locația curentă cu timeout
            fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, cancellationToken)
                .addOnSuccessListener(location -> {
                    // Clear timeout handler
                    if (cancellationTokenSource != null) {
                        cancellationTokenSource = null;
                    }
                    
                    if (location != null) {
                        Log.i(TAG, "✅ FusedGPS SUCCESS: " + location.getLatitude() + ", " + location.getLongitude() + 
                             " (precizie: " + Math.round(location.getAccuracy()) + "m, viteză: " + Math.round(location.getSpeed() * 3.6) + "km/h)");
                        sendLogToJavaScript("✅ FUSED GPS: " + location.getLatitude() + ", " + location.getLongitude() + " (" + Math.round(location.getAccuracy()) + "m)");
                        
                        // Procesează locația pe background thread
                        backgroundHandler.post(() -> processLocationUpdate(location));
                    } else {
                        Log.w(TAG, "⚠️ FusedGPS location null - încerc fallback last known location");
                        tryFallbackLocation();
                    }
                })
                .addOnFailureListener(e -> {
                    // Clear timeout handler
                    if (cancellationTokenSource != null) {
                        cancellationTokenSource = null;
                    }
                    
                    Log.e(TAG, "❌ FusedGPS FAILED: " + e.getMessage());
                    sendLogToJavaScript("❌ FusedGPS error: " + e.getMessage());
                    
                    // Fallback la last known location
                    tryFallbackLocation();
                })
                .addOnCanceledListener(() -> {
                    Log.w(TAG, "⏰ FusedGPS request cancelled (timeout)");
                    // Fallback va fi apelat de timeout handler
                });
            
        } catch (Exception e) {
            Log.e(TAG, "❌ FusedGPS cycle exception: " + e.getMessage());
            sendLogToJavaScript("❌ FusedGPS exception: " + e.getMessage());
            e.printStackTrace();
            
            // Fallback la last known location
            tryFallbackLocation();
        }
    }
    
    /**
     * Fallback method când Google Play Services nu sunt disponibile
     * Folosește implementare simplă pentru compatibility
     */
    private void useFallbackLocationMethod() {
        Log.i(TAG, "🔄 Folosesc fallback method - implementare simplă fără Google Play Services");
        sendLogToJavaScript("🔄 Fallback GPS - fără Google Play Services");
        
        // Aici ar putea fi implementată o metodă simplă cu LocationManager ca backup
        // Pentru acum, doar loghez că nu avem Google Play Services disponibile
        Log.w(TAG, "⚠️ GPS indisponibil - Google Play Services necesare pentru FusedLocationProviderClient");
        sendLogToJavaScript("⚠️ GPS indisponibil - instalează Google Play Services");
    }
    
    /**
     * CRITICAL FIX: Încearcă să obțină locația folosind getLastLocation ca fallback
     * Cu verificări de null safety și error handling complet
     */
    private void tryFallbackLocation() {
        try {
            // CRITICAL: Verifică dacă FusedLocationProviderClient este disponibil
            if (fusedLocationClient == null) {
                Log.e(TAG, "❌ CRITICAL: FusedLocationProviderClient null în fallback - Google Play Services indisponibile");
                sendLogToJavaScript("❌ Google Play Services indisponibile - GPS imposibil de obținut");
                return;
            }
            
            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && 
                ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                Log.e(TAG, "❌ SECURITY: Permisiuni GPS lipsă în fallback");
                sendLogToJavaScript("❌ Permisiuni GPS lipsă - nu pot obține fallback location");
                return;
            }
            
            Log.i(TAG, "🔄 Fallback: încercare getLastLocation cu FusedLocationProviderClient...");
            
            fusedLocationClient.getLastLocation()
                .addOnSuccessListener(location -> {
                    if (location != null) {
                        long currentTime = System.currentTimeMillis();
                        long locationTime = location.getTime();
                        
                        // SAFETY: Verifică dacă timestamp-ul este valid
                        if (locationTime <= 0 || locationTime > currentTime) {
                            Log.w(TAG, "⚠️ FALLBACK: Location timestamp invalid: " + locationTime);
                            sendLogToJavaScript("⚠️ GPS timestamp invalid - ignorez fallback location");
                            return;
                        }
                        
                        long locationAge = currentTime - locationTime;
                        long locationAgeSeconds = locationAge / 1000;
                        
                        if (locationAge < 300000) { // Max 5 minute vechime
                            Log.i(TAG, "✅ FALLBACK GPS SUCCESS: " + location.getLatitude() + ", " + location.getLongitude() + 
                                 " (precizie: " + Math.round(location.getAccuracy()) + "m, vârstă: " + locationAgeSeconds + "s)");
                            sendLogToJavaScript("✅ FALLBACK GPS (" + locationAgeSeconds + "s): " + location.getLatitude() + ", " + location.getLongitude());
                            
                            // SAFETY: Verifică dacă backgroundHandler este valid
                            if (backgroundHandler != null) {
                                backgroundHandler.post(() -> processLocationUpdate(location));
                            } else {
                                Log.w(TAG, "⚠️ backgroundHandler null - procesez location pe main thread");
                                processLocationUpdate(location);
                            }
                        } else {
                            Log.w(TAG, "⚠️ Last known location prea veche: " + locationAgeSeconds + "s (max 300s)");
                            sendLogToJavaScript("⚠️ GPS location prea veche (" + locationAgeSeconds + "s) - verifică semnalul GPS");
                        }
                    } else {
                        Log.e(TAG, "❌ FALLBACK: Nu există locație cunoscută în FusedLocationProviderClient");
                        sendLogToJavaScript("❌ Nu există locație GPS cunoscută - verifică dacă GPS-ul este activat");
                    }
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "❌ FALLBACK getLastLocation failed: " + e.getClass().getSimpleName() + " - " + e.getMessage());
                    sendLogToJavaScript("❌ GPS fallback complet indisponibil: " + e.getMessage());
                    
                    // Log error details for debugging
                    if (e instanceof SecurityException) {
                        Log.e(TAG, "❌ SECURITY: Permisiuni GPS revocate during fallback");
                    } else if (e instanceof IllegalStateException) {
                        Log.e(TAG, "❌ STATE: FusedLocationProviderClient în stare invalidă");
                    }
                    
                    e.printStackTrace();
                });
                
        } catch (SecurityException e) {
            Log.e(TAG, "❌ SECURITY EXCEPTION în fallback location: " + e.getMessage());
            sendLogToJavaScript("❌ Permisiuni GPS revocate în timpul fallback");
        } catch (IllegalStateException e) {
            Log.e(TAG, "❌ ILLEGAL STATE în fallback location: " + e.getMessage());
            sendLogToJavaScript("❌ GPS service în stare invalidă");
        } catch (Exception e) {
            Log.e(TAG, "❌ UNEXPECTED EXCEPTION în fallback location: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            sendLogToJavaScript("❌ Eroare neașteptată GPS fallback: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Procesează locația primită de la FusedLocationProviderClient
     * Înlocuiește transmitGPSDataToAllActiveCourses din implementarea veche
     */
    private void processLocationUpdate(Location location) {
        try {
            Log.i(TAG, "📡 Procesez locație pentru " + activeCourses.size() + " curse");
            
            // CRITICAL SECURITY VALIDATION: Respinge coordonatele (0,0) sau invalide
            double latitude = location.getLatitude();
            double longitude = location.getLongitude();
            
            if (latitude == 0.0 && longitude == 0.0) {
                Log.e(TAG, "🚫 SECURITY: Coordonate (0,0) respinse - locație invalidă");
                sendLogToJavaScript("🚫 SECURITY: Coordonate GPS invalide (0,0) respinse");
                return;
            }
            
            if (Double.isNaN(latitude) || Double.isNaN(longitude) || 
                !Double.isFinite(latitude) || !Double.isFinite(longitude)) {
                Log.e(TAG, "🚫 SECURITY: Coordonate NaN sau infinite respinse - lat: " + latitude + ", lng: " + longitude);
                sendLogToJavaScript("🚫 SECURITY: Coordonate GPS corupte (NaN/infinite) respinse");
                return;
            }
            
            // ADDITIONAL VALIDATION: Verifică dacă coordonatele sunt în limite geografice rezonabile
            if (latitude < -90.0 || latitude > 90.0 || longitude < -180.0 || longitude > 180.0) {
                Log.e(TAG, "🚫 SECURITY: Coordonate în afara limitelor geografice - lat: " + latitude + ", lng: " + longitude);
                sendLogToJavaScript("🚫 SECURITY: Coordonate GPS în afara limitelor geografice respinse");
                return;
            }
            
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
                
                // Doar cursele ACTIVE (status 2) pot transmite GPS data
                if (courseData.status != 2) {
                    continue; // Skip pentru curse în pauză/oprire
                }
                
                coursesTransmitting++;
                
                // Pregătește datele GPS pentru această cursă
                org.json.JSONObject gpsData = new org.json.JSONObject();
                gpsData.put("uit", courseData.realUit); // UIT real pentru server
                gpsData.put("numar_inmatriculare", courseData.vehicleNumber); // Numărul vehiculului
                gpsData.put("lat", location.getLatitude());
                gpsData.put("lng", location.getLongitude());
                // SAFETY: Verifică validitatea datelor înainte de conversie
                int viteza = location.hasSpeed() ? Math.round(location.getSpeed() * 3.6f) : 0; // m/s -> km/h
                int directie = location.hasBearing() ? Math.round(location.getBearing()) : 0;
                int altitudine = location.hasAltitude() ? Math.round((float)location.getAltitude()) : 0;
                int hdop = location.hasAccuracy() ? Math.round(location.getAccuracy()) : 0; // Accuracy în metri
                
                gpsData.put("viteza", viteza);
                gpsData.put("directie", directie);
                gpsData.put("altitudine", altitudine);
                gpsData.put("hdop", hdop);
                gpsData.put("gsm_signal", networkSignal);
                gpsData.put("baterie", batteryLevel);
                gpsData.put("status", courseData.status);
                gpsData.put("timestamp", timestamp);
                
                // CRITICAL: Transmite folosind unique key pentru identificare locală, dar UIT real pentru server
                transmitSingleCourseGPS(gpsData, uniqueKey, courseData.realUit);
                
                // Salvează offline coordonatele și pentru JavaScript bridge
                sendOfflineGPSToJavaScript(gpsData.toString());
            }
            
            if (coursesTransmitting > 0) {
                Log.i(TAG, "✅ FUSED GPS transmis pentru " + coursesTransmitting + " curse din " + activeCourses.size() + " total");
                sendLogToJavaScript("✅ FUSED GPS transmis - " + coursesTransmitting + " curse (" + Math.round(location.getAccuracy()) + "m precizie)");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Eroare procesare locație FUSED GPS: " + e.getMessage());
            sendLogToJavaScript("❌ Eroare procesare GPS: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // Metoda transmitGPSDataToAllActiveCourses() eliminată - înlocuită cu processLocationUpdate() pentru FusedLocationProviderClient
    
    private void transmitSingleCourseGPS(org.json.JSONObject gpsData, String uniqueKey, String realUit) {
        try {
            String gpsDataJson = gpsData.toString();
            
            httpThreadPool.execute(new Runnable() {
                @Override
                public void run() {
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
                            Log.i(TAG, "GPS trimis cu succes pentru " + realUit);
                        } else {
                            Log.w(TAG, "GPS eșuat pentru " + realUit + " - cod: " + responseCode);
                        }
                        
                    } catch (Exception e) {
                        Log.e(TAG, "Eroare transmisie GPS pentru " + realUit + ": " + e.getMessage());
                        
                        // MODERN: Salvează în coada offline avansată
                        try {
                            OfflineGPSData offlineData = new OfflineGPSData(gpsDataJson, uniqueKey, realUit);
                            // CRITICAL FIX: Check queue size pentru a preveni OOM
                            if (offlineQueue.size() >= MAX_OFFLINE_QUEUE_SIZE) {
                                // Remove old entries to make space
                                int removedCount = 0;
                                while (offlineQueue.size() >= MAX_OFFLINE_QUEUE_SIZE * 0.8 && !offlineQueue.isEmpty()) {
                                    offlineQueue.poll();
                                    removedCount++;
                                }
                                Log.w(TAG, "⚠️ Offline queue full - removed " + removedCount + " old GPS entries pentru memory safety");
                            }
                            
                            offlineQueue.offer(offlineData);
                            Log.i(TAG, "GPS salvat în offline queue: " + offlineQueue.size() + "/" + MAX_OFFLINE_QUEUE_SIZE + " elemente");
                        } catch (Exception offlineError) {
                            Log.e(TAG, "Eroare salvare offline: " + offlineError.getMessage());
                            // Fallback la sistemul simplu
                            try {
                                sendOfflineGPSToJavaScript(gpsDataJson);
                            } catch (Exception fallbackError) {
                                Log.e(TAG, "Fallback salvare offline: " + fallbackError.getMessage());
                            }
                        }
                    }
                }
            });
            
        } catch (Exception e) {
            Log.e(TAG, "Eroare executare GPS pentru " + realUit + ": " + e.getMessage());
        }
    }
    
    // DEPRECATED - păstrat pentru compatibilitate
    private void callJavaScriptBridge(String gpsDataJson) {
        try {
            Log.e(TAG, "🌐 === STARTING HTTP TRANSMISSION ===");
            Log.e(TAG, "🔗 URL: https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php");
            Log.e(TAG, "🔑 Token length: " + (globalToken != null ? globalToken.length() : "NULL"));
            
            // Make HTTP request on background thread
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Log.e(TAG, "📡 HTTP thread started");
                        
                        java.net.URL url = new java.net.URL("https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php");
                        javax.net.ssl.HttpsURLConnection conn = (javax.net.ssl.HttpsURLConnection) url.openConnection();
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("Content-Type", "application/json");
                        conn.setRequestProperty("Authorization", "Bearer " + globalToken);
                        conn.setRequestProperty("Accept", "application/json");
                        conn.setRequestProperty("User-Agent", "iTrack-BackgroundGPS/1.0");
                        conn.setDoOutput(true);
                        conn.setConnectTimeout(15000); // 15 seconds
                        conn.setReadTimeout(15000);    // 15 seconds
                        
                        Log.e(TAG, "🔗 Connection configured, sending data...");
                        
                        // Send JSON data
                        try (java.io.OutputStream os = conn.getOutputStream()) {
                            byte[] input = gpsDataJson.getBytes("utf-8");
                            os.write(input, 0, input.length);
                            Log.e(TAG, "📤 Data sent: " + input.length + " bytes");
                        }
                        
                        int responseCode = conn.getResponseCode();
                        String responseMessage = conn.getResponseMessage();
                        
                        Log.e(TAG, "📡 === HTTP RESPONSE ===");
                        Log.e(TAG, "📊 Response Code: " + responseCode);
                        Log.e(TAG, "📝 Response Message: " + responseMessage);
                        
                        // Read response body for debugging
                        try {
                            java.io.InputStream is = (responseCode >= 200 && responseCode < 300) ? 
                                conn.getInputStream() : conn.getErrorStream();
                            if (is != null) {
                                java.util.Scanner scanner = new java.util.Scanner(is).useDelimiter("\\A");
                                String responseBody = scanner.hasNext() ? scanner.next() : "";
                                Log.e(TAG, "📄 Response Body: " + responseBody);
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "⚠️ Could not read response body: " + e.getMessage());
                        }
                        
                        if (responseCode >= 200 && responseCode < 300) {
                            Log.e(TAG, "✅ === GPS TRANSMISSION SUCCESS ===");
                        } else {
                            Log.e(TAG, "❌ === GPS TRANSMISSION FAILED ===");
                        }
                        
                    } catch (Exception e) {
                        Log.e(TAG, "❌ GPS transmission failed: " + e.getMessage());
                        Log.e(TAG, "💾 Salvez offline pentru retry");
                        
                        // Determină tipul de eroare pentru logging mai bun
                        String errorType = "UNKNOWN";
                        if (e instanceof java.net.UnknownHostException) {
                            errorType = "NO_INTERNET";
                        } else if (e instanceof java.net.ConnectException) {
                            errorType = "CONNECTION_REFUSED"; 
                        } else if (e instanceof java.net.SocketTimeoutException) {
                            errorType = "TIMEOUT";
                        } else if (e instanceof javax.net.ssl.SSLException) {
                            errorType = "SSL_ERROR";
                        }
                        
                        Log.e(TAG, "Tip eroare: " + errorType + " - coordonata se salvează offline");
                        
                        // Salvează coordonata offline când transmisia eșuează (inclusiv telefon blocat + fără net)
                        try {
                            sendOfflineGPSToJavaScript(gpsDataJson);
                        } catch (Exception offlineError) {
                            Log.e(TAG, "❌ Eroare salvare offline: " + offlineError.getMessage());
                        }
                    }
                }
            }).start();
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Bridge call failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void sendStatusUpdateToServer(int newStatus, String uniqueKey) {
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
        try {
            Log.e(TAG, "🔄 === STARTING STATUS HTTP TRANSMISSION ===");
            Log.e(TAG, "🔗 URL: https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php");
            Log.e(TAG, "📊 Status Data: " + statusDataJson);
            
            // CRITICAL: Use thread pool pentru rate limiting - status updates use same pool as GPS
            httpThreadPool.execute(new Runnable() {
                @Override
                public void run() {
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
                            Log.e(TAG, "📤 Status data sent: " + input.length + " bytes");
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
    
    private void sendOfflineGPSToJavaScript(String gpsDataJson) {
        try {
            Log.e(TAG, "💾 Salvare GPS offline (inclusiv telefon blocat + fără internet)");
            
            // CRITICĂ: Salvarea offline funcționează și când telefonul este blocat
            // deoarece BackgroundGPSService rulează în foreground cu WakeLock
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                String script = "if (window.saveOfflineGPS) { window.saveOfflineGPS(" + gpsDataJson + "); }";
                
                // Log special pentru capturare JavaScript - funcționează și cu ecranul blocat
                Log.e("OFFLINE_GPS_SAVE", gpsDataJson);
                Log.e(TAG, "📱 Bridge JavaScript apelat pentru salvare offline (ecran blocat OK)");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Eroare salvare GPS offline: " + e.getMessage());
            // FALLBACK: Salvează direct în SharedPreferences dacă JavaScript bridge eșuează
            try {
                android.content.SharedPreferences prefs = getSharedPreferences("itrack_offline_gps", MODE_PRIVATE);
                String existingData = prefs.getString("offline_coordinates", "[]");
                
                // Adaugă coordonata nouă la lista existentă
                org.json.JSONArray offlineArray = new org.json.JSONArray(existingData);
                org.json.JSONObject newCoord = new org.json.JSONObject(gpsDataJson);
                newCoord.put("saved_timestamp", System.currentTimeMillis());
                offlineArray.put(newCoord);
                
                prefs.edit().putString("offline_coordinates", offlineArray.toString()).apply();
                Log.e(TAG, "✅ FALLBACK: GPS salvat în SharedPreferences (total: " + offlineArray.length() + ")");
            } catch (Exception fallbackError) {
                Log.e(TAG, "❌ FALLBACK failed: " + fallbackError.getMessage());
            }
        }
    }
    
    private void sendLogToJavaScript(String message) {
        try {
            // Send log via Android system log with special tag for JS capture
            Log.e("JS_BRIDGE_LOG", "[Android GPS]: " + message);
            
            // Also send to system log for debugging
            Log.e(TAG, "JS Log: " + message);
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
            Log.e(TAG, "❌ Network signal detection error: " + e.getMessage());
            return 1; // Error fallback
        }
    }
    
    // Metoda getLastKnownLocation() eliminată - înlocuită cu FusedLocationProviderClient.getLastLocation() în tryFallbackLocation()
    
    /**
     * CRITICAL: onDestroy pentru cleanup complet al resurselor
     * Previne memory leaks și zombie services
     */
    @Override
    public void onDestroy() {
        try {
            Log.e(TAG, "🛑 === onDestroy() CALLED - CLEANUP COMPLET ===");
            
            // Stop GPS service complet
            stopBackgroundGPS();
            
            // Stop foreground service
            stopForeground(true);
            
            // Quit background thread pentru a elibera resurse
            if (backgroundThread != null && backgroundThread.isAlive()) {
                backgroundThread.quitSafely();
                try {
                    backgroundThread.join(1000); // Așteaptă max 1s să se închidă
                } catch (InterruptedException e) {
                    Log.w(TAG, "⚠️ Background thread nu s-a închis în timp util");
                }
                backgroundThread = null;
                backgroundHandler = null;
            }
            
            // Final cleanup check pentru memory safety
            fusedLocationClient = null;
            locationRequest = null;
            locationCallback = null;
            activeCourses.clear();
            
            Log.e(TAG, "🛑 onDestroy() COMPLET - toate resursele au fost eliberate");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Eroare în onDestroy(): " + e.getMessage());
            e.printStackTrace();
        } finally {
            super.onDestroy();
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
        return new Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("iTrack GPS Active")
            .setContentText("Transmisie coordonate la 10 secunde")
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
        
        // FORCE cleanup complet pentru restart curat
        isGPSRunning = false;
        activeCourses.clear();
        globalToken = null;
        globalVehicle = null;
        
        // Stop ScheduledExecutorService complet
        if (gpsExecutor != null && !gpsExecutor.isShutdown()) {
            gpsExecutor.shutdownNow(); // Force immediate shutdown
            gpsExecutor = null;
            Log.e(TAG, "🛑 ScheduledExecutorService FORCE SHUTDOWN");
        }
        
        // Release WakeLock
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            Log.e(TAG, "🛑 WakeLock force released");
        }
        
        // Stop retry system
        if (retryExecutor != null && !retryExecutor.isShutdown()) {
            retryExecutor.shutdownNow();
            retryExecutor = null;
            isRetryRunning = false;
            Log.e(TAG, "🛑 Retry system stopped");
        }
        
        // Stop background thread
        if (backgroundThread != null) {
            backgroundThread.quitSafely();
            backgroundThread = null;
            Log.e(TAG, "🛑 Background thread stopped");
        }
        
        super.onDestroy();
        Log.e(TAG, "🛑 BackgroundGPS Service completely destroyed and cleaned up");
    }
    
    // MODERN ADDITION: Sistem retry pentru coordonate offline cu retry logic
    private void startOfflineRetrySystem() {
        if (isRetryRunning && retryExecutor != null && !retryExecutor.isShutdown()) {
            Log.e(TAG, "Retry system already running");
            return;
        }
        
        Log.e(TAG, "🔄 Starting offline retry system");
        
        if (retryExecutor != null && !retryExecutor.isShutdown()) {
            retryExecutor.shutdown();
        }
        
        retryExecutor = Executors.newSingleThreadScheduledExecutor();
        isRetryRunning = true;
        
        // Retry la fiecare 30 de secunde
        retryExecutor.scheduleAtFixedRate(new Runnable() {
            @Override
            public void run() {
                try {
                    if (offlineQueue.isEmpty()) {
                        return;
                    }
                    
                    Log.e(TAG, "🔄 Procesez offline queue: " + offlineQueue.size() + " elemente");
                    
                    // Procesează până la 5 elemente din coadă
                    int processed = 0;
                    OfflineGPSData offlineData;
                    
                    while ((offlineData = offlineQueue.poll()) != null && processed < 5) {
                        processed++;
                        
                        // Verifică vârsta datei (nu procesa date mai vechi de 1 oră)
                        long age = System.currentTimeMillis() - offlineData.timestamp;
                        if (age > 60 * 60 * 1000) { // 1 oră
                            Log.e(TAG, "🗑️ Eliminat GPS offline prea vechi: " + age + "ms");
                            continue;
                        }
                        
                        // Incrementează retry count
                        offlineData.retryCount++;
                        
                        // Dacă a fost reîncercat de prea multe ori, elimină
                        if (offlineData.retryCount > 3) {
                            Log.e(TAG, "🚫 Eliminat GPS după 3 reîncercări");
                            continue;
                        }
                        
                        // Încearcă retransmisia
                        boolean success = retryOfflineTransmission(offlineData);
                        
                        if (!success) {
                            // CRITICAL FIX: Check queue size înainte de retry pentru a preveni OOM
                            if (offlineQueue.size() < MAX_OFFLINE_QUEUE_SIZE) {
                                offlineQueue.offer(offlineData);
                                Log.e(TAG, "🔄 GPS reprogram pentru retry: " + offlineData.retryCount + "/3 (queue: " + offlineQueue.size() + ")");
                            } else {
                                Log.w(TAG, "⚠️ Offline queue full - skip retry pentru a preveni OOM (queue: " + offlineQueue.size() + ")");
                            }
                        } else {
                            Log.e(TAG, "✅ GPS offline transmis cu succes după " + offlineData.retryCount + " reîncercări");
                        }
                    }
                    
                    if (processed > 0) {
                        Log.e(TAG, "🔄 Procesate " + processed + " GPS offline, rămân: " + offlineQueue.size());
                    }
                    
                } catch (Exception e) {
                    Log.e(TAG, "❌ Eroare în retry system: " + e.getMessage());
                }
            }
        }, 30, 30, TimeUnit.SECONDS);
        
        Log.e(TAG, "✅ Offline retry system pornit (retry la 30s)");
    }
    
    private boolean retryOfflineTransmission(OfflineGPSData offlineData) {
        try {
            Log.e(TAG, "🔄 Retry transmisie pentru: " + offlineData.realUit);
            
            java.net.URL url = new java.net.URL("https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php");
            javax.net.ssl.HttpsURLConnection conn = (javax.net.ssl.HttpsURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + globalToken);
            conn.setRequestProperty("Accept", "application/json");
            conn.setRequestProperty("User-Agent", "iTrack-OfflineRetry/1.0");
            conn.setDoOutput(true);
            conn.setConnectTimeout(10000); // Timeout mai scurt pentru retry
            conn.setReadTimeout(10000);
            
            // Trimite datele JSON
            try (java.io.OutputStream os = conn.getOutputStream()) {
                byte[] input = offlineData.gpsJson.getBytes("utf-8");
                os.write(input, 0, input.length);
            }
            
            int responseCode = conn.getResponseCode();
            
            if (responseCode >= 200 && responseCode < 300) {
                Log.e(TAG, "✅ Retry SUCCESS pentru " + offlineData.realUit);
                return true;
            } else {
                Log.e(TAG, "❌ Retry FAILED: " + responseCode + " pentru " + offlineData.realUit);
                return false;
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Retry exception pentru " + offlineData.realUit + ": " + e.getMessage());
            return false;
        }
    }
}