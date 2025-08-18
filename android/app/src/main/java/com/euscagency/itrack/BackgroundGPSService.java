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
    
    // MULTI-UIT SUPPORT: Map pentru toate cursele active simultan
    private java.util.Map<String, CourseData> activeCourses = new java.util.HashMap<>();
    private String globalToken;
    private String globalVehicle;
    private boolean isGPSRunning = false;
    
    // Clasă pentru datele cursei
    private static class CourseData {
        String courseId; // ikRoTrans - identificator unic pentru HashMap
        int status; // 2=ACTIV, 3=PAUZA, 4=STOP
        String realUit; // UIT real pentru transmisia către server
        
        CourseData(String courseId, int status) {
            this.courseId = courseId;
            this.status = status;
            this.realUit = courseId; // Fallback pentru compatibilitate
        }
        
        CourseData(String courseId, int status, String realUit) {
            this.courseId = courseId;
            this.status = status;
            this.realUit = realUit != null ? realUit : courseId; // UIT real sau fallback
        }
    }
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.e(TAG, "🚀 Serviciul BackgroundGPS Creat");
        
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
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.e(TAG, "onStartCommand called with action: " + (intent != null ? intent.getAction() : "null"));
        
        if (intent != null && "START_BACKGROUND_GPS".equals(intent.getAction())) {
            String uitId = intent.getStringExtra("uit"); // ikRoTrans ca identificator HashMap
            String realUit = intent.getStringExtra("extra_uit"); // UIT real pentru server
            globalToken = intent.getStringExtra("token");
            globalVehicle = intent.getStringExtra("vehicle");
            int courseStatus = intent.getIntExtra("status", 2); // Default ACTIVE
            
            Log.e(TAG, "⚡ MULTI-UIT - Adăugare cursă:");
            Log.e(TAG, "   ikRoTrans (HashMap key): " + uitId);
            Log.e(TAG, "   UIT real (server): " + realUit);
            Log.e(TAG, "   Vehicle: " + globalVehicle);
            Log.e(TAG, "   Status: " + courseStatus);
            
            // Adaugă cursa la lista activă cu ikRoTrans ca key, dar păstrează UIT real
            activeCourses.put(uitId, new CourseData(uitId, courseStatus, realUit));
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
            
            CourseData courseData = activeCourses.get(specificUIT);
            if (courseData != null) {
                int oldStatus = courseData.status;
                Log.e(TAG, "🔄 Updating course status: " + oldStatus + " → " + newStatus + " pentru UIT: " + specificUIT);
                
                // TRIMITE STATUS UPDATE LA SERVER ÎNAINTE DE SCHIMBARE (pentru 3=PAUSE, 4=STOP)
                if (newStatus == 3 || newStatus == 4) {
                    Log.e(TAG, "🔄 Trimit status " + newStatus + " la server pentru UIT " + specificUIT);
                    sendStatusUpdateToServer(newStatus, specificUIT);
                }
                
                if (newStatus == 2) { // ACTIVE/RESUME
                    courseData.status = 2;
                    Log.e(TAG, "▶️ RESUME: UIT " + specificUIT + " reactivat");
                    if (!isGPSRunning) {
                        startBackgroundGPS();
                    }
                } else if (newStatus == 3) { // PAUSE
                    courseData.status = 3;
                    Log.e(TAG, "⏸️ PAUSE: UIT " + specificUIT + " paused, serviciul continuă pentru alte curse");
                    
                    // Verifică dacă mai există curse active după PAUSE
                    int activeCourseCount = 0;
                    for (CourseData course : activeCourses.values()) {
                        if (course.status == 2) {
                            activeCourseCount++;
                        }
                    }
                    
                    if (activeCourseCount == 0) {
                        Log.e(TAG, "⚠️ TOATE cursele sunt în PAUSE - ScheduledExecutorService continuă dar nu va transmite GPS");
                        sendLogToJavaScript("⚠️ Toate cursele sunt în PAUSE - GPS transmission oprită");
                    } else {
                        Log.e(TAG, "✅ " + activeCourseCount + " curse încă active - GPS transmission continuă");
                    }
                } else if (newStatus == 4) { // STOP
                    activeCourses.remove(specificUIT);
                    Log.e(TAG, "🛑 STOP: UIT " + specificUIT + " eliminat din tracking");
                    Log.e(TAG, "📋 Curse active rămase: " + activeCourses.size());
                    
                    // Dacă nu mai sunt curse active, oprește GPS complet
                    if (activeCourses.isEmpty()) {
                        Log.e(TAG, "🛑 Nu mai sunt curse active - opresc GPS complet");
                        stopBackgroundGPS();
                    }
                }
            } else {
                Log.e(TAG, "⚠️ UIT " + specificUIT + " nu găsit în liste active");
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
                        Log.e(TAG, "✅ GPS cycle completed successfully");
                        sendLogToJavaScript("✅ GPS cycle completed");
                        
                        // CRITICAL: Reînnoiește WakeLock la fiecare 30 de minute pentru prevenirea kill
                        if (wakeLock != null && wakeLock.isHeld()) {
                            wakeLock.release();
                            wakeLock.acquire(60 * 60 * 1000); // Re-acquire pentru încă 1 oră
                            Log.e(TAG, "🔄 WakeLock renewed pentru continuare garantată");
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "❌ EROARE în GPS cycle: " + e.getMessage());
                        sendLogToJavaScript("❌ EROARE GPS cycle: " + e.getMessage());
                        e.printStackTrace();
                    }
                    
                    Log.e(TAG, "⏰ === SCHEDULED TASK EXECUTION END ===");
                }
            };
            
            Log.e(TAG, "🔧 About to call scheduleAtFixedRate...");
            Log.e(TAG, "🔧 GPS_INTERVAL_SECONDS = " + GPS_INTERVAL_SECONDS);
            Log.e(TAG, "🔧 gpsExecutor null check: " + (gpsExecutor != null));
            Log.e(TAG, "🔧 gpsExecutor shutdown check: " + (gpsExecutor != null ? gpsExecutor.isShutdown() : "NULL"));
            
            // IMMEDIATE TEST: Execute runnable once manually to verify it works
            Log.e(TAG, "🧪 TESTING: Manual execution of GPS runnable...");
            try {
                gpsRunnable.run();
                Log.e(TAG, "🧪 TESTING: Manual execution SUCCESS!");
            } catch (Exception testException) {
                Log.e(TAG, "🧪 TESTING: Manual execution FAILED: " + testException.getMessage());
                testException.printStackTrace();
            }
            
            java.util.concurrent.ScheduledFuture<?> future = gpsExecutor.scheduleAtFixedRate(
                gpsRunnable, 
                0, // PRIMA EXECUȚIE IMEDIAT  
                GPS_INTERVAL_SECONDS, 
                TimeUnit.SECONDS
            );
            
            Log.e(TAG, "🔧 ScheduledFuture created: " + (future != null));
            Log.e(TAG, "🔧 Is cancelled: " + (future != null ? future.isCancelled() : "N/A"));
            Log.e(TAG, "🔧 Is done: " + (future != null ? future.isDone() : "N/A"));
            
            // ENHANCED DEBUGGING: Schedule a verification task
            Log.e(TAG, "🔧 Scheduling verification task in 3 seconds...");
            gpsExecutor.schedule(new Runnable() {
                @Override 
                public void run() {
                    Log.e(TAG, "🔍 VERIFICATION: ScheduledExecutorService is working!");
                    Log.e(TAG, "🔍 VERIFICATION: Main future cancelled? " + (future != null ? future.isCancelled() : "NULL"));
                    Log.e(TAG, "🔍 VERIFICATION: Main future done? " + (future != null ? future.isDone() : "NULL"));
                    sendLogToJavaScript("🔍 VERIFICATION: Executor alive at 3s mark");
                }
            }, 3, TimeUnit.SECONDS);
            
            // Immediate test execution after 3 seconds
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Thread.sleep(5000); // Wait 5 seconds
                        Log.e(TAG, "🧪 === 5-SECOND STATUS CHECK ===");
                        Log.e(TAG, "🧪 isGPSRunning: " + isGPSRunning);
                        Log.e(TAG, "🧪 Executor shutdown: " + (gpsExecutor != null ? gpsExecutor.isShutdown() : "NULL"));
                        Log.e(TAG, "🧪 Executor terminated: " + (gpsExecutor != null ? gpsExecutor.isTerminated() : "NULL"));
                        Log.e(TAG, "🧪 Future cancelled: " + (future != null ? future.isCancelled() : "NULL"));
                        Log.e(TAG, "🧪 Future done: " + (future != null ? future.isDone() : "NULL"));
                        Log.e(TAG, "🧪 WakeLock held: " + (wakeLock != null ? wakeLock.isHeld() : "NULL"));
                        sendLogToJavaScript("🧪 5s Status Check - Running: " + isGPSRunning + ", WakeLock: " + (wakeLock != null ? wakeLock.isHeld() : "NULL"));
                        
                        // Also schedule check after first GPS cycle
                        Thread.sleep(8000); // Total 13s wait
                        Log.e(TAG, "🧪 === 13-SECOND STATUS CHECK ===");
                        Log.e(TAG, "🧪 Expected: First GPS cycle should be completed by now");
                        sendLogToJavaScript("🧪 13s check - First GPS cycle should be done");
                        
                    } catch (Exception e) {
                        Log.e(TAG, "🧪 Test thread error: " + e.getMessage());
                    }
                }
            }).start();
            
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
        
        // IMPORTANT: Clear executor reference pentru restart curat
        gpsExecutor = null;
        Log.e(TAG, "🛑 GPS Service completely stopped and ready for clean restart");
    }
    
    private void performGPSCycle() {
        String currentTime = new java.text.SimpleDateFormat("HH:mm:ss").format(new java.util.Date());
        Log.e(TAG, "🔄 === GPS CYCLE START [" + currentTime + "] ===");
        Log.e(TAG, "📊 Active Courses: " + activeCourses.size() + ", Token: " + (globalToken != null ? "OK (" + globalToken.length() + " chars)" : "NULL"));
        Log.e(TAG, "🔧 isGPSRunning: " + isGPSRunning + ", ScheduledExecutor: " + (gpsExecutor != null && !gpsExecutor.isShutdown()));
        Log.e(TAG, "🔧 Service is ALIVE and EXECUTING at " + currentTime);
        
        // Send Android log to JavaScript for debugging  
        sendLogToJavaScript("🔄 GPS CYCLE EXECUTING [" + currentTime + "] - Active Courses: " + activeCourses.size());
        
        if (activeCourses.isEmpty()) {
            Log.e(TAG, "❌ GPS cycle skipped - NO ACTIVE COURSES (size: " + activeCourses.size() + ")");
            sendLogToJavaScript("❌ GPS cycle skipped - no active courses");
            return;
        }
        
        if (globalToken == null) {
            Log.e(TAG, "❌ GPS cycle skipped - NO TOKEN available");
            sendLogToJavaScript("❌ GPS cycle skipped - missing token");
            return;
        }
        
        // VERIFICĂ dacă există cel puțin o cursă cu status 2 (ACTIVE) înainte de a continua
        int activeCourseCount = 0;
        for (CourseData course : activeCourses.values()) {
            if (course.status == 2) {
                activeCourseCount++;
            }
        }
        
        if (activeCourseCount == 0) {
            Log.e(TAG, "⚠️ GPS cycle SKIPPED - No ACTIVE courses (toate sunt PAUSE/STOP)");
            Log.e(TAG, "📊 Total courses: " + activeCourses.size() + ", Active courses: " + activeCourseCount);
            sendLogToJavaScript("⚠️ GPS cycle SKIPPED - toate cursele sunt în PAUSE");
            return;
        }
        
        Log.e(TAG, "✅ GPS cycle PROCEEDING - " + activeCourseCount + " active courses din " + activeCourses.size() + " total");
        sendLogToJavaScript("✅ GPS cycle PROCEEDING - " + activeCourseCount + " curse ACTIVE");
        
        // Direct GPS reading - no dummy data
        Log.e(TAG, "🔄 Reading REAL GPS sensors now...");
        sendLogToJavaScript("🔄 Reading REAL GPS sensors...");
        
        // Check permissions
        boolean fineLocationPermission = ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean coarseLocationPermission = ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        
        Log.e(TAG, "📍 Permissions - Fine: " + fineLocationPermission + ", Coarse: " + coarseLocationPermission);
        
        if (!fineLocationPermission && !coarseLocationPermission) {
            Log.e(TAG, "❌ No GPS permission - stopping cycle");
            return;
        }
        
        try {
            // SYNC GPS SOLUTION: Get last known location IMMEDIATELY like dummy test worked
            Log.e(TAG, "🔍 Getting IMMEDIATE GPS location (like dummy test)...");
            
            Location lastKnownLocation = getLastKnownLocation();
            if (lastKnownLocation != null) {
                Log.e(TAG, "✅ === IMMEDIATE GPS LOCATION ===");
                Log.e(TAG, "📍 Coordinates: " + lastKnownLocation.getLatitude() + ", " + lastKnownLocation.getLongitude());
                Log.e(TAG, "📐 Accuracy: " + lastKnownLocation.getAccuracy() + "m");
                Log.e(TAG, "🕐 Age: " + (System.currentTimeMillis() - lastKnownLocation.getTime()) + "ms");
                
                sendLogToJavaScript("✅ IMMEDIATE GPS: " + lastKnownLocation.getLatitude() + ", " + lastKnownLocation.getLongitude());
                
                // IMMEDIATE TRANSMISSION like dummy test
                transmitGPSDataToAllActiveCourses(lastKnownLocation);
                
                Log.e(TAG, "✅ === GPS CYCLE COMPLETED SUCCESSFULLY ===");
                sendLogToJavaScript("✅ GPS cycle transmission completed");
                return;
            }
            
            // FALLBACK: Async GPS only if no last known location
            Log.e(TAG, "⚠️ No last known location - trying async GPS...");
            LocationListener listener = new LocationListener() {
                @Override
                public void onLocationChanged(Location location) {
                    try {
                        Log.e(TAG, "✅ === ASYNC GPS LOCATION RECEIVED ===");
                        Log.e(TAG, "📍 Coordinates: " + location.getLatitude() + ", " + location.getLongitude());
                        
                        sendLogToJavaScript("✅ ASYNC GPS: " + location.getLatitude() + ", " + location.getLongitude());
                        
                        locationManager.removeUpdates(this);
                        transmitGPSDataToAllActiveCourses(location);
                    } catch (Exception e) {
                        Log.e(TAG, "❌ Location processing error: " + e.getMessage());
                        e.printStackTrace();
                    }
                }
                
                @Override
                public void onProviderEnabled(String provider) {
                    Log.e(TAG, "🟢 Provider enabled: " + provider);
                }
                
                @Override
                public void onProviderDisabled(String provider) {
                    Log.e(TAG, "🔴 Provider disabled: " + provider);
                }
                
                @Override
                public void onStatusChanged(String provider, int status, android.os.Bundle extras) {
                    Log.e(TAG, "🔄 Provider status change: " + provider + " status: " + status);
                }
            };
            
            // Check GPS provider status
            boolean gpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);
            boolean networkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
            
            Log.e(TAG, "🛰️ GPS Enabled: " + gpsEnabled + ", Network Enabled: " + networkEnabled);
            
            // Try GPS first, then network as fallback
            String provider = gpsEnabled ? LocationManager.GPS_PROVIDER : 
                            (networkEnabled ? LocationManager.NETWORK_PROVIDER : null);
            
            if (provider != null) {
                Log.e(TAG, "📡 Using provider: " + provider);
                sendLogToJavaScript("📡 Using GPS provider: " + provider);
                locationManager.requestLocationUpdates(provider, 0, 0, listener);
                Log.e(TAG, "🛰️ GPS request sent to " + provider);
                sendLogToJavaScript("🛰️ GPS request sent to " + provider);
                
                // Get last known location as immediate fallback
                try {
                    Location lastKnown = locationManager.getLastKnownLocation(provider);
                    if (lastKnown != null) {
                        Log.e(TAG, "📍 Last known location available: " + lastKnown.getLatitude() + ", " + lastKnown.getLongitude());
                        // Dar totuși așteaptă locația proaspătă
                    } else {
                        Log.e(TAG, "📍 No last known location");
                    }
                } catch (Exception e) {
                    Log.e(TAG, "❌ Last known location error: " + e.getMessage());
                }
                
                // Simple timeout without handler complications
                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            Thread.sleep(8000);
                            locationManager.removeUpdates(listener);
                            Log.e(TAG, "⏰ GPS timeout after 8 seconds");
                        } catch (Exception e) {
                            Log.e(TAG, "❌ Timeout error: " + e.getMessage());
                        }
                    }
                }).start();
            } else {
                Log.e(TAG, "❌ No location providers available - GPS and Network both disabled");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ GPS cycle error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void transmitGPSDataToAllActiveCourses(Location location) {
        try {
            Log.e(TAG, "📤 === PREPARING GPS TRANSMISSION FOR ALL ACTIVE COURSES ===");
            Log.e(TAG, "📊 Total active courses: " + activeCourses.size());
            
            // Romania timestamp - calculat o singură dată pentru toate cursele
            java.util.TimeZone romaniaTimeZone = java.util.TimeZone.getTimeZone("Europe/Bucharest");
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            sdf.setTimeZone(romaniaTimeZone);
            String timestamp = sdf.format(new java.util.Date());
            
            // Senzori reali - calculați o singură dată pentru toate cursele
            int networkSignal = getNetworkSignal();
            String batteryLevel = getBatteryLevel();
            
            // Transmite GPS DOAR pentru cursele ACTIVE (status 2)
            for (java.util.Map.Entry<String, CourseData> entry : activeCourses.entrySet()) {
                String uitId = entry.getKey();
                CourseData courseData = entry.getValue();
                
                Log.e(TAG, "🔍 Verificare UIT " + uitId + " - Status: " + courseData.status);
                
                // CRITICĂ: Doar cursele ACTIVE (status 2) pot transmite GPS data
                if (courseData.status != 2) {
                    if (courseData.status == 3) {
                        Log.e(TAG, "⏸️ GPS transmission BLOCKED pentru UIT " + uitId + " - PAUSED (status 3)");
                        sendLogToJavaScript("⏸️ BLOCKED GPS pentru UIT " + uitId + " - PAUSED");
                    } else if (courseData.status == 4) {
                        Log.e(TAG, "🛑 GPS transmission BLOCKED pentru UIT " + uitId + " - STOPPED (status 4)");
                        sendLogToJavaScript("🛑 BLOCKED GPS pentru UIT " + uitId + " - STOPPED");
                    } else {
                        Log.e(TAG, "⚠️ GPS transmission BLOCKED pentru UIT " + uitId + " - Status unknown: " + courseData.status);
                        sendLogToJavaScript("⚠️ BLOCKED GPS pentru UIT " + uitId + " - Status necunoscut: " + courseData.status);
                    }
                    continue;
                }
                
                Log.e(TAG, "✅ GPS transmission PROCEEDING pentru UIT " + uitId + " - ACTIVE (status " + courseData.status + ")");
                sendLogToJavaScript("✅ Transmit GPS pentru UIT " + uitId + " - ACTIVE");
                
                // Create GPS data JSON pentru această cursă
                org.json.JSONObject gpsData = new org.json.JSONObject();
                gpsData.put("uit", courseData.realUit); // UIT REAL pentru server, NU ikRoTrans
                gpsData.put("numar_inmatriculare", globalVehicle);
                gpsData.put("lat", location.getLatitude());
                gpsData.put("lng", location.getLongitude());
                gpsData.put("viteza", (int) (location.getSpeed() * 3.6)); // m/s to km/h
                gpsData.put("directie", (int) location.getBearing());
                gpsData.put("altitudine", (int) location.getAltitude());
                gpsData.put("hdop", (int) location.getAccuracy());
                gpsData.put("gsm_signal", networkSignal);
                gpsData.put("baterie", batteryLevel);
                gpsData.put("status", courseData.status); // Status real al cursei (doar status 2 ajunge aici)
                gpsData.put("timestamp", timestamp);
                
                Log.e(TAG, "📊 GPS Data pentru ikRoTrans " + uitId + " (server UIT: " + courseData.realUit + "):");
                Log.e(TAG, "   Vehicle: " + globalVehicle);
                Log.e(TAG, "   Coordinates: " + location.getLatitude() + ", " + location.getLongitude());
                Log.e(TAG, "   Battery: " + batteryLevel);
                Log.e(TAG, "   Timestamp: " + timestamp);
                
                // Call direct HTTP transmission pentru această cursă
                transmitSingleCourseGPS(gpsData, uitId, courseData.realUit);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Multi-course GPS transmission preparation error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void transmitSingleCourseGPS(org.json.JSONObject gpsData, String ikRoTransId, String realUit) {
        try {
            String gpsDataJson = gpsData.toString();
            Log.e(TAG, "🌐 === STARTING HTTP TRANSMISSION PENTRU ikRoTrans " + ikRoTransId + " (server UIT: " + realUit + ") ===");
            Log.e(TAG, "🔗 URL: https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php");
            Log.e(TAG, "🔑 Token length: " + (globalToken != null ? globalToken.length() : "NULL"));
            
            // Make HTTP request on background thread
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Log.e(TAG, "📡 HTTP thread started pentru ikRoTrans " + ikRoTransId + " (server UIT: " + realUit + ")");
                        
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
                        
                        Log.e(TAG, "🔗 Connection configured pentru UIT " + realUit + " (ikRoTrans: " + ikRoTransId + "), sending data...");
                        
                        // Send JSON data
                        try (java.io.OutputStream os = conn.getOutputStream()) {
                            byte[] input = gpsDataJson.getBytes("utf-8");
                            os.write(input, 0, input.length);
                            Log.e(TAG, "📤 Data sent pentru UIT " + realUit + " (ikRoTrans: " + ikRoTransId + "): " + input.length + " bytes");
                        }
                        
                        int responseCode = conn.getResponseCode();
                        String responseMessage = conn.getResponseMessage();
                        
                        Log.e(TAG, "📡 === HTTP RESPONSE PENTRU UIT " + realUit + " (ikRoTrans: " + ikRoTransId + ") ===");
                        Log.e(TAG, "📊 Response Code: " + responseCode);
                        Log.e(TAG, "📝 Response Message: " + responseMessage);
                        
                        // Read response body for debugging
                        try {
                            java.io.InputStream is = (responseCode >= 200 && responseCode < 300) ? 
                                conn.getInputStream() : conn.getErrorStream();
                            if (is != null) {
                                java.util.Scanner scanner = new java.util.Scanner(is).useDelimiter("\\A");
                                String responseBody = scanner.hasNext() ? scanner.next() : "";
                                Log.e(TAG, "📄 Response Body pentru UIT " + realUit + " (ikRoTrans: " + ikRoTransId + "): " + responseBody);
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "⚠️ Could not read response body pentru UIT " + realUit + " (ikRoTrans: " + ikRoTransId + "): " + e.getMessage());
                        }
                        
                        if (responseCode >= 200 && responseCode < 300) {
                            Log.e(TAG, "✅ === GPS TRANSMISSION SUCCESS PENTRU UIT " + realUit + " (ikRoTrans: " + ikRoTransId + ") ===");
                        } else {
                            Log.e(TAG, "❌ === GPS TRANSMISSION FAILED PENTRU UIT " + realUit + " (ikRoTrans: " + ikRoTransId + ") ===");
                        }
                        
                    } catch (Exception e) {
                        Log.e(TAG, "❌ Native HTTP GPS error pentru UIT " + realUit + " (ikRoTrans: " + ikRoTransId + "): " + e.getMessage());
                        Log.e(TAG, "💾 Salvez coordonata offline pentru UIT " + realUit + " (ikRoTrans: " + ikRoTransId + ")");
                        
                        // Salvează coordonata offline când transmisia eșuează
                        try {
                            sendOfflineGPSToJavaScript(gpsDataJson);
                        } catch (Exception offlineError) {
                            Log.e(TAG, "❌ Eroare salvare offline pentru UIT " + realUit + " (ikRoTrans: " + ikRoTransId + "): " + offlineError.getMessage());
                        }
                        
                        e.printStackTrace();
                    }
                }
            }).start();
            
        } catch (Exception e) {
            Log.e(TAG, "❌ GPS transmission error pentru UIT " + realUit + " (ikRoTrans: " + ikRoTransId + "): " + e.getMessage());
            e.printStackTrace();
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
                        Log.e(TAG, "❌ Native HTTP GPS error: " + e.getMessage());
                        Log.e(TAG, "💾 Salvez coordonata offline pentru sincronizare ulterioară");
                        
                        // Salvează coordonata offline când transmisia eșuează
                        try {
                            sendOfflineGPSToJavaScript(gpsDataJson);
                        } catch (Exception offlineError) {
                            Log.e(TAG, "❌ Eroare salvare offline: " + offlineError.getMessage());
                        }
                        
                        e.printStackTrace();
                    }
                }
            }).start();
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Bridge call failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void sendStatusUpdateToServer(int newStatus, String specificUIT) {
        try {
            Log.e(TAG, "📤 === PREPARING STATUS UPDATE FROM ANDROID SERVICE ===");
            
            // CRITICAL FIX: specificUIT este ikRoTrans, trebuie să găsesc realUit din activeCourses
            CourseData courseData = activeCourses.get(specificUIT);
            if (courseData == null) {
                Log.e(TAG, "❌ Nu găsesc courseData pentru ikRoTrans: " + specificUIT);
                return;
            }
            
            String realUit = courseData.realUit;
            Log.e(TAG, "🔧 CRITICAL FIX: specificUIT=" + specificUIT + " (ikRoTrans) → realUit=" + realUit + " (pentru server)");
            
            // Create status update JSON cu exact aceeași structură ca GPS
            org.json.JSONObject statusData = new org.json.JSONObject();
            statusData.put("uit", realUit); // FIXED: Trimite realUit la server, NU ikRoTrans
            statusData.put("numar_inmatriculare", globalVehicle);
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
            Log.e(TAG, "   ikRoTrans: " + specificUIT + " → realUIT: " + realUit); // FIXED: Log both values
            Log.e(TAG, "   Vehicle: " + globalVehicle);
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
            
            // Make HTTP request on background thread
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Log.e(TAG, "📡 Status HTTP thread started");
                        
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
            }).start();
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Status HTTP bridge call failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void sendOfflineGPSToJavaScript(String gpsDataJson) {
        try {
            Log.e(TAG, "💾 === SALVARE GPS OFFLINE ===");
            Log.e(TAG, "📤 GPS Data pentru salvare offline: " + gpsDataJson);
            
            // Call JavaScript bridge pentru salvare offline
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                String script = "if (window.saveOfflineGPS) { window.saveOfflineGPS(" + gpsDataJson + "); }";
                Log.e(TAG, "📱 Apelez JavaScript pentru salvare offline");
                
                // Această funcție va fi apelată din JavaScript side pentru a salva datele
                Log.e("OFFLINE_GPS_SAVE", gpsDataJson);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Eroare salvare GPS offline: " + e.getMessage());
            e.printStackTrace();
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
        
        // Stop background thread
        if (backgroundThread != null) {
            backgroundThread.quitSafely();
            backgroundThread = null;
            Log.e(TAG, "🛑 Background thread stopped");
        }
        
        super.onDestroy();
        Log.e(TAG, "🛑 BackgroundGPS Service completely destroyed and cleaned up");
    }
}