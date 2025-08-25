package com.euscagency.itrack;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.location.LocationManager;
import android.location.LocationListener;
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
    
    private LocationManager locationManager;
    private PowerManager.WakeLock wakeLock;
    private ScheduledExecutorService gpsExecutor;
    private HandlerThread backgroundThread;
    private Handler backgroundHandler;
    
    // MULTI-UIT SUPPORT: Thread-safe Map pentru toate cursele active simultan - CRITICAL pentru multi-threading
    private java.util.Map<String, CourseData> activeCourses = new java.util.concurrent.ConcurrentHashMap<>();
    private String globalToken;
    
    // SIMPLIFICAT: Eliminare sistem complex de health monitoring
    // private java.util.concurrent.ScheduledExecutorService healthMonitor;
    // private long lastGPSCycleTime = 0;
    
    // RATE LIMITING: Thread pool pentru HTTP transmissions pentru a evita server overloading
    private java.util.concurrent.ThreadPoolExecutor httpThreadPool;
    private String globalVehicle;
    private boolean isGPSRunning = false;
    
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
        
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        
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
    
    // Initialize HTTP Thread Pool pentru rate limiting - max 3 connections simultan
    private void initializeHttpThreadPool() {
        try {
            if (httpThreadPool == null || httpThreadPool.isShutdown()) {
                httpThreadPool = new java.util.concurrent.ThreadPoolExecutor(
                    1, // Core threads - minim 1
                    3, // Max threads - maxim 3 simultan pentru a nu supraîncărca serverul
                    60L, // Keep alive 60 secunde
                    java.util.concurrent.TimeUnit.SECONDS,
                    new java.util.concurrent.LinkedBlockingQueue<Runnable>() // Queue unlimited
                );
                Log.e(TAG, "🔧 HTTP Thread Pool inițializat: max 3 connections simultan");
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
            String uniqueKey = globalVehicle + "_" + uitId; // Vehicul + ikRoTrans = key unic
            
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
            
            Log.e(TAG, "Status update: " + specificUIT + " → " + newStatus + " (vehicul: " + vehicleForUpdate + ")");
            
            // CRITICAL: Construiește key unic pentru găsirea cursei corecte
            String uniqueKeyForUpdate = vehicleForUpdate + "_" + specificUIT;
            Log.e(TAG, "🔍 Searching for course with unique key: " + uniqueKeyForUpdate);
            
            CourseData courseData = activeCourses.get(uniqueKeyForUpdate);
            if (courseData != null) {
                int oldStatus = courseData.status;
                Log.e(TAG, "Updating course status: " + oldStatus + " → " + newStatus + " pentru UIT: " + specificUIT);
                
                if (newStatus == 2) { // ACTIVE/RESUME
                    courseData.status = 2;
                    Log.e(TAG, "RESUME: UIT " + specificUIT + " reactivat cu STATUS 2");
                    
                    // CRITICAL DEBUG: Verifică status după setare
                    Log.e(TAG, "🔍 VERIFY: courseData.status după resume = " + courseData.status);
                    
                    // CRITICAL FIX: NU trimite status la server din Android - JavaScript deja a trimis!
                    Log.e(TAG, "🚫 SKIP server status update - JavaScript updateCourseStatus already sent status 2 to server pentru " + specificUIT);
                    
                    // CRITICAL FIX: GPS trebuie să continue pentru cursa resumed
                    if (!isGPSRunning) {
                        Log.e(TAG, "🚀 Starting GPS service pentru RESUME");
                        startBackgroundGPS();
                    } else {
                        Log.e(TAG, "⚡ GPS service deja activ - asigur continuitate pentru " + specificUIT);
                        Log.e(TAG, "📡 ScheduledExecutorService va include automat cursul resumed în următorul ciclu de 10s");
                        
                        // CRITICAL DEBUG: Verifică toate cursele și statusurile lor
                        Log.e(TAG, "📊 === STATUS CHECK DUPĂ RESUME ===");
                        int activeCount = 0;
                        for (java.util.Map.Entry<String, CourseData> debugEntry : activeCourses.entrySet()) {
                            CourseData debugCourse = debugEntry.getValue();
                            Log.e(TAG, "📋 Course: " + debugEntry.getKey() + " → Status: " + debugCourse.status);
                            if (debugCourse.status == 2) activeCount++;
                        }
                        Log.e(TAG, "📊 Total ACTIVE courses după resume: " + activeCount + "/" + activeCourses.size());
                    }
                } else if (newStatus == 3) { // PAUSE
                    courseData.status = 3;
                    Log.e(TAG, "PAUSE: UIT " + specificUIT + " - status setat pe PAUSE (GPS va fi OPRIT pentru această cursă)");
                    
                    // CRITICAL FIX: NU trimite status la server din Android - JavaScript deja a trimis!
                    Log.e(TAG, "🚫 SKIP server status update - JavaScript updateCourseStatus already sent status 3 to server");
                    
                    // DEBUG: Verifică dacă status-ul s-a actualizat corect
                    Log.e(TAG, "🔍 VERIFY PAUSE: courseData.status = " + courseData.status + " pentru UIT " + specificUIT);
                    
                    // CRITICAL: Verifică dacă mai există curse active după PAUSE
                    int activeCourseCount = 0;
                    for (CourseData course : activeCourses.values()) {
                        if (course.status == 2) {
                            activeCourseCount++;
                        }
                    }
                    
                    Log.e(TAG, "📊 După PAUSE - curse ACTIVE rămase: " + activeCourseCount + "/" + activeCourses.size());
                    
                    if (activeCourseCount == 0) {
                        Log.e(TAG, "🛑 TOATE cursele în PAUSE - opresc GPS complet!");
                        stopBackgroundGPS();
                    } else {
                        Log.e(TAG, "⚡ GPS continuă pentru " + activeCourseCount + " curse ACTIVE rămase");
                    }
                    
                } else if (newStatus == 4) { // STOP
                    Log.e(TAG, "STOP: UIT " + specificUIT + " finalizat complet");
                    activeCourses.remove(uniqueKeyForUpdate);
                    Log.e(TAG, "📋 Cursă eliminată din tracking. Curse rămase: " + activeCourses.size());
                    
                    if (activeCourses.isEmpty()) {
                        Log.e(TAG, "🛑 TOATE cursele STOP - opresc GPS complet!");
                        stopBackgroundGPS();
                    }
                }
            } else {
                Log.e(TAG, "Cursă cu key " + uniqueKeyForUpdate + " nu există");
            }
        } else if (intent != null && "STOP_BACKGROUND_GPS".equals(intent.getAction())) {
            String uitToStop = intent.getStringExtra("uit");
            String vehicleToStop = intent.getStringExtra("vehicle");
            String uniqueKeyToStop = vehicleToStop + "_" + uitToStop;
            
            Log.e(TAG, "🛑 STOP specific UIT: " + uitToStop + " (key: " + uniqueKeyToStop + ")");
            
            // Elimină cursa din tracking
            activeCourses.remove(uniqueKeyToStop);
            Log.e(TAG, "📋 Curse rămase: " + activeCourses.size());
            
            // Dacă nu mai sunt curse, oprește GPS complet
            if (activeCourses.isEmpty()) {
                Log.e(TAG, "🛑 Nu mai sunt curse - opresc GPS complet!");
                stopBackgroundGPS();
                // stopSelf(); // CRITICAL: NU opri serviciul complet - poate fi reactivat din JavaScript
            } else {
                Log.e(TAG, "⚡ GPS continuă pentru cursele rămase: " + activeCourses.size());
            }
        } else if (intent != null && "CLEAR_ALL_ON_LOGOUT".equals(intent.getAction())) {
            Log.e(TAG, "🧹 CLEAR ALL COURSES - LOGOUT complet");
            activeCourses.clear();
            stopBackgroundGPS();
            globalToken = null;
            globalVehicle = null;
            // stopSelf(); // CRITICAL: NU opri serviciul complet pentru a permite reconnectare
        }
        
        return START_STICKY; // CRITICAL pentru restart automat Android
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
        
        Log.e(TAG, "🚀 STARTING BACKGROUND GPS SYSTEM - SINGLE THREAD SCHEDULER");
        sendLogToJavaScript("🚀 STARTING GPS Background Service - tracking " + activeCourses.size() + " curse");
        
        // Initialize HTTP Thread Pool dacă nu există
        if (httpThreadPool == null || httpThreadPool.isShutdown()) {
            initializeHttpThreadPool();
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
                    Log.e(TAG, "🔧 Thread: " + Thread.currentThread().getName());
                    Log.e(TAG, "🔧 isGPSRunning: " + isGPSRunning);
                    Log.e(TAG, "🔧 activeCourses.size(): " + activeCourses.size());
                    
                    sendLogToJavaScript("⏰ SCHEDULED TASK EXECUTION");
                    
                    try {
                        performGPSCycle();
                        
                        // SIMPLIFICAT: Eliminare health monitoring timestamp
                        // lastGPSCycleTime = System.currentTimeMillis();
                        
                        Log.e(TAG, "✅ GPS cycle completed successfully");
                        sendLogToJavaScript("✅ GPS cycle completed");
                        
                        // CRITICAL: WakeLock renewal la fiecare ciclu pentru prevenirea kill de Android
                        if (wakeLock != null && wakeLock.isHeld()) {
                            wakeLock.release();
                            wakeLock.acquire(60 * 60 * 1000); // Re-acquire pentru încă 1 oră
                            Log.e(TAG, "🔄 WakeLock renewed pentru continuare garantată");
                        } else if (wakeLock != null) {
                            // WakeLock a fost eliberat - reîl dobândește
                            Log.e(TAG, "🚨 WakeLock a fost eliberat - redobândire forțată!");
                            wakeLock.acquire(60 * 60 * 1000);
                            sendLogToJavaScript("🚨 WakeLock redobândit forțat");
                        }
                        
                        // CRITICAL DEBUG: Verifică ScheduledExecutorService health la fiecare ciclu
                        if (gpsExecutor != null && !gpsExecutor.isShutdown()) {
                            Log.e(TAG, "🟢 ScheduledExecutorService HEALTHY - va continua la următorul ciclu în " + GPS_INTERVAL_SECONDS + "s");
                            sendLogToJavaScript("🟢 ScheduledExecutorService HEALTHY - următorul ciclu în " + GPS_INTERVAL_SECONDS + "s");
                        } else {
                            Log.e(TAG, "🚨 CRITICAL: ScheduledExecutorService COMPROMIS! - nu va continua ciclurile!");
                            sendLogToJavaScript("🚨 CRITICAL: ScheduledExecutorService COMPROMIS!");
                        }
                        
                    } catch (Exception e) {
                        Log.e(TAG, "❌ EROARE CRITICĂ în GPS cycle: " + e.getMessage());
                        Log.e(TAG, "🔥 ERROR în GPS cycle, dar ScheduledExecutorService VA CONTINUA să ruleze");
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
                0, // PRIMA EXECUȚIE IMEDIAT (nu după 10 secunde)
                GPS_INTERVAL_SECONDS, // APOI LA FIECARE 10 SECUNDE  
                TimeUnit.SECONDS
            );
            
            Log.e(TAG, "🔧 ScheduledFuture created: " + (future != null));
            Log.e(TAG, "🔧 Is cancelled: " + (future != null ? future.isCancelled() : "N/A"));
            Log.e(TAG, "🔧 Is done: " + (future != null ? future.isDone() : "N/A"));
            
            // CRITICAL DEBUG: Stochează ScheduledFuture pentru monitoring continuu
            final java.util.concurrent.ScheduledFuture<?> monitoredFuture = future;
            
            // CRITICAL DEBUG: Start monitoring thread pentru ScheduledExecutorService health
            new Thread(new Runnable() {
                @Override
                public void run() {
                    for (int i = 0; i < 6; i++) { // Monitor pentru 60 secunde (6 x 10s)
                        try {
                            Thread.sleep(10000); // Așteaptă 10 secunde
                            if (monitoredFuture != null) {
                                boolean cancelled = monitoredFuture.isCancelled();
                                boolean done = monitoredFuture.isDone();
                                boolean executorShutdown = gpsExecutor == null || gpsExecutor.isShutdown();
                                
                                Log.e(TAG, "🔍 MONITOR [" + ((i+1)*10) + "s]: Future cancelled=" + cancelled + 
                                          ", done=" + done + ", executor shutdown=" + executorShutdown);
                                sendLogToJavaScript("🔍 ScheduledExecutorService monitor " + ((i+1)*10) + "s: " + 
                                                  (cancelled ? "CANCELLED" : done ? "DONE" : executorShutdown ? "SHUTDOWN" : "HEALTHY"));
                                
                                if (cancelled || done || executorShutdown) {
                                    Log.e(TAG, "🚨 CRITICAL: ScheduledExecutorService COMPROMIS la " + ((i+1)*10) + "s!");
                                    sendLogToJavaScript("🚨 ScheduledExecutorService COMPROMIS la " + ((i+1)*10) + "s!");
                                    break;
                                }
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "❌ Monitor thread error: " + e.getMessage());
                        }
                    }
                }
            }).start();
            
            // MINIMĂ LOGGING: Doar status de pornire, fără execuții extra
            Log.e(TAG, "✅ GPS ScheduledExecutorService configurat pentru transmisie la fiecare " + GPS_INTERVAL_SECONDS + " secunde");
            
            isGPSRunning = true;
            
            Log.e(TAG, "✅ GPS Service STARTED successfully cu ScheduledExecutorService");
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
        }
        
        // Clean stop HTTP Thread Pool când nu mai sunt transmisii
        if (httpThreadPool != null && !httpThreadPool.isShutdown()) {
            Log.e(TAG, "🛑 Stopping HTTP Thread Pool...");
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
        
        // Release WakeLock
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            Log.e(TAG, "🛑 WakeLock released");
        }
        
        sendLogToJavaScript("🛑 GPS Service STOPPED complet");
        Log.e(TAG, "🛑 GPS Service completely stopped and ready for clean restart");
    }
    
    private void performGPSCycle() {
        Log.e(TAG, "🔥 GPS CYCLE START");
        Log.e(TAG, "🔥 Active courses count: " + activeCourses.size());
        
        // Log fiecare cursă activă pentru debugging
        for (java.util.Map.Entry<String, CourseData> entry : activeCourses.entrySet()) {
            CourseData course = entry.getValue();
            Log.e(TAG, "🔥 Course: " + entry.getKey() + " | Status: " + course.status + " | Vehicle: " + course.vehicleNumber);
        }
        
        sendLogToJavaScript("GPS ciclu activ - " + activeCourses.size() + " curse");
        
        if (activeCourses.isEmpty()) {
            Log.e(TAG, "🔥 SKIP GPS CYCLE - No active courses, but task will continue running");
            return;
        }
        
        if (globalToken == null) {
            Log.e(TAG, "🔥 SKIP GPS CYCLE - No token, but task will continue running");
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
            Log.e(TAG, "🔥 SKIP GPS CYCLE - No courses with status 2 (ACTIVE), but task will continue running");
            return; // Nu există curse active
        }
        
        Log.e(TAG, "GPS transmitere pentru " + activeCourseCount + " curse active");
        sendLogToJavaScript("GPS transmitere - " + activeCourseCount + " curse active");
        
        // Verifică permisiuni
        boolean fineLocationPermission = ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean coarseLocationPermission = ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        
        if (!fineLocationPermission && !coarseLocationPermission) {
            Log.e(TAG, "🔥 SKIP GPS CYCLE - No location permissions, but task will continue running");
            return;
        }
        
        try {
            // Solicitare poziție GPS în timp real
            LocationListener listener = new LocationListener() {
                @Override
                public void onLocationChanged(Location location) {
                    try {
                        long locationAge = System.currentTimeMillis() - location.getTime();
                        
                        // FILTRARE PENTRU PRECIZIE MAXIMĂ
                        float accuracy = location.getAccuracy();
                        String provider = location.getProvider();
                        
                        // RELAXAT: Criteriu de precizie mai permisiv pentru transmisii mai frecvente
                        boolean isHighPrecision = accuracy <= 25; // GPS sub 25m = acceptabil (relaxat pentru funcționare normală)
                        
                        Log.e(TAG, "🎯 GPS primit: " + location.getLatitude() + ", " + location.getLongitude() + 
                              " (precizie: " + (int)accuracy + "m, provider: " + provider + 
                              ", high-precision: " + isHighPrecision + ")");
                              
                        if (isHighPrecision) {
                            sendLogToJavaScript("✅ GPS ACCEPTED: " + (int)accuracy + "m (" + provider + ") - transmit coordonate");
                        } else {
                            sendLogToJavaScript("⚠️ GPS LOW-PRECISION: " + (int)accuracy + "m (" + provider + ") - prea imprecis (>25m), aștept mai bună");
                            // NU oprește ascultarea - continuă să aștepte precizie mai bună
                            return;
                        }
                        
                        // Verifică dacă coordonatele sunt proaspete
                        if (locationAge > 120000) {
                            sendLogToJavaScript("Atenție: GPS vechi (" + (locationAge/1000) + "s)");
                        }
                        
                        locationManager.removeUpdates(this);
                        
                        // CRITICAL FIX: Transmisia GPS pe thread separat pentru a nu bloca ScheduledExecutorService  
                        final Location finalLocation = location;
                        new Thread(new Runnable() {
                            @Override
                            public void run() {
                                transmitGPSDataToAllActiveCourses(finalLocation);
                            }
                        }).start();
                    } catch (Exception e) {
                        Log.e(TAG, "Eroare procesare GPS: " + e.getMessage());
                    }
                }
                
                @Override
                public void onProviderEnabled(String provider) {
                    Log.e(TAG, "GPS activat: " + provider);
                }
                
                @Override
                public void onProviderDisabled(String provider) {
                    Log.w(TAG, "GPS dezactivat: " + provider);
                }
                
                @Override
                public void onStatusChanged(String provider, int status, android.os.Bundle extras) {
                    // Log minimal pentru status changes
                }
            };
            
            // DOAR GPS NATIV pentru precizie maximă - nu mai folosim Network fallback
            boolean gpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);
            
            if (!gpsEnabled) {
                Log.e(TAG, "🔥 SKIP GPS CYCLE - GPS provider disabled, but task will continue running");
                Log.e(TAG, "GPS NATIV DEZACTIVAT - activează GPS pentru precizie maximă!");
                sendLogToJavaScript("❌ GPS dezactivat - activează GPS în setări pentru tracking de înaltă precizie");
                return;
            }
            
            String provider = LocationManager.GPS_PROVIDER; // DOAR GPS NATIV
            
            Log.e(TAG, "GPS NATIV ACTIV pentru precizie maximă");
            sendLogToJavaScript("GPS NATIV activ - precizie 3-8 metri");
                
                // GPS NATIV EXCLUSIV - precizie maximă cu parametri optimizați
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER, 
                    1000,  // 1 secundă interval minim pentru refresh rapid
                    0,     // 0 metri distanță minimă - orice mișcare
                    listener
                );
                
                // BACKUP: Solicită și poziția cunoscută cea mai recentă pentru feedback instant
                Location lastKnown = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                if (lastKnown != null) {
                    long locationAge = System.currentTimeMillis() - lastKnown.getTime();
                    if (locationAge < 30000) { // Sub 30 secunde = fresh
                        Log.e(TAG, "🎯 GPS CACHED de înaltă precizie disponibil (vârstă: " + (locationAge/1000) + "s)");
                        sendLogToJavaScript("GPS cached high-precision: " + lastKnown.getAccuracy() + "m");
                    }
                }
                
                // CRITICAL FIX: Timeout DIRECT pe thread separat - nu bloca ScheduledExecutorService
                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            Thread.sleep(5000); // Doar 5 secunde pentru a nu bloca
                            Log.e(TAG, "GPS timeout după 5s - cleanup forțat");
                            locationManager.removeUpdates(listener);
                        } catch (Exception e) {
                            Log.e(TAG, "Eroare timeout: " + e.getMessage());
                        }
                    }
                }).start();

            
        } catch (Exception e) {
            Log.e(TAG, "❌ GPS cycle error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void transmitGPSDataToAllActiveCourses(Location location) {
        try {
            Log.e(TAG, "Pregătesc transmisia GPS pentru " + activeCourses.size() + " curse");
            
            // ROMANIA TIMEZONE: UTC+3 pentru România - conform preferințelor utilizatorului
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            sdf.setTimeZone(java.util.TimeZone.getTimeZone("Europe/Bucharest"));
            String timestamp = sdf.format(new java.util.Date());
            
            // Senzori
            int networkSignal = getNetworkSignal();
            String batteryLevel = getBatteryLevel();
            
            int coursesTransmitting = 0;
            
            for (java.util.Map.Entry<String, CourseData> entry : activeCourses.entrySet()) {
                String uniqueKey = entry.getKey();
                CourseData courseData = entry.getValue();
                
                Log.e(TAG, "🔥 Processing course: " + uniqueKey + " with status: " + courseData.status);
                
                // REVERT TO ORIGINAL: Doar cursele ACTIVE (status 2) transmit GPS la server
                if (courseData.status != 2) {
                    Log.e(TAG, "🔥 SKIP course " + uniqueKey + " - status " + courseData.status + " (not active)");
                    continue; // Skip pentru curse în pauză/oprire - DOAR status 2 transmite la server
                }
                // DOAR Status 2 (ACTIVE) transmite GPS la server pentru vizualizare pe hartă
                
                Log.e(TAG, "🔥 WILL TRANSMIT GPS for course: " + uniqueKey + " (status 2 - ACTIVE)");
                
                coursesTransmitting++;
                
                // Pregătește datele GPS pentru această cursă - DOAR coordonate validate
                org.json.JSONObject gpsData = new org.json.JSONObject();
                gpsData.put("uit", courseData.realUit); // UIT real pentru server
                gpsData.put("numar_inmatriculare", courseData.vehicleNumber); // Numărul vehiculului
                gpsData.put("lat", location.getLatitude()); // DOAR coordonate GPS validate
                gpsData.put("lng", location.getLongitude()); // DOAR coordonate GPS validate
                gpsData.put("viteza", (int) (location.getSpeed() * 3.6));
                gpsData.put("directie", (int) location.getBearing());
                gpsData.put("altitudine", (int) location.getAltitude());
                gpsData.put("hdop", (int) location.getAccuracy()); // GPS accuracy in meters (using hdop field name for server compatibility)
                gpsData.put("gsm_signal", networkSignal);
                gpsData.put("baterie", batteryLevel);
                gpsData.put("status", courseData.status);
                gpsData.put("timestamp", timestamp);
                
                // CRITICAL: Transmite folosind unique key pentru identificare locală, dar UIT real pentru server
                transmitSingleCourseGPS(gpsData, uniqueKey, courseData.realUit);
            }
            
            if (coursesTransmitting > 0) {
                Log.e(TAG, "GPS transmis pentru " + coursesTransmitting + " curse din " + activeCourses.size() + " total");
                sendLogToJavaScript("GPS transmis - " + coursesTransmitting + " curse");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Eroare transmisie GPS: " + e.getMessage());
        }
    }
    
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
                            Log.e(TAG, "GPS trimis cu succes pentru " + realUit);
                        } else {
                            Log.w(TAG, "GPS eșuat pentru " + realUit + " - cod: " + responseCode);
                        }
                        
                    } catch (Exception e) {
                        Log.e(TAG, "Eroare transmisie GPS pentru " + realUit + ": " + e.getMessage());
                    }
                }
            });
            
        } catch (Exception e) {
            Log.e(TAG, "Eroare pregătire transmisie GPS: " + e.getMessage());
        }
    }
    
    // DEPRECATED - păstrat pentru compatibilitate
    private void callJavaScriptBridge(String gpsDataJson) {
        try {
            Log.e(TAG, "🌐 === ÎNCEPE TRANSMISIA HTTP ===");
            Log.e(TAG, "🔗 URL: https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php");
            Log.e(TAG, "🔑 Lungime token: " + (globalToken != null ? globalToken.length() : "NULL"));
            
            // Efectuează cererea HTTP pe thread de fundal
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
                        conn.setConnectTimeout(15000);
                        conn.setReadTimeout(15000);
                        
                        // Trimite datele JSON
                        try (java.io.OutputStream os = conn.getOutputStream()) {
                            byte[] input = gpsDataJson.getBytes("utf-8");
                            os.write(input, 0, input.length);
                        }
                        
                        int responseCode = conn.getResponseCode();
                        Log.e(TAG, "📊 Response code: " + responseCode);
                        
                        // Citește răspunsul (pentru debugging)
                        java.io.InputStream responseStream = responseCode >= 200 && responseCode < 300 
                            ? conn.getInputStream() 
                            : conn.getErrorStream();
                            
                        if (responseStream != null) {
                            java.util.Scanner s = new java.util.Scanner(responseStream).useDelimiter("\\A");
                            String result = s.hasNext() ? s.next() : "";
                            Log.e(TAG, "📋 Server response: " + result);
                        }
                        
                        if (responseCode >= 200 && responseCode < 300) {
                            Log.e(TAG, "✅ GPS data sent successfully");
                            sendLogToJavaScript("✅ GPS trimis cu succes la server");
                        } else {
                            Log.e(TAG, "❌ HTTP Error: " + responseCode);
                            sendLogToJavaScript("❌ Eroare HTTP: " + responseCode);
                        }
                        
                    } catch (Exception e) {
                        Log.e(TAG, "❌ HTTP Exception: " + e.getMessage());
                        sendLogToJavaScript("❌ Eroare HTTP: " + e.getMessage());
                        e.printStackTrace();
                    }
                }
            }).start();
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Bridge Exception: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // Bridge pentru logurile către JavaScript - CRITICAL pentru debugging
    private void sendLogToJavaScript(String message) {
        try {
            // ROMANIA TIMEZONE pentru JavaScript logs - consistency
            java.text.SimpleDateFormat jsTimeFormat = new java.text.SimpleDateFormat("HH:mm:ss");
            jsTimeFormat.setTimeZone(java.util.TimeZone.getTimeZone("Europe/Bucharest"));
            String timestamp = jsTimeFormat.format(new java.util.Date());
            
            // Log în consolă pentru JavaScript capture
            Log.e("GPS_TO_JS", "[" + timestamp + "] " + message);
        } catch (Exception e) {
            Log.e(TAG, "Eroare log către JavaScript: " + e.getMessage());
        }
    }
    
    // Senzori device pentru transmisia GPS
    private int getNetworkSignal() {
        try {
            android.telephony.TelephonyManager telephonyManager = (android.telephony.TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
            // Simplified pentru compatibilitate
            return 85; // Placeholder - implementare simplificată
        } catch (Exception e) {
            return 0;
        }
    }
    
    private String getBatteryLevel() {
        try {
            android.content.IntentFilter ifilter = new android.content.IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = registerReceiver(null, ifilter);
            
            if (batteryStatus != null) {
                int level = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_LEVEL, -1);
                int scale = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_SCALE, -1);
                
                if (level != -1 && scale != -1) {
                    float batteryPct = level / (float) scale * 100;
                    return String.valueOf((int) batteryPct);
                }
            }
            
            return "100"; // Fallback
        } catch (Exception e) {
            return "100"; // Fallback
        }
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "GPS Background Service",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Serviciu GPS pentru tracking vehicule");
            channel.setShowBadge(false);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
    
    private Notification createNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("iTrack GPS Activ")
            .setContentText("Tracking GPS în desfășurare")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build();
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null; // Started service, nu bound service
    }
    
    @Override
    public void onDestroy() {
        Log.e(TAG, "🛑 === BACKGROUND GPS SERVICE DESTROY CALLED ===");
        
        // THREAD SAFETY: boolean update
        isGPSRunning = false;
        
        // CRITICAL: LocationManager cleanup pentru a preveni memory leaks
        if (locationManager != null) {
            try {
                // Remove toate listener-urile GPS active pentru cleanup complet
                locationManager.removeUpdates(new LocationListener() {
                    @Override public void onLocationChanged(Location location) {}
                    @Override public void onProviderEnabled(String provider) {}
                    @Override public void onProviderDisabled(String provider) {}
                    @Override public void onStatusChanged(String provider, int status, android.os.Bundle extras) {}
                });
                Log.e(TAG, "🛑 Update-uri LocationManager curățate");
            } catch (SecurityException e) {
                Log.e(TAG, "🛑 Eroare curățare LocationManager: " + e.getMessage());
            }
        }
        
        // MEMORY LEAK PREVENTION: Complete executor cleanup
        if (gpsExecutor != null && !gpsExecutor.isShutdown()) {
            gpsExecutor.shutdownNow(); // Force immediate shutdown
            try {
                if (!gpsExecutor.awaitTermination(2, java.util.concurrent.TimeUnit.SECONDS)) {
                    Log.e(TAG, "🛑 GPS Executor force terminated");
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                Log.e(TAG, "🛑 GPS Executor interrupted shutdown");
            }
        }
        
        // HTTP Thread Pool cleanup
        if (httpThreadPool != null && !httpThreadPool.isShutdown()) {
            httpThreadPool.shutdownNow();
            Log.e(TAG, "🛑 HTTP Thread Pool terminated");
        }
        
        // WakeLock cleanup
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            Log.e(TAG, "🛑 WakeLock released");
        }
        
        // Background thread cleanup
        if (backgroundThread != null) {
            backgroundThread.quitSafely();
            try {
                backgroundThread.join(1000); // Wait max 1 second
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                Log.e(TAG, "🛑 Background thread join interrupted");
            }
        }
        
        // Clear toate cursele
        activeCourses.clear();
        globalToken = null;
        globalVehicle = null;
        
        Log.e(TAG, "🛑 === SERVICE DESTROY COMPLETE ===");
        super.onDestroy();
    }
}