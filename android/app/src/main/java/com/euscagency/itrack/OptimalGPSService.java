package com.euscagency.itrack;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.SystemClock;
import android.telephony.TelephonyManager;
import android.util.Log;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * SERVICIUL GPS ANDROID OPTIM - Cel mai eficient serviciu GPS de fundal
 * Folosește AlarmManager pentru intervale exacte de 5 secunde + GPS la cerere
 * Minimizează consumul bateriei prin activarea GPS-ului doar când este necesar
 * OPTIMIZAT pentru toate telefoanele Android (A31, A56, S-uri, etc.)
 */
public class OptimalGPSService extends Service {
    private static final String TAG = "OptimalGPS";
    private static final long GPS_INTERVAL_MS = 5000; // Exact 5 seconds - ca în commit-ul funcțional 9c5b19b
    private static final String ACTION_GPS_ALARM = "com.euscagency.itrack.GPS_ALARM";
    
    // Configurație API Centralizată
    private static final String API_BASE_URL_DEV = "https://www.euscagency.com/etsm3/platforme/transport/apk/";
    private static final String API_BASE_URL_PROD = "https://www.euscagency.com/etsm_prod/platforme/transport/apk/";
    
    // Mediul activ curent - PROD cu simplitate din commit funcțional
    private static final String API_BASE_URL = API_BASE_URL_PROD; // PROD - simplificat
    
    private AlarmManager alarmManager;
    private PendingIntent gpsPendingIntent;
    private LocationManager locationManager;
    private Map<String, CourseData> activeCourses = new java.util.LinkedHashMap<>();
    private boolean isAlarmActive = false;
    
    // Timestamp partajat pentru toate cursele dintr-un ciclu GPS
    private static java.util.Date gpsSharedTimestamp = null;
    
    // WAKELOCK pentru operațiuni în fundal
    private PowerManager.WakeLock wakeLock;
    
    // TRANSMISIE HTTP OPTIMIZATĂ PENTRU FUNDAL
    private ExecutorService httpThreadPool; // Pool de thread-uri simplu pentru a evita blocarea serviciului principal
    
    // Eliminat WebView interface - revert la simplitatea commit-ului funcțional
    
    public static class CourseData {
        public String courseId;
        public String uit;
        public int status;
        public String vehicleNumber;
        public String authToken;
        public boolean pauseTransmitted = false; // Track if status 3 was already transmitted
        
        public CourseData(String courseId, String uit, int status, String vehicleNumber, String authToken) {
            this.courseId = courseId;
            this.uit = uit;
            this.status = status;
            this.vehicleNumber = vehicleNumber;
            this.authToken = authToken;
        }
    }
    
    private static final int NOTIFICATION_ID = 1;
    private static final String CHANNEL_ID = "OptimalGPSChannel";
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.e(TAG, "🔧 === CRITICAL === OptimalGPSService onCreate() - SERVICE STARTING!");
        Log.e(TAG, "🚀 === SERVICE ALIVE === OptimalGPSService is being created");
        
        alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        
        // CRITICAL VALIDATION: Verify essential services are available
        if (alarmManager == null) {
            Log.e(TAG, "❌ FATAL: AlarmManager is NULL - GPS timer cannot function!");
        } else {
            Log.e(TAG, "✅ CRITICAL: AlarmManager initialized successfully");
        }
        
        if (locationManager == null) {
            Log.e(TAG, "❌ FATAL: LocationManager is NULL - GPS cannot function!");
        } else {
            Log.e(TAG, "✅ CRITICAL: LocationManager initialized successfully");
        }
        
        // Initialize WakeLock for background operation
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "iTrack:OptimalGPS");
        
        // FOREGROUND OPTIMIZED: Simple thread pool to avoid blocking AlarmManager
        httpThreadPool = Executors.newFixedThreadPool(1); // Single background thread for HTTP
        
        // Eliminat MainActivity interface - simplificare ca în commit funcțional
        
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, createNotification());
        
        Log.e(TAG, "✅ === CRITICAL === OPTIMAL GPS Service created - AlarmManager + Optimized HTTP + Batching + WakeLock");
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Optimal GPS Tracking",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Most efficient GPS tracking service");
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }
    
    private Notification createNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("iTrack Optimal GPS")
            .setContentText("Efficient tracking: " + activeCourses.size() + " courses")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "🚨 === DIAGNOSTIC START === OPTIMAL GPS Service onStartCommand");
        Log.d(TAG, "📡 Action: " + (intent != null ? intent.getAction() : "NULL_INTENT"));
        Log.d(TAG, "⚡ Current activeCourses count: " + activeCourses.size());
        Log.d(TAG, "🔍 Service flags: " + flags + ", startId: " + startId);
        
        // IMMEDIATE: Start foreground service to prevent termination
        try {
            createNotificationChannel();
            startForeground(NOTIFICATION_ID, createNotification());
            android.util.Log.e(TAG, "✅ FOREGROUND SERVICE STARTED - GPS will run with phone locked");
            
            // CRITICAL: Keep service alive with WakeLock pentru telefon blocat
            if (wakeLock != null && !wakeLock.isHeld()) {
                wakeLock.acquire(); // INDEFINITE WakeLock pentru GPS continuu
                Log.d(TAG, "✅ WAKELOCK ACQUIRED INDEFINIT - previne deep sleep când e blocat");
            } else if (wakeLock != null && wakeLock.isHeld()) {
                Log.d(TAG, "✅ WAKELOCK ALREADY HELD - GPS continuu garantat");
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ CRITICAL: Foreground service FAILED: " + e.getMessage());
        }
        
        if (intent != null && ACTION_GPS_ALARM.equals(intent.getAction())) {
            // ALARM TRIGGERED: Get GPS location and transmit for all active courses
            Log.e(TAG, "🔄 === CRITICAL === ALARM TRIGGERED - performing GPS cycle");
            Log.e(TAG, "⏰ AlarmManager SUCCESS - timer working correctly");
            Log.e(TAG, "📊 Current activeCourses.size(): " + activeCourses.size());
            performOptimalGPSCycle();
        } else {
            // Regular service commands (START_GPS, STOP_GPS, etc.)
            Log.d(TAG, "📥 DIAGNOSTIC: HANDLING SERVICE COMMAND");
            
            if (intent != null) {
                Log.d(TAG, "🔍 DIAGNOSTIC: Intent extras:");
                Bundle extras = intent.getExtras();
                if (extras != null) {
                    for (String key : extras.keySet()) {
                        Log.d(TAG, "  - " + key + ": " + extras.get(key));
                    }
                } else {
                    Log.w(TAG, "❌ DIAGNOSTIC: Intent has no extras");
                }
            }
            
            handleServiceCommand(intent);
            
            // ELIMINAT duplicated GPS cycle - handleServiceCommand() already handles everything
            // GPS timer starts automatically in handleServiceCommand(), no need to duplicate here
        }
        
        Log.d(TAG, "🚨 === DIAGNOSTIC END === onStartCommand completed");
        return START_STICKY; // Restart if killed by system
    }
    
    /**
     * MOST EFFICIENT: AlarmManager triggers GPS reading exactly every 5 seconds
     * GPS hardware is activated ONLY when needed, then immediately turned off
     */
    private void performOptimalGPSCycle() {
        if (activeCourses.isEmpty()) {
            Log.d(TAG, "⏸️ No active courses - stopping optimal GPS cycle");
            stopOptimalGPSTimer();
            return;
        }
        
        Log.e(TAG, "⏰ === CRITICAL === OPTIMAL GPS CYCLE STARTED - getting location for " + activeCourses.size() + " courses");
        

        
        try {
            // CRITICAL: Get LAST KNOWN location first (instant, no battery)
            Location lastLocation = null;
            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                lastLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                Log.d(TAG, "🔍 LastKnownLocation check: " + (lastLocation != null ? "FOUND" : "NULL"));
            } else {
                Log.e(TAG, "❌ CRITICAL: NO GPS PERMISSION - service cannot function!");
            }
            
            if (lastLocation != null && 
                (System.currentTimeMillis() - lastLocation.getTime()) < 3000) { // Less than 3s old
                
                long age = System.currentTimeMillis() - lastLocation.getTime();
                float accuracy = lastLocation.getAccuracy();
                
                // PRECISION CHECK pentru lastKnownLocation
                if (accuracy <= 15.0f) { // Acceptă lastKnown sub 15m pentru eficiență
                    Log.e(TAG, "✅ Using recent HIGH PRECISION GPS - Age: " + age + "ms, Accuracy: " + accuracy + "m");
                    transmitGPSForAllCourses(lastLocation);
                } else {
                    Log.d(TAG, "⚠️ Recent GPS cu precizie scăzută (" + accuracy + "m) - solicită GPS nou pentru precizie înaltă");
                    requestSingleGPSLocation();
                }
                
            } else {
                if (lastLocation != null) {
                    long age = System.currentTimeMillis() - lastLocation.getTime();
                    Log.d(TAG, "🔄 LastKnown GPS too old (" + age + "ms) - requesting fresh location");
                } else {
                    Log.d(TAG, "🔄 No lastKnown GPS - requesting fresh location");
                }
                requestSingleGPSLocation();
                
                // TIMEOUT SAFETY ELIMINAT - requestSingleGPSLocation acum gestionează scheduling
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error in optimal GPS cycle: " + e.getMessage());
            e.printStackTrace();
            // Still schedule next cycle even on error to maintain background operation
            if (!activeCourses.isEmpty()) {
                Log.w(TAG, "🔧 Scheduling next cycle despite error to maintain continuity");
                scheduleNextOptimalGPSCycle();
            }
        }
    }
    
    /**
     * Request single GPS location - SIMPLIFIED like functional version
     */
    private void requestSingleGPSLocation() {
        try {
            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                Log.e(TAG, "❌ No GPS permission - scheduling next cycle");
                scheduleNextOptimalGPSCycle();
                return;
            }
            
            Log.d(TAG, "📡 Requesting GPS location...");
            
            // Simple GPS request with callback
            LocationListener listener = new LocationListener() {
                @Override
                public void onLocationChanged(Location location) {
                    Log.d(TAG, "✅ GPS received: " + location.getLatitude() + ", " + location.getLongitude());
                    locationManager.removeUpdates(this);
                    transmitGPSForAllCourses(location);
                }
                
                @Override
                public void onProviderEnabled(String provider) {}
                
                @Override
                public void onProviderDisabled(String provider) {}
                
                @Override
                public void onStatusChanged(String provider, int status, Bundle extras) {}
            };
            
            // Primary GPS provider
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestSingleUpdate(LocationManager.GPS_PROVIDER, listener, null);
                Log.d(TAG, "📡 GPS request sent");
            } else if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestSingleUpdate(LocationManager.NETWORK_PROVIDER, listener, null);
                Log.d(TAG, "📡 Network GPS request sent");
            } else {
                Log.w(TAG, "⚠️ No GPS providers - scheduling next cycle");
                scheduleNextOptimalGPSCycle();
                return;
            }
            
            // Timeout after 2 seconds
            new android.os.Handler().postDelayed(() -> {
                Log.w(TAG, "⏰ GPS timeout - scheduling next cycle");
                locationManager.removeUpdates(listener);
                scheduleNextOptimalGPSCycle();
            }, 2000);
            
        } catch (Exception e) {
            Log.e(TAG, "❌ GPS request error: " + e.getMessage());
            scheduleNextOptimalGPSCycle();
        }
    }
    
    /**
     * Transmit GPS data for all active courses - SIMPLIFIED like functional version
     */
    private void transmitGPSForAllCourses(Location location) {
        if (location == null) {
            Log.w(TAG, "⚠️ NULL location - cannot transmit GPS data");
            scheduleNextOptimalGPSCycle();
            return;
        }
        
        Log.e(TAG, "📡 === CRITICAL === TRANSMITTING GPS for " + activeCourses.size() + " active courses");
        Log.e(TAG, "📍 GPS Location: lat=" + location.getLatitude() + ", lng=" + location.getLongitude() + ", accuracy=" + location.getAccuracy() + "m");
        
        int transmissionCount = 0;
        java.util.Set<String> coursesToRemove = new java.util.HashSet<>();
        
        for (Map.Entry<String, CourseData> entry : activeCourses.entrySet()) {
            CourseData course = entry.getValue();
            try {
                Log.e(TAG, "📤 === CRITICAL === Transmitting GPS for course: " + course.courseId + " (UIT: " + course.uit + ", Status: " + course.status + ")");
                transmitOptimalGPSData(course, location);
                transmissionCount++;
                Log.e(TAG, "✅ === SUCCESS === GPS transmission SUCCESS for course: " + course.courseId);
                
                // STATUS 3 (PAUSE): Mark as transmitted and schedule for removal
                if (course.status == 3) {
                    course.pauseTransmitted = true;
                    coursesToRemove.add(course.courseId);
                    Log.d(TAG, "⏸️ PAUSE transmitted and marked for removal for: " + course.courseId + " - consistent with frontend");
                }
                
                // STATUS 4 (STOP): Schedule for removal after successful transmission
                if (course.status == 4) {
                    coursesToRemove.add(course.courseId);
                    Log.d(TAG, "🏁 Course " + course.courseId + " marked for removal after FINAL transmission");
                }
                
            } catch (Exception e) {
                Log.e(TAG, "❌ GPS transmission FAILED for course " + course.courseId + ": " + e.getMessage());
                e.printStackTrace();
                
                // Still remove status 4 courses even if transmission failed
                if (course.status == 4) {
                    coursesToRemove.add(course.courseId);
                }
            }
        }
        
        // Remove completed courses (status 3 PAUSE and status 4 STOP) after transmission
        for (String courseIdToRemove : coursesToRemove) {
            activeCourses.remove(courseIdToRemove);
            Log.d(TAG, "🗑️ REMOVED course: " + courseIdToRemove + " (PAUSE or STOP status)");
        }
        
        Log.d(TAG, "📊 GPS TRANSMISSION SUMMARY: " + transmissionCount + "/" + activeCourses.size() + " courses transmitted successfully");
        
        // Reset shared timestamp for next cycle
        gpsSharedTimestamp = null;
        Log.d(TAG, "🔄 SHARED TIMESTAMP reset for next cycle");
        
        // Always schedule next cycle to maintain background operation
        scheduleNextOptimalGPSCycle();
    }
    
    /**
     * Most efficient GPS data transmission
     */
    private void transmitOptimalGPSData(CourseData course, Location location) throws Exception {
        // Create GPS data JSON - EXACT format ca în logurile funcționale
        org.json.JSONObject gpsData = new org.json.JSONObject();
        
        // COORDONATE - exact 7 decimale ca în varianta funcțională
        double lat = Math.round(location.getLatitude() * 10000000.0) / 10000000.0;
        double lng = Math.round(location.getLongitude() * 10000000.0) / 10000000.0;
        gpsData.put("lat", lat);
        gpsData.put("lng", lng);
        
        // TIMESTAMP PARTAJAT - exact ca în logurile funcționale
        if (gpsSharedTimestamp == null) {
            gpsSharedTimestamp = new java.util.Date();
        }
        java.text.SimpleDateFormat utcFormat = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.getDefault());
        utcFormat.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
        String sharedTimestamp = utcFormat.format(gpsSharedTimestamp);
        gpsData.put("timestamp", sharedTimestamp);
        
        Log.d(TAG, "🕒 SHARED TIMESTAMP Android: " + sharedTimestamp + " for course: " + course.courseId);
        
        // EXACT ca în logurile funcționale - format original
        gpsData.put("viteza", location.getSpeed() * 3.6); // m/s to km/h as float (ca în log)
        gpsData.put("directie", location.getBearing()); // Real bearing as float (ca în log)
        gpsData.put("altitudine", location.getAltitude()); // Real altitude as double (ca în log)
        gpsData.put("baterie", getBatteryLevel()); // Battery as int without % (ca în log)
        gpsData.put("numar_inmatriculare", course.vehicleNumber);
        gpsData.put("uit", course.uit);
        gpsData.put("status", course.status);
        gpsData.put("hdop", location.getAccuracy());
        gpsData.put("gsm_signal", getNetworkSignalStrength());
        
        Log.e(TAG, "📡 === CRITICAL === OPTIMAL GPS data for course " + course.courseId + ": " + gpsData.toString());
        Log.e(TAG, "🔑 Auth token length: " + course.authToken.length() + " chars (starts with: " + course.authToken.substring(0, Math.min(20, course.authToken.length())) + "...)");
        Log.e(TAG, "🌐 Transmitting to: " + API_BASE_URL + "gps.php");
        
        // DEBUGGING: Log exact data being sent ca în logurile funcționale
        Log.e(TAG, "🚨 === DEBUGGING === COMPLETE GPS DATA BEING SENT: " + gpsData.toString());
        Log.e(TAG, "📡 GPS Transmission to gps.php");
        Log.e(TAG, "🔐 FULL TOKEN BEING SENT: Bearer " + course.authToken.substring(0, Math.min(50, course.authToken.length())) + "...");
        
        // FOREGROUND OPTIMIZED: Instant transmission with single optimized thread
        // No batching - GPS must be sent immediately for real-time tracking
        httpThreadPool.submit(() -> {
            sendOptimizedForegroundGPS(gpsData.toString(), course.authToken, course.courseId);
        });
    }
    
    /**
     * FOREGROUND OPTIMIZED GPS TRANSMISSION
     * Simple, fast, reliable - perfect for 5-second intervals
     */
    private void sendOptimizedForegroundGPS(String jsonData, String authToken, String courseId) {
        java.net.HttpURLConnection connection = null;
        try {
            java.net.URL url = new java.net.URL(API_BASE_URL + "gps.php");
            connection = (java.net.HttpURLConnection) url.openConnection();
            
            // FOREGROUND OPTIMIZED SETTINGS - Simple and fast
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            connection.setRequestProperty("Authorization", "Bearer " + authToken);
            connection.setRequestProperty("User-Agent", "iTrack-Foreground-GPS/1.0");
            connection.setDoOutput(true);
            connection.setConnectTimeout(5000); // Quick timeout for foreground
            connection.setReadTimeout(5000);
            
            // Direct transmission - no compression for small GPS JSON
            byte[] jsonBytes = jsonData.getBytes("UTF-8");
            try (java.io.OutputStream os = connection.getOutputStream()) {
                os.write(jsonBytes);
                os.flush();
            }
            
            int responseCode = connection.getResponseCode();
            
            // Read response body for debugging
            String responseBody = "";
            try {
                java.io.InputStream inputStream = (responseCode >= 200 && responseCode < 300) 
                    ? connection.getInputStream() 
                    : connection.getErrorStream();
                
                if (inputStream != null) {
                    java.util.Scanner scanner = new java.util.Scanner(inputStream, "UTF-8");
                    responseBody = scanner.useDelimiter("\\A").hasNext() ? scanner.next() : "";
                    scanner.close();
                }
            } catch (Exception readError) {
                Log.w(TAG, "Could not read response body: " + readError.getMessage());
            }
            
            if (responseCode == 200) {
                Log.e(TAG, "✅ === SUCCESS === GPS SUCCESS " + responseCode + " for course: " + courseId + " | Response: " + responseBody);
                
                // SUCCESS - simplificat fără WebView (ca în commit funcțional)
                Log.d(TAG, "📡 GPS SUCCESS - coordinate transmitted successfully");
            } else {
                Log.w(TAG, "⚠️ GPS FAILED " + responseCode + " for course: " + courseId + " | Response: " + responseBody);
                Log.w(TAG, "🔍 Request was: " + jsonData);
                
                // ERROR - simplificat fără WebView (ca în commit funcțional)
                Log.w(TAG, "📡 GPS ERROR - transmission failed");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ FOREGROUND GPS FAILED for " + courseId + ": " + e.getMessage());
            
            // NETWORK ERROR - simplificat fără WebView (ca în commit funcțional)
            Log.e(TAG, "📡 NETWORK ERROR - connection failed");
            
            // No retry for foreground - next transmission comes in 5 seconds anyway
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }
    
    /**
     * Schedule next GPS cycle - ADAPTIVE INTERVAL based on screen state
     */
    private void scheduleNextOptimalGPSCycle() {
        Log.d(TAG, "🔄 SCHEDULE CHECK: activeCourses.size() = " + activeCourses.size());
        if (!activeCourses.isEmpty()) {
            // CRITICAL FIX: Ensure PendingIntent exists - recreate if missing
            if (gpsPendingIntent == null) {
                Log.e(TAG, "🚨 CRITICAL: gpsPendingIntent is NULL - recreating AlarmManager setup");
                Intent alarmIntent = new Intent(this, OptimalGPSService.class);
                alarmIntent.setAction(ACTION_GPS_ALARM);
                gpsPendingIntent = PendingIntent.getService(
                    this, 0, alarmIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                isAlarmActive = true; // Mark as active since we're about to schedule
                Log.e(TAG, "✅ CRITICAL: PendingIntent recreated - AlarmManager ready");
            }
            
            // CRITICAL: WakeLock PERSISTENT pentru următorul ciclu când e blocat
            if (wakeLock != null && !wakeLock.isHeld()) {
                wakeLock.acquire(10*60*1000L /*10 minutes*/);
                Log.d(TAG, "🔋 WakeLock ACQUIRED pentru următorul ciclu GPS - GARANTEZ background operation");
            }
            
            // CRITICAL VALIDATION: Verify AlarmManager in scheduleNext as well
            if (alarmManager == null) {
                Log.e(TAG, "❌ FATAL: AlarmManager is NULL in scheduleNextOptimalGPSCycle - recreating service");
                return;
            }
            
            // INTERVAL FIX: 5 secunde exact ca în commit-ul funcțional 9c5b19b
            long nextTriggerTime = SystemClock.elapsedRealtime() + GPS_INTERVAL_MS;
            try {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.ELAPSED_REALTIME_WAKEUP,
                    nextTriggerTime,
                    gpsPendingIntent
                );
                Log.e(TAG, "✅ === CRITICAL === NEXT ALARM SCHEDULED SUCCESSFULLY");
            } catch (Exception e) {
                Log.e(TAG, "❌ FATAL: Schedule next alarm FAILED: " + e.getMessage());
                Log.e(TAG, "🔍 Trying fallback schedule method...");
                try {
                    alarmManager.setAndAllowWhileIdle(
                        AlarmManager.ELAPSED_REALTIME_WAKEUP,
                        nextTriggerTime,
                        gpsPendingIntent
                    );
                    Log.e(TAG, "✅ FALLBACK: Next alarm scheduled successfully");
                } catch (Exception fallbackError) {
                    Log.e(TAG, "❌ FATAL: All schedule methods FAILED: " + fallbackError.getMessage());
                }
            }
            
            Log.e(TAG, "⏰ === CRITICAL === NEXT GPS ALARM SET: in exactly " + (GPS_INTERVAL_MS/1000) + "s for " + activeCourses.size() + " active courses");
            Log.e(TAG, "📡 Trigger time: " + nextTriggerTime + " (current: " + SystemClock.elapsedRealtime() + ")");
            Log.e(TAG, "✅ === CRITICAL === GPS CONTINUITY GUARANTEED - exact 5s intervals");
        } else {
            Log.w(TAG, "❌ NO ACTIVE COURSES - stopping GPS timer");
            stopOptimalGPSTimer();
        }
    }
    
    // Screen state check removed - using fixed 5s intervals like functional commit 9c5b19b
    
    /**
     * Get real battery level efficiently
     */
    private int getBatteryLevel() {
        try {
            android.content.IntentFilter filter = new android.content.IntentFilter(android.content.Intent.ACTION_BATTERY_CHANGED);
            android.content.Intent batteryStatus = registerReceiver(null, filter);
            int level = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_LEVEL, -1);
            int scale = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_SCALE, -1);
            return (int) ((level * 100.0f) / scale);
        } catch (Exception e) {
            return 85; // Fallback
        }
    }
    
    /**
     * Calculate HDOP from GPS accuracy (real data)
     */
    private float getHdopFromLocation(Location location) {
        try {
            if (location.hasAccuracy()) {
                float accuracy = location.getAccuracy(); // meters
                // Convert accuracy to HDOP approximation
                // Good GPS: accuracy < 5m → HDOP ~1.0
                // Fair GPS: accuracy 5-10m → HDOP ~2.0  
                // Poor GPS: accuracy > 10m → HDOP ~3.0+
                if (accuracy <= 5.0f) return 1.0f;
                else if (accuracy <= 10.0f) return 2.0f;
                else return Math.min(accuracy / 5.0f, 5.0f); // Cap at 5.0
            }
        } catch (Exception e) {
            Log.w(TAG, "Error calculating HDOP: " + e.getMessage());
        }
        return 1.0f; // Default good signal
    }
    
    /**
     * Get real GSM signal strength
     */
    private String getSignalStrength() {
        try {
            android.telephony.TelephonyManager telephonyManager = 
                (android.telephony.TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
            
            if (telephonyManager != null) {
                int networkType = telephonyManager.getNetworkType();
                
                switch (networkType) {
                    case android.telephony.TelephonyManager.NETWORK_TYPE_LTE:
                    case android.telephony.TelephonyManager.NETWORK_TYPE_NR: // 5G
                        return "4G";
                    case android.telephony.TelephonyManager.NETWORK_TYPE_HSDPA:
                    case android.telephony.TelephonyManager.NETWORK_TYPE_HSUPA:
                    case android.telephony.TelephonyManager.NETWORK_TYPE_HSPA:
                    case android.telephony.TelephonyManager.NETWORK_TYPE_HSPAP:
                    case android.telephony.TelephonyManager.NETWORK_TYPE_UMTS:
                        return "3G";
                    case android.telephony.TelephonyManager.NETWORK_TYPE_EDGE:
                    case android.telephony.TelephonyManager.NETWORK_TYPE_GPRS:
                        return "2G";
                    case android.telephony.TelephonyManager.NETWORK_TYPE_CDMA:
                    case android.telephony.TelephonyManager.NETWORK_TYPE_1xRTT:
                        return "2G";
                    default:
                        return "4G"; // Default assume good connection
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Error getting signal strength: " + e.getMessage());
        }
        return "4G"; // Fallback
    }
    
    /**
     * Get real network signal strength (1-4 scale)
     */
    private int getNetworkSignalStrength() {
        try {
            android.telephony.TelephonyManager tm = (android.telephony.TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
            if (tm != null) {
                // Get signal strength from telephony manager
                android.telephony.SignalStrength signalStrength = tm.getSignalStrength();
                if (signalStrength != null) {
                    int level = signalStrength.getLevel(); // Returns 0-4 (4 being strongest)
                    return Math.max(1, level); // Ensure minimum value is 1
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Error getting signal strength: " + e.getMessage());
        }
        return 4; // Default to good signal if unable to determine
    }
    
    /**
     * Start EXACT 5-second AlarmManager timer (most accurate)
     */
    private void startOptimalGPSTimer() {
        // CRITICAL FIX: Force reset timer-ul chiar dacă pare activ - garantează pornirea
        if (isAlarmActive && gpsPendingIntent != null) {
            Log.d(TAG, "🔄 GPS timer appears active - forcing restart to ensure reliability");
            stopOptimalGPSTimer(); // Clean stop before restart
        }
        
        Log.e(TAG, "🚀 === CRITICAL === STARTING OPTIMAL GPS TIMER");
        
        Intent alarmIntent = new Intent(this, OptimalGPSService.class);
        alarmIntent.setAction(ACTION_GPS_ALARM);
        
        gpsPendingIntent = PendingIntent.getService(
            this, 0, alarmIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // CRITICAL VALIDATION: Verify AlarmManager is available before setting alarm
        if (alarmManager == null) {
            Log.e(TAG, "❌ FATAL: AlarmManager is NULL in startOptimalGPSTimer - cannot set GPS alarm!");
            return;
        }
        
        // INTERVAL FIX: 5 secunde exact ca în commit-ul funcțional 9c5b19b
        long triggerTime = SystemClock.elapsedRealtime() + GPS_INTERVAL_MS;
        try {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.ELAPSED_REALTIME_WAKEUP,
                triggerTime,
                gpsPendingIntent
            );
            Log.e(TAG, "✅ === CRITICAL === AlarmManager.setExactAndAllowWhileIdle() SUCCESS");
        } catch (Exception e) {
            Log.e(TAG, "❌ FATAL: AlarmManager.setExactAndAllowWhileIdle() FAILED: " + e.getMessage());
            Log.e(TAG, "🔍 Trying fallback alarm method...");
            try {
                alarmManager.setAndAllowWhileIdle(
                    AlarmManager.ELAPSED_REALTIME_WAKEUP,
                    triggerTime,
                    gpsPendingIntent
                );
                Log.e(TAG, "✅ FALLBACK: AlarmManager.setAndAllowWhileIdle() SUCCESS");
            } catch (Exception fallbackError) {
                Log.e(TAG, "❌ FATAL: All AlarmManager methods FAILED: " + fallbackError.getMessage());
            }
        }
        
        isAlarmActive = true;
        Log.e(TAG, "✅ === CRITICAL === OPTIMAL GPS timer STARTED - EXACT " + (GPS_INTERVAL_MS/1000) + "s intervals");
        Log.e(TAG, "📡 First trigger scheduled at: " + triggerTime + " (current: " + SystemClock.elapsedRealtime() + ")");
    }
    
    /**
     * Stop AlarmManager timer
     */
    private void stopOptimalGPSTimer() {
        if (gpsPendingIntent != null) {
            alarmManager.cancel(gpsPendingIntent);
            gpsPendingIntent = null;
        }
        isAlarmActive = false;
        Log.d(TAG, "🛑 Optimal GPS timer stopped");
    }
    
    private void handleServiceCommand(Intent intent) {
        if (intent == null) return;
        
        String action = intent.getAction();
        Log.d(TAG, "🎯 OPTIMAL GPS Command: " + action);
        
        if ("START_GPS".equals(action)) {
            String courseId = intent.getStringExtra("courseId");
            String uit = intent.getStringExtra("uit");
            String vehicleNumber = intent.getStringExtra("vehicleNumber");
            String authToken = intent.getStringExtra("authToken");
            int status = intent.getIntExtra("status", 2);
            
            Log.e(TAG, "📋 === CRITICAL === RECEIVED GPS PARAMETERS:");
            Log.e(TAG, "  courseId: " + courseId);
            Log.e(TAG, "  uit: " + uit);
            Log.e(TAG, "  vehicleNumber: " + vehicleNumber);
            Log.e(TAG, "  authToken: " + (authToken != null ? authToken.substring(0, Math.min(30, authToken.length())) + "..." : "null"));
            Log.e(TAG, "  status: " + status);
            
            // CRITICAL FIX: Validate parameters but STILL try to start timer if possible
            if (courseId == null || uit == null || authToken == null || vehicleNumber == null) {
                Log.e(TAG, "❌ CRITICAL: Missing required GPS parameters - cannot add course BUT will still ensure timer runs");
                Log.e(TAG, "Missing: " + 
                      (courseId == null ? "courseId " : "") +
                      (uit == null ? "uit " : "") +
                      (authToken == null ? "authToken " : "") +
                      (vehicleNumber == null ? "vehicleNumber " : ""));
                
                // CRITICAL FIX: Still ensure AlarmManager runs even with bad parameters
                if (!isAlarmActive && !activeCourses.isEmpty()) {
                    Log.e(TAG, "🚀 EMERGENCY: Starting GPS timer despite parameter errors - existing courses need GPS");
                    startOptimalGPSTimer();
                }
                return;
            }
            
            // Check if course already exists to prevent duplicates
            if (activeCourses.containsKey(courseId)) {
                Log.w(TAG, "⚠️ Course " + courseId + " already exists - updating status only");
                activeCourses.get(courseId).status = status;
                
                // CRITICAL FIX: Ensure timer is running even for existing courses
                if (!isAlarmActive) {
                    Log.e(TAG, "🚨 CRITICAL: Course exists but timer NOT active - starting GPS timer NOW");
                    startOptimalGPSTimer();
                } else {
                    Log.e(TAG, "✅ Course exists and timer IS active - GPS continuă");
                }
                return;
            }
            
            CourseData courseData = new CourseData(courseId, uit, status, vehicleNumber, authToken);
            activeCourses.put(courseId, courseData);
            
            Log.e(TAG, "✅ === CRITICAL === OPTIMAL course added: " + courseId + " (UIT: " + uit + ")");
            Log.e(TAG, "📊 ACTIVE COURSES COUNT: " + activeCourses.size());
            Log.e(TAG, "🔍 ALARM STATUS: isAlarmActive = " + isAlarmActive);
            
            // Eliminat forced testing - simplificare ca în commit funcțional
            
            // CRITICAL FIX: ALWAYS ensure GPS timer is running for ANY active course
            if (!isAlarmActive) {
                Log.e(TAG, "🚀 CRITICAL: STARTING GPS TIMER for new course - guaranteed background GPS");
                startOptimalGPSTimer();
            } else {
                Log.e(TAG, "✅ GPS TIMER already active - continuing with " + activeCourses.size() + " courses");
            }
            
            // EMERGENCY FIX: Double-check alarm is truly active and force start if not
            new android.os.Handler().postDelayed(() -> {
                if (!activeCourses.isEmpty() && !isAlarmActive) {
                    Log.e(TAG, "🚨 EMERGENCY: Courses active but timer FAILED - force starting GPS timer");
                    startOptimalGPSTimer();
                }
            }, 2000); // Check after 2 seconds
            
        } else if ("STOP_GPS".equals(action)) {
            String courseId = intent.getStringExtra("courseId");
            activeCourses.remove(courseId);
            
            Log.d(TAG, "🛑 OPTIMAL course removed: " + courseId);
            
            if (activeCourses.isEmpty()) {
                stopOptimalGPSTimer();
            }
            
        } else if ("UPDATE_STATUS".equals(action)) {
            String courseId = intent.getStringExtra("courseId");
            int newStatus = intent.getIntExtra("newStatus", 2);
            
            CourseData course = activeCourses.get(courseId);
            if (course != null) {
                Log.d(TAG, "📊 OPTIMAL status update: " + courseId + " (" + course.status + " -> " + newStatus + ")");
                
                // CRITICAL FIX: REMOVE course completely for status 3 or 4 to prevent GPS transmission
                if (newStatus == 3 || newStatus == 4) {
                    activeCourses.remove(courseId);
                    Log.d(TAG, "🛑 REMOVING course " + courseId + " from active list - status " + newStatus + " (STOP/PAUSE)");
                    
                    // If no more active courses, stop the timer completely
                    if (activeCourses.isEmpty()) {
                        stopOptimalGPSTimer();
                        Log.d(TAG, "⏸️ All courses stopped - OptimalGPS timer stopped completely");
                    } else {
                        Log.d(TAG, "📊 " + activeCourses.size() + " courses still active - timer continues");
                    }
                    return;
                }
                
                // For status 2 (ACTIVE), update status and reset flags
                if (newStatus == 2) {
                    course.status = newStatus;
                    course.pauseTransmitted = false;
                    Log.d(TAG, "▶️ RESUME: Course " + courseId + " reactivated - GPS will transmit continuously");
                    
                    // If timer is not active but we have courses, restart it
                    if (!isAlarmActive && !activeCourses.isEmpty()) {
                        startOptimalGPSTimer();
                        Log.d(TAG, "🔄 Restarting OptimalGPS timer for reactivated course");
                    }
                } else {
                    // For other statuses, just update
                    course.status = newStatus;
                }
                
                Log.d(TAG, "✅ OPTIMAL status updated: " + courseId + " -> " + newStatus + " (Active courses: " + activeCourses.size() + ")");
            } else {
                Log.w(TAG, "⚠️ Course " + courseId + " not found for status update");
            }
            
        } else if ("CLEAR_ALL".equals(action)) {
            activeCourses.clear();
            stopOptimalGPSTimer();
            Log.d(TAG, "🧹 OPTIMAL GPS cleared all courses");
        }
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    /**
     * CRITICAL: Ensures service continues when app is removed from recent tasks
     * This allows GPS to work even after user closes app or switches to other apps
     */
    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);
        Log.e(TAG, "🚨 APP REMOVED FROM RECENT TASKS - ensuring GPS continues in background");
        
        // If we have active courses, restart the service to ensure it continues
        if (!activeCourses.isEmpty()) {
            Log.e(TAG, "📱 BACKGROUND PERSISTENCE: " + activeCourses.size() + " active courses - restarting service");
            
            // Create restart intent
            Intent restartIntent = new Intent(getApplicationContext(), OptimalGPSService.class);
            restartIntent.setAction("RESTART_AFTER_TASK_REMOVED");
            
            // Restart service after short delay
            PendingIntent restartPendingIntent = PendingIntent.getService(
                getApplicationContext(), 
                1000, 
                restartIntent, 
                PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE
            );
            
            AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
            alarmManager.set(
                AlarmManager.ELAPSED_REALTIME,
                SystemClock.elapsedRealtime() + 1000, // 1 second delay
                restartPendingIntent
            );
            
            Log.e(TAG, "✅ BACKGROUND GPS SERVICE will restart in 1 second - GPS continues when app closed");
        } else {
            Log.d(TAG, "📱 No active courses - allowing service to stop normally");
        }
    }
    
    @Override
    public void onDestroy() {
        Log.d(TAG, "🛑 OPTIMAL GPS Service destroyed");
        
        // Release WakeLock
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            Log.d(TAG, "🔋 WakeLock released");
        }
        
        // Stop GPS timer
        stopOptimalGPSTimer();
        
        // Shutdown HTTP thread pool
        if (httpThreadPool != null && !httpThreadPool.isShutdown()) {
            httpThreadPool.shutdown();
            try {
                if (!httpThreadPool.awaitTermination(2, TimeUnit.SECONDS)) {
                    httpThreadPool.shutdownNow();
                }
            } catch (InterruptedException e) {
                httpThreadPool.shutdownNow();
            }
            Log.d(TAG, "🔌 HTTP thread pool shutdown");
        }
        
        super.onDestroy();
        Log.d(TAG, "✅ Optimal GPS Service cleanup complete");
    }
}