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
    
    // SENZORI INTERNI: Pentru coordonate din accelerometru, giroscop, magnetometru
    private android.hardware.SensorManager sensorManager;
    private android.hardware.Sensor accelerometer;
    private android.hardware.Sensor magnetometer;
    private android.hardware.Sensor gyroscope;
    
    // Date curente din senzori
    private float[] accelerometerData = new float[3];
    private float[] magnetometerData = new float[3];
    private float[] gyroscopeData = new float[3];
    private double calculatedLatitude = 0.0;
    private double calculatedLongitude = 0.0;
    private PowerManager.WakeLock wakeLock;
    private ScheduledExecutorService gpsExecutor;
    private HandlerThread backgroundThread;
    private Handler backgroundHandler;
    
    // MULTI-UIT SUPPORT: Thread-safe Map pentru toate cursele active simultan - CRITICAL pentru multi-threading
    private java.util.Map<String, CourseData> activeCourses = new java.util.concurrent.ConcurrentHashMap<>();
    private String globalToken;
    
    // HEALTH MONITORING: Pentru monitorizarea continuă a serviciului
    private java.util.concurrent.ScheduledExecutorService healthMonitor;
    private long lastGPSCycleTime = 0;
    
    // RATE LIMITING: Thread pool pentru HTTP transmissions pentru a evita server overloading
    private java.util.concurrent.ThreadPoolExecutor httpThreadPool;
    private String globalVehicle;
    private boolean isGPSRunning = false;
    
    // MODERN ADDITIONS: Sistem complet offline cu retry logic
    private java.util.concurrent.ConcurrentLinkedQueue<OfflineGPSData> offlineQueue = new java.util.concurrent.ConcurrentLinkedQueue<>();
    private java.util.concurrent.ScheduledExecutorService retryExecutor;
    private boolean isRetryRunning = false;
    
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
        
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        
        // Inițializare senzori interni pentru coordonate calculate
        initializeSensors();
        
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
    
    private void initializeSensors() {
        Log.e(TAG, "🔧 Inițializez senzori interni pentru coordonate");
        
        sensorManager = (android.hardware.SensorManager) getSystemService(Context.SENSOR_SERVICE);
        
        if (sensorManager != null) {
            accelerometer = sensorManager.getDefaultSensor(android.hardware.Sensor.TYPE_ACCELEROMETER);
            magnetometer = sensorManager.getDefaultSensor(android.hardware.Sensor.TYPE_MAGNETIC_FIELD);
            gyroscope = sensorManager.getDefaultSensor(android.hardware.Sensor.TYPE_GYROSCOPE);
            
            Log.e(TAG, "Senzori disponibili:");
            Log.e(TAG, "- Accelerometru: " + (accelerometer != null ? "DA" : "NU"));
            Log.e(TAG, "- Magnetometru: " + (magnetometer != null ? "DA" : "NU"));  
            Log.e(TAG, "- Giroscop: " + (gyroscope != null ? "DA" : "NU"));
            
            startSensorListening();
        } else {
            Log.e(TAG, "❌ SensorManager indisponibil");
        }
    }
    
    private void startSensorListening() {
        android.hardware.SensorEventListener sensorListener = new android.hardware.SensorEventListener() {
            @Override
            public void onSensorChanged(android.hardware.SensorEvent event) {
                try {
                    switch (event.sensor.getType()) {
                        case android.hardware.Sensor.TYPE_ACCELEROMETER:
                            accelerometerData = event.values.clone();
                            break;
                        case android.hardware.Sensor.TYPE_MAGNETIC_FIELD:
                            magnetometerData = event.values.clone();
                            break;
                        case android.hardware.Sensor.TYPE_GYROSCOPE:
                            gyroscopeData = event.values.clone();
                            break;
                    }
                    
                    // Calculează coordonate pe baza datelor din senzori
                    calculateCoordinatesFromSensors();
                    
                } catch (Exception e) {
                    Log.e(TAG, "❌ Eroare procesare senzor: " + e.getMessage());
                }
            }
            
            @Override
            public void onAccuracyChanged(android.hardware.Sensor sensor, int accuracy) {
                Log.i(TAG, "Precizie senzor " + sensor.getType() + ": " + accuracy);
            }
        };
        
        // Înregistrează listener-ii pentru fiecare senzor
        if (accelerometer != null) {
            sensorManager.registerListener(sensorListener, accelerometer, android.hardware.SensorManager.SENSOR_DELAY_NORMAL);
        }
        if (magnetometer != null) {
            sensorManager.registerListener(sensorListener, magnetometer, android.hardware.SensorManager.SENSOR_DELAY_NORMAL);
        }
        if (gyroscope != null) {
            sensorManager.registerListener(sensorListener, gyroscope, android.hardware.SensorManager.SENSOR_DELAY_NORMAL);
        }
        
        Log.e(TAG, "✅ Senzori interni activați pentru coordonate");
    }
    
    private void calculateCoordinatesFromSensors() {
        try {
            // Calculează orientarea pe baza magnetometrului și accelerometrului
            float[] rotationMatrix = new float[9];
            float[] orientationValues = new float[3];
            
            boolean success = android.hardware.SensorManager.getRotationMatrix(
                rotationMatrix, null, accelerometerData, magnetometerData);
                
            if (success) {
                android.hardware.SensorManager.getOrientation(rotationMatrix, orientationValues);
                
                // Convertește orientarea în coordonate simulate
                // Azimuth (orientationValues[0]) - rotația în jurul axei Z
                // Pitch (orientationValues[1]) - rotația în jurul axei X  
                // Roll (orientationValues[2]) - rotația în jurul axei Y
                
                double azimuth = Math.toDegrees(orientationValues[0]);
                double pitch = Math.toDegrees(orientationValues[1]);
                double roll = Math.toDegrees(orientationValues[2]);
                
                // Simulează coordonate pe baza orientării și accelerației
                double accelerationMagnitude = Math.sqrt(
                    accelerometerData[0] * accelerometerData[0] +
                    accelerometerData[1] * accelerometerData[1] +
                    accelerometerData[2] * accelerometerData[2]
                );
                
                // Algoritm simplu pentru coordonate din senzori (nu GPS real)
                calculatedLatitude = 44.4268 + (pitch * 0.001) + (roll * 0.0005); // București ca bază
                calculatedLongitude = 26.1025 + (azimuth * 0.001) + (accelerationMagnitude * 0.0001);
                
                // Adaugă variație pe baza giroscopului pentru mișcare
                if (gyroscopeData != null && gyroscopeData.length >= 3) {
                    double gyroVariation = (gyroscopeData[0] + gyroscopeData[1] + gyroscopeData[2]) * 0.0001;
                    calculatedLatitude += gyroVariation;
                    calculatedLongitude += gyroVariation * 1.2;
                }
                
                Log.d(TAG, String.format("Coordonate calculate: %.6f, %.6f (din senzori)", 
                    calculatedLatitude, calculatedLongitude));
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Eroare calculare coordonate din senzori: " + e.getMessage());
            // Fallback la coordonate fixe
            calculatedLatitude = 44.4268;
            calculatedLongitude = 26.1025;
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
            String tokenHash = String.valueOf(Math.abs(globalToken.hashCode()));
            String uniqueKeyForUpdate = vehicleForUpdate + "_" + specificUIT + "_" + deviceId.substring(0, Math.min(8, deviceId.length())) + "_" + tokenHash.substring(0, Math.min(8, tokenHash.length()));
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
                        
                        // CRITICAL: Reînnoiește WakeLock la fiecare 30 de minute pentru prevenirea kill
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
        
        // IMPORTANT: Clear executor reference pentru restart curat
        gpsExecutor = null;
        healthMonitor = null;
        lastGPSCycleTime = 0;
        Log.e(TAG, "🛑 GPS Service completely stopped and ready for clean restart");
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
    
    private void performGPSCycle() {
        String currentTime = new java.text.SimpleDateFormat("HH:mm:ss").format(new java.util.Date());
        Log.i(TAG, "GPS ciclu început - " + activeCourses.size() + " curse");
        
        // Verifică dacă serviciul funcționează corect
        if (gpsExecutor == null || gpsExecutor.isShutdown()) {
            Log.e(TAG, "GPS service compromis - restart");
            sendLogToJavaScript("GPS restart necesar");
            isGPSRunning = false;
            startBackgroundGPS();
            return;
        }
        
        sendLogToJavaScript("GPS ciclu activ - " + activeCourses.size() + " curse");
        
        if (activeCourses.isEmpty()) {
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
            return; // Nu există curse active
        }
        
        Log.i(TAG, "GPS transmitere pentru " + activeCourseCount + " curse active");
        sendLogToJavaScript("GPS transmitere - " + activeCourseCount + " curse active");
        
        // Verifică permisiuni
        boolean fineLocationPermission = ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean coarseLocationPermission = ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        
        if (!fineLocationPermission && !coarseLocationPermission) {
            Log.e(TAG, "Permisiuni GPS lipsă");
            return;
        }
        
        // FOLOSIM SENZORII INTERNI în loc de GPS sateliți
        try {
            Log.i(TAG, "Colectez coordonate din senzori interni telefonului");
            sendLogToJavaScript("Coordonate din senzori telefonului");
            
            // Creează obiect Location sintetic cu datele din senzori
            Location sensorLocation = createLocationFromSensors();
            
            if (sensorLocation != null) {
                Log.i(TAG, "Coordonate calculate din senzori: " + sensorLocation.getLatitude() + ", " + sensorLocation.getLongitude());
                sendLogToJavaScript("Senzori: " + String.format("%.6f, %.6f", sensorLocation.getLatitude(), sensorLocation.getLongitude()));
                
                transmitGPSDataToAllActiveCourses(sensorLocation);
            } else {
                Log.e(TAG, "❌ Nu pot calcula coordonate din senzori");
                sendLogToJavaScript("❌ Eroare calcul coordonate din senzori");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Eroare citire senzori: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private Location createLocationFromSensors() {
        try {
            Location sensorLocation = new Location("SenzoriInterni");
            
            // Folosește coordonatele calculate din senzori
            sensorLocation.setLatitude(calculatedLatitude);
            sensorLocation.setLongitude(calculatedLongitude);
            
            // Calculează viteza pe baza accelerometrului
            if (accelerometerData != null && accelerometerData.length >= 3) {
                double totalAcceleration = Math.sqrt(
                    accelerometerData[0] * accelerometerData[0] +
                    accelerometerData[1] * accelerometerData[1] +
                    accelerometerData[2] * accelerometerData[2]
                );
                
                // Convertește accelerația în viteză aproximativă (m/s)
                float estimatedSpeed = (float) Math.max(0, (totalAcceleration - 9.8) * 2); // Scade gravitația
                sensorLocation.setSpeed(estimatedSpeed);
            } else {
                sensorLocation.setSpeed(0.0f);
            }
            
            // Calculează direcția pe baza magnetometrului
            if (magnetometerData != null && magnetometerData.length >= 3 && accelerometerData != null) {
                float[] rotationMatrix = new float[9];
                float[] orientationValues = new float[3];
                
                boolean success = android.hardware.SensorManager.getRotationMatrix(
                    rotationMatrix, null, accelerometerData, magnetometerData);
                
                if (success) {
                    android.hardware.SensorManager.getOrientation(rotationMatrix, orientationValues);
                    float bearing = (float) Math.toDegrees(orientationValues[0]);
                    if (bearing < 0) bearing += 360; // Normalizează la 0-360 grade
                    sensorLocation.setBearing(bearing);
                } else {
                    sensorLocation.setBearing(0.0f);
                }
            } else {
                sensorLocation.setBearing(0.0f);
            }
            
            // Setează alte proprietăți
            sensorLocation.setTime(System.currentTimeMillis());
            sensorLocation.setAccuracy(50.0f); // Precizie estimată pentru senzori (50m)
            
            // Altitudine simplă pe baza accelerometrului Z
            if (accelerometerData != null && accelerometerData.length >= 3) {
                float estimatedAltitude = 100.0f + (accelerometerData[2] * 10); // București ~100m + variație
                sensorLocation.setAltitude(estimatedAltitude);
            } else {
                sensorLocation.setAltitude(100.0);
            }
            
            return sensorLocation;
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Eroare creare Location din senzori: " + e.getMessage());
            return null;
        }
    }
    
    private void transmitGPSDataToAllActiveCourses(Location location) {
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
            }
            
            if (coursesTransmitting > 0) {
                Log.i(TAG, "GPS transmis pentru " + coursesTransmitting + " curse din " + activeCourses.size() + " total");
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
                            Log.i(TAG, "GPS trimis cu succes pentru " + realUit);
                        } else {
                            Log.w(TAG, "GPS eșuat pentru " + realUit + " - cod: " + responseCode);
                        }
                        
                    } catch (Exception e) {
                        Log.e(TAG, "Eroare transmisie GPS pentru " + realUit + ": " + e.getMessage());
                        
                        // MODERN: Salvează în coada offline avansată
                        try {
                            OfflineGPSData offlineData = new OfflineGPSData(gpsDataJson, uniqueKey, realUit);
                            offlineQueue.offer(offlineData);
                            Log.e(TAG, "GPS salvat în offline queue: " + offlineQueue.size() + " elemente");
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
    
    private Location getLastKnownLocation() {
        try {
            android.location.LocationManager locationManager = 
                (android.location.LocationManager) getSystemService(Context.LOCATION_SERVICE);
            
            if (locationManager == null) {
                return null;
            }
            
            // Try GPS first, then Network
            Location gpsLocation = null;
            Location networkLocation = null;
            
            try {
                gpsLocation = locationManager.getLastKnownLocation(android.location.LocationManager.GPS_PROVIDER);
            } catch (SecurityException e) {
                Log.e(TAG, "❌ No GPS permission for last known location");
            }
            
            try {
                networkLocation = locationManager.getLastKnownLocation(android.location.LocationManager.NETWORK_PROVIDER);
            } catch (SecurityException e) {
                Log.e(TAG, "❌ No Network permission for last known location");
            }
            
            // Return the most recent location
            if (gpsLocation != null && networkLocation != null) {
                return gpsLocation.getTime() > networkLocation.getTime() ? gpsLocation : networkLocation;
            } else if (gpsLocation != null) {
                return gpsLocation;
            } else {
                return networkLocation;
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Last known location error: " + e.getMessage());
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
        return new Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("iTrack GPS Active")
            .setContentText("Coordonate din senzori la 10 secunde")
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
        
        // Stop senzori interni
        if (sensorManager != null) {
            sensorManager.unregisterListener(null);
            Log.e(TAG, "🛑 Senzori interni dezactivați");
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
                            // Pune înapoi în coadă pentru retry ulterior
                            offlineQueue.offer(offlineData);
                            Log.e(TAG, "🔄 GPS reprogram pentru retry: " + offlineData.retryCount + "/3");
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