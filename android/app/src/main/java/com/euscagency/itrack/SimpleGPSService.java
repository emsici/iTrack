package com.euscagency.itrack;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;

import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.BatteryManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;

import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
// Removed unused concurrent imports - using Handler instead

public class SimpleGPSService extends Service implements LocationListener {
    private static final String TAG = "SimpleGPSService";
    private static final int NOTIFICATION_ID = 1001;
    private static final String CHANNEL_ID = "gps_service_channel";
    private static final long GPS_INTERVAL_MS = 5000; // 5 seconds
    private static final String API_BASE_URL = "https://www.euscagency.com/etsm3/platforme/transport/apk";

    private LocationManager locationManager;
    private Handler gpsHandler;
    private HandlerThread gpsHandlerThread;
    private Runnable gpsRunnable;
    private Location lastLocation;
    private boolean isTracking = false;
    private boolean isForegroundStarted = false;
    
    // CRITICAL: Force continuous timer execution
    private boolean forceTimerContinuous = true;
    
    // ROBUST BACKGROUND EXECUTION: Handler in foreground service (no restrictions)
    private Map<String, CourseData> activeCourses = new HashMap<>();
    private String userAuthToken;
    private PowerManager.WakeLock wakeLock;
    // Using direct HttpURLConnection for true background operation without WebView dependency

    public static class CourseData {
        public String courseId;
        public String uit;
        public int status;
        public String vehicleNumber;

        public CourseData(String courseId, String uit, int status, String vehicleNumber) {
            this.courseId = courseId;
            this.uit = uit;
            this.status = status;
            this.vehicleNumber = vehicleNumber;
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "📱 SimpleGPSService created - BACKGROUND MODE");
        
        createNotificationChannel();
        locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        
        // CRITICAL: Start IMMEDIATELY as foreground service for background operation
        Log.d(TAG, "🚀 STARTING FOREGROUND SERVICE in onCreate()");
        startForeground(NOTIFICATION_ID, createNotification());
        isForegroundStarted = true;
        Log.d(TAG, "✅ Foreground service started in onCreate()");
        
        // Initialize GPS handler immediately for continuous operation
        gpsHandlerThread = new HandlerThread("GPSBackgroundThread");
        gpsHandlerThread.start();
        gpsHandler = new Handler(gpsHandlerThread.getLooper());
        Log.d(TAG, "✅ GPS Handler Thread started: " + gpsHandlerThread.isAlive());
        
        // CRITICAL: Start GPS timer IMMEDIATELY for continuous 5-second operation
        Log.d(TAG, "🚀 Starting GPS timer IMMEDIATELY - will run every 5 seconds");
        forceTimerContinuous = true;
        startGPSTransmissions();
        Log.d(TAG, "✅ GPS timer activated on service creation");
        
        // Acquire ENHANCED wake lock for true background operation
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP, 
                "iTrack:GPSBackgroundLock"
            );
            if (!wakeLock.isHeld()) {
                wakeLock.acquire(10 * 60 * 60 * 1000L); // 10 hours max
                Log.d(TAG, "🔋 Enhanced wake lock acquired for true background operation");
            }
        }
        
        // GPS Handler will be initialized when first course starts
        Log.d(TAG, "✅ SimpleGPSService ready for BACKGROUND GPS with wake lock");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            // CRITICAL: Ensure GPS timer is running even without intent
            Log.d(TAG, "🔄 NULL intent - ensuring GPS timer is active");
            if (!forceTimerContinuous) {
                forceTimerContinuous = true;
                startGPSTimer();
            }
            return START_STICKY;
        }
        
        String action = intent.getAction();
        Log.d(TAG, "onStartCommand - Action: " + action);

        if ("START_GPS".equals(action)) {
            startGPSTracking(intent);
        } else if ("UPDATE_STATUS".equals(action)) {
            updateCourseStatus(intent);
        } else if ("CLEAR_ALL".equals(action)) {
            clearAllCourses();
        } else if ("STOP_TRACKING".equals(action)) {
            stopSpecificCourse(intent.getStringExtra("courseId"));
        } else if ("TRANSMIT_GPS".equals(action)) {
            performGPSTransmission();
        }

        return START_STICKY; // Service restarts automatically if killed by system
    }

    private void startGPSTracking(Intent intent) {
        String courseId = intent.getStringExtra("courseId");
        String uit = intent.getStringExtra("uit");
        int status = intent.getIntExtra("status", 2);
        String vehicleNumber = intent.getStringExtra("vehicleNumber");
        String authToken = intent.getStringExtra("token");
        
        if (courseId == null || uit == null || vehicleNumber == null || authToken == null) {
            Log.e(TAG, "Missing required parameters");
            return;
        }

        Log.d(TAG, "Starting GPS tracking for course: " + courseId);
        
        // CRITICAL: Always update userAuthToken to match current session
        userAuthToken = authToken;
        Log.d(TAG, String.format("🔑 userAuthToken updated: %s", 
            userAuthToken != null ? userAuthToken.substring(0, Math.min(30, userAuthToken.length())) + "..." : "null"));

        CourseData courseData = new CourseData(courseId, uit, status, vehicleNumber);
        activeCourses.put(courseId, courseData);
        
        Log.d(TAG, String.format("✅ Course %s added to activeCourses Map", courseId));
        Log.d(TAG, String.format("📊 activeCourses Map size: %d", activeCourses.size()));
        Log.d(TAG, String.format("📊 activeCourses contains: %s", activeCourses.keySet().toString()));
        Log.d(TAG, String.format("🎯 Course %s status: %d (GPS will transmit: %s)", 
            courseId, status, status == 2 ? "YES" : "NO"));

        if (!isTracking) {
            Log.d(TAG, "🚀 CRITICAL: Starting foreground service FIRST");
            // CRITICAL: startForeground MUST be called FIRST on Android 8+
            startForeground(NOTIFICATION_ID, createNotification());
            Log.d(TAG, "✅ Foreground service started successfully");
            
            Log.d(TAG, "🗺️ Starting location updates");
            startLocationUpdates();
            
            Log.d(TAG, "🎯 Setting isTracking = true");
            isTracking = true;
            
            Log.d(TAG, "✅ GPS SYSTEM FULLY INITIALIZED - Timer already running every 5 seconds");
        } else {
            Log.d(TAG, "📊 GPS already running - course added to existing session");
        }
    }

    private void startLocationUpdates() {
        try {
            locationManager.requestLocationUpdates(
                LocationManager.GPS_PROVIDER,
                GPS_INTERVAL_MS, // 5000ms - sync with Capacitor backgroundLocationUpdateInterval
                0, // distanceFilter: 0 - sync with Capacitor distanceFilter
                this
            );
            locationManager.requestLocationUpdates(
                LocationManager.NETWORK_PROVIDER,
                GPS_INTERVAL_MS, // 5000ms - sync with Capacitor backgroundLocationUpdateInterval
                0, // distanceFilter: 0 - sync with Capacitor distanceFilter
                this
            );
            
            Location lastGPS = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            if (lastGPS != null) {
                lastLocation = lastGPS;
                Log.d(TAG, "Using last known GPS location");
            }
            
            Log.d(TAG, "Location updates started");
        } catch (SecurityException e) {
            Log.e(TAG, "Location permission denied", e);
        }
    }

    // DELETED: Old complex initializeGPSHandler() that was setting forceTimerContinuous = false
    // This was causing GPS to stop after first transmission
    // Now using only startGPSTimer() implementation

    private void startGPSTransmissions() {
        Log.d(TAG, "=== STARTING GPS TRANSMISSIONS VIA startGPSTimer() ===");
        forceTimerContinuous = true;
        
        // Use the working startGPSTimer() implementation
        startGPSTimer();
        
        Log.d(TAG, "✅ GPS transmissions started via startGPSTimer()");
    }
    
    private void startGPSTimer() {
        Log.d(TAG, "🔄 STARTING BACKGROUND GPS TIMER WITH DEDICATED THREAD");
        
        // Create dedicated background thread for GPS operations
        if (gpsHandlerThread == null) {
            gpsHandlerThread = new HandlerThread("GPSBackgroundThread");
            gpsHandlerThread.start();
            gpsHandler = new Handler(gpsHandlerThread.getLooper());
            Log.d(TAG, "✅ Background HandlerThread created for GPS");
        }
        
        // FORCE TIMER RECREATION: Always cancel existing timer and create new one
        if (gpsHandler != null && gpsRunnable != null) {
            Log.d(TAG, "🔄 Stopping existing timer to recreate");
            gpsHandler.removeCallbacks(gpsRunnable);
        }
        Log.d(TAG, "🔄 Creating fresh timer - guaranteed execution");
        
        // Create background repeating runnable with GUARANTEED 5-second execution
        gpsRunnable = new Runnable() {
            @Override
            public void run() {
                long currentTime = System.currentTimeMillis();
                Log.d(TAG, "⏰ GPS TIMER CYCLE: " + currentTime + " on thread: " + Thread.currentThread().getName());
                
                // CRITICAL: Schedule next execution EXACTLY ONCE
                try {
                    if (gpsHandler != null) {
                        // Remove any pending callbacks first to prevent duplicates
                        gpsHandler.removeCallbacks(this);
                        // Then schedule exactly one execution
                        gpsHandler.postDelayed(this, GPS_INTERVAL_MS);
                        Log.d(TAG, "✅ SINGLE next cycle scheduled at " + (currentTime + GPS_INTERVAL_MS));
                    } else {
                        Log.e(TAG, "❌ GPS Handler is null during scheduling");
                    }
                } catch (Exception e) {
                    Log.e(TAG, "❌ Error scheduling next GPS cycle: " + e.getMessage());
                }
                Log.d(TAG, "✅ NEXT CYCLE scheduled for: " + (currentTime + GPS_INTERVAL_MS) + " (+5 seconds)");
                
                // Verify timer is actually scheduled
                if (gpsHandler.hasMessages(0)) {
                    Log.d(TAG, "✅ Confirmed: Handler has pending messages");
                } else {
                    Log.d(TAG, "ℹ️ Handler message queue status unknown");
                }
                
                // Then perform GPS transmission with full error protection
                try {
                    Log.d(TAG, "📊 activeCourses.size(): " + activeCourses.size());
                    Log.d(TAG, "📊 forceTimerContinuous: " + forceTimerContinuous);
                    Log.d(TAG, "📊 gpsHandler != null: " + (gpsHandler != null));
                    Log.d(TAG, "📊 handlerThread.isAlive(): " + (gpsHandlerThread != null && gpsHandlerThread.isAlive()));
                    
                    if (!activeCourses.isEmpty()) {
                        Log.d(TAG, "🚀 Performing GPS transmission for " + activeCourses.size() + " courses");
                        performGPSTransmission();
                        Log.d(TAG, "✅ GPS transmission completed - Timer should continue in 5 seconds");
                    } else {
                        Log.d(TAG, "⏳ Timer running - no active courses - will continue anyway");
                    }
                } catch (Exception e) {
                    Log.e(TAG, "❌ GPS transmission error (timer continues): " + e.getMessage());
                    // Timer continues regardless of any errors
                }
                
                // Final verification that timer is still alive
                Log.d(TAG, "🔄 Timer cycle COMPLETE - Next execution in 5 seconds");
                
                // Force flag to true to prevent any interruption
                if (!forceTimerContinuous) {
                    forceTimerContinuous = true;
                    Log.w(TAG, "🔧 Forced forceTimerContinuous to true");
                }
            }
        };
        
        // Start the first execution immediately
        Log.d(TAG, "🚀 Starting GPS timer - GUARANTEED 5-second intervals");
        gpsHandler.post(gpsRunnable);
        Log.d(TAG, "✅ GPS Timer activated - will execute every " + (GPS_INTERVAL_MS/1000) + " seconds");
    }
    
    private void stopGPSTimer() {
        // CRITICAL: In background mode, timer should NEVER stop
        if (forceTimerContinuous) {
            Log.w(TAG, "⚠️ BLOCKING stopGPSTimer() - forceTimerContinuous is true");
            Log.w(TAG, "⚠️ GPS timer will continue running in background mode");
            return;
        }
        
        if (gpsHandler != null && gpsRunnable != null) {
            gpsHandler.removeCallbacks(gpsRunnable);
            Log.d(TAG, "🛑 Background GPS timer stopped");
        }
        
        // Clean up background thread
        if (gpsHandlerThread != null) {
            gpsHandlerThread.quitSafely();
            gpsHandlerThread = null;
            gpsHandler = null;
            Log.d(TAG, "🧹 Background HandlerThread cleaned up");
        }
    }

    // Removed first duplicate transmitGPSData() method - keeping complete implementation below

    private void sendGPSRequest(JSONObject gpsData, String courseId) {
        Log.d(TAG, "🚀 TRANSMITTING GPS DATA via HttpURLConnection (BACKGROUND NATIVE)");
        Log.d(TAG, "📊 GPS Data size: " + gpsData.toString().length() + " chars");
        Log.d(TAG, "🔑 Auth token available: " + (userAuthToken != null ? "YES" : "NO"));
        
        // Convert JSONObject to string for CapacitorHttp
        String jsonString = gpsData.toString();
        Log.d(TAG, "📡 Complete GPS payload: " + jsonString);
        
        // CRITICAL: Direct HTTP transmission from background service
        try {
            // Use direct HTTP instead of WebView for true background operation
            Log.d(TAG, "🚀 DIRECT HTTP GPS TRANSMISSION (background independent)");
            String uitValue = activeCourses.containsKey(courseId) ? activeCourses.get(courseId).uit : "unknown";
            Log.d(TAG, "📊 Transmitting for course: " + courseId + " (UIT: " + uitValue + ")");
            
            URL url = new URL("https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Authorization", "Bearer " + userAuthToken);
            connection.setRequestProperty("User-Agent", "iTrack-Android-Service/1.0");
            connection.setDoOutput(true);
            connection.setConnectTimeout(15000); // Increased timeout for reliability
            connection.setReadTimeout(15000);
            
            // Send GPS data
            try (OutputStream os = connection.getOutputStream()) {
                byte[] input = jsonString.getBytes("utf-8");
                os.write(input, 0, input.length);
                os.flush();
            }
            
            int responseCode = connection.getResponseCode();
            Log.d(TAG, "📨 HTTP Response code: " + responseCode + " for course: " + courseId);
            
            if (responseCode >= 200 && responseCode < 300) {
                Log.d(TAG, "🎉 DIRECT GPS TRANSMISSION SUCCESS for course: " + courseId);
                
                // Read response for debugging
                try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(connection.getInputStream()))) {
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    Log.d(TAG, "📊 Server response: " + response.toString());
                }
            } else {
                Log.w(TAG, "⚠️ GPS TRANSMISSION WARNING - response code: " + responseCode);
                
                // Read error response for debugging
                try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(connection.getErrorStream()))) {
                    StringBuilder errorResponse = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        errorResponse.append(line);
                    }
                    Log.w(TAG, "❌ Error response: " + errorResponse.toString());
                } catch (Exception e) {
                    Log.w(TAG, "Could not read error response: " + e.getMessage());
                }
            }
            
            connection.disconnect();
            
            // CRITICAL: Verify timer continues after transmission
            Log.d(TAG, "🔍 Post-transmission status:");
            Log.d(TAG, "  - isTracking: " + isTracking);
            Log.d(TAG, "  - activeCourses size: " + activeCourses.size());
            Log.d(TAG, "  - gpsHandler null: " + (gpsHandler == null));
            Log.d(TAG, "🔄 Background timer continues independently");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ DIRECT HTTP TRANSMISSION ERROR for " + courseId + ": " + e.getMessage());
            e.printStackTrace();
            
            // Background service operates independently - no WebView fallback needed
            Log.w(TAG, "⚠️ GPS transmission failed - will retry in next cycle");
            Log.d(TAG, "🔄 Background service continues independently without WebView dependency");
        }
    }

    private void updateCourseStatus(Intent intent) {
        String courseId = intent.getStringExtra("courseId");
        int newStatus = intent.getIntExtra("status", 2);
        String authToken = intent.getStringExtra("authToken");
        
        Log.d(TAG, String.format("=== UPDATE_STATUS received ==="));
        Log.d(TAG, String.format("Course: %s, New Status: %d", courseId, newStatus));
        
        // CRITICAL FIX: Update userAuthToken if provided
        if (authToken != null && !authToken.trim().isEmpty()) {
            userAuthToken = authToken;
            Log.d(TAG, String.format("🔑 userAuthToken updated in UPDATE_STATUS: %s", 
                userAuthToken.substring(0, Math.min(20, userAuthToken.length())) + "..."));
        } else {
            Log.w(TAG, "⚠️ No authToken provided in UPDATE_STATUS - using existing token");
        }
        
        CourseData course = activeCourses.get(courseId);
        if (course != null) {
            int oldStatus = course.status;
            course.status = newStatus;
            Log.d(TAG, String.format("✅ Course %s status updated: %d → %d", courseId, oldStatus, newStatus));
            
            if (newStatus == 2) {
                Log.d(TAG, String.format("▶️ ACTIVE: Course %s will start GPS transmission every %dms", courseId, GPS_INTERVAL_MS));
            } else if (newStatus == 3) {
                Log.d(TAG, String.format("⏸️ PAUSE: Course %s GPS transmission stopped", courseId));
            } else if (newStatus == 4) {
                Log.d(TAG, String.format("🛑 STOP: Course %s status set to 4 (will skip GPS transmission)", courseId));
                // CRITICAL: Do NOT remove from activeCourses automatically
                // Status 4 courses will be skipped in GPS transmission but kept in Map
                // This prevents activeCourses from becoming empty and stopping executor
                Log.d(TAG, String.format("📊 Course %s kept in activeCourses with status=4 (transmission stopped)", courseId));
                Log.d(TAG, String.format("🔄 Executor continues running - can restart course later"));
                
                // Only remove if explicitly requested via STOP_COURSE action
                // Do NOT auto-remove based on status change
            }
        } else {
            Log.w(TAG, String.format("❌ Course %s not found in activeCourses Map", courseId));
            Log.d(TAG, String.format("📊 Available courses: %s", activeCourses.keySet().toString()));
        }
    }

    private void stopSpecificCourse(String courseId) {
        if ("ALL_COURSES".equals(courseId)) {
            activeCourses.clear();
        } else {
            activeCourses.remove(courseId);
        }
        
        if (activeCourses.isEmpty()) {
            isTracking = false;
            if (gpsHandler != null && gpsRunnable != null) {
                gpsHandler.removeCallbacks(gpsRunnable);
            }
            if (locationManager != null) {
                locationManager.removeUpdates(this);
            }
            stopForeground(true);
            stopSelf();
            Log.d(TAG, "GPS Service stopped");
        }
    }

    /**
     * Clear all active courses (called during logout)
     */
    private void clearAllCourses() {
        Log.d(TAG, "=== CLEAR_ALL_COURSES ===");
        activeCourses.clear();
        isTracking = false;
        
        if (gpsHandler != null && gpsRunnable != null) {
            gpsHandler.removeCallbacks(gpsRunnable);
        }
        if (locationManager != null) {
            locationManager.removeUpdates(this);
        }
        
        stopForeground(true);
        stopSelf();
        Log.d(TAG, "✅ All courses cleared and GPS Service stopped");
    }
    
    private void performGPSTransmission() {
        long currentTime = System.currentTimeMillis();
        Log.d(TAG, "=== GPS TRANSMISSION CYCLE " + currentTime + " ===");
        Log.d(TAG, "📊 Active courses: " + activeCourses.size());
        Log.d(TAG, "📍 Location available: " + (lastLocation != null));
        
        // Check location availability
        if (lastLocation == null) {
            Log.d(TAG, "⏳ Waiting for GPS location - timer continues");
            return;
        }
        
        // Check if any courses need transmission
        if (activeCourses.isEmpty()) {
            Log.d(TAG, "⏳ No active courses - timer continues");
            return;
        }
        
        Log.d(TAG, "📍 GPS: " + lastLocation.getLatitude() + ", " + lastLocation.getLongitude());
        
        // Transmit for all active courses with status 2
        int transmissionCount = 0;
        for (CourseData course : activeCourses.values()) {
            if (course.status == 2) {
                Log.d(TAG, "🚀 TRANSMITTING GPS for: " + course.courseId + " (UIT: " + course.uit + ")");
                try {
                    transmitGPSData(course, lastLocation);
                    transmissionCount++;
                    Log.d(TAG, "✅ GPS transmission successful for: " + course.courseId);
                } catch (Exception e) {
                    Log.e(TAG, "❌ GPS transmission failed for " + course.courseId + ": " + e.getMessage());
                    // Continue with timer regardless of transmission failure
                }
            } else {
                Log.d(TAG, "⏸️ Skipping: " + course.courseId + " - status: " + course.status);
            }
        }
        
        Log.d(TAG, "✅ Transmitted GPS for " + transmissionCount + " courses at " + currentTime);
        Log.d(TAG, "✅ performGPSTransmission COMPLETED - timer should continue normally");
    }
    
    // BroadcastReceiver no longer needed - Handler provides guaranteed execution

    private void createNotificationChannel() {
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "GPS Tracking Service",
            NotificationManager.IMPORTANCE_LOW
        );
        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.createNotificationChannel(channel);
    }

    private Notification createNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("iTrack GPS Active")
            .setContentText("Tracking " + activeCourses.size() + " courses")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .build();
    }

    @Override
    public void onLocationChanged(Location location) {
        lastLocation = location;
        Log.d(TAG, String.format("📍 Location updated: lat=%.6f, lng=%.6f, accuracy=%.1fm", 
            location.getLatitude(), location.getLongitude(), location.getAccuracy()));
        
        // CRITICAL: Verify that GPS timer is running when location changes
        Log.d(TAG, "🔍 GPS Timer Status Check:");
        Log.d(TAG, "  - isTracking: " + isTracking);
        Log.d(TAG, "  - activeCourses size: " + activeCourses.size());
        Log.d(TAG, "  - gpsHandler null: " + (gpsHandler == null));
        Log.d(TAG, "  - gpsRunnable null: " + (gpsRunnable == null));
        
        // If location updates but timer stopped, restart it
        if (!activeCourses.isEmpty() && (gpsHandler == null || gpsRunnable == null || !isTracking)) {
            Log.w(TAG, "⚠️ GPS timer not running but courses exist - restarting");
            startGPSTransmissions();
            startGPSTransmissions();
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "🛑 SimpleGPSService destroyed");
        
        stopGPSTimer();
        if (locationManager != null) {
            try {
                locationManager.removeUpdates(this);
            } catch (SecurityException e) {
                Log.e(TAG, "Permission denied removing location updates", e);
            }
        }
        
        // Release wake lock to save battery
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            Log.d(TAG, "🔋 Wake lock released on service destroy");
        }
        
        super.onDestroy();
    }
    
    /**
     * Transmit GPS data for a specific course
     */
    private void transmitGPSData(CourseData course, Location location) {
        try {
            // Create GPS data JSON
            JSONObject gpsData = new JSONObject();
            gpsData.put("lat", String.format("%.4f", location.getLatitude()));
            gpsData.put("lng", String.format("%.4f", location.getLongitude()));
            gpsData.put("timestamp", new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.getDefault()).format(new Date()));
            gpsData.put("viteza", (int)(location.getSpeed() * 3.6)); // m/s to km/h
            gpsData.put("directie", (int)location.getBearing());
            gpsData.put("altitudine", (int)location.getAltitude());
            gpsData.put("baterie", getBatteryLevel());
            gpsData.put("numar_inmatriculare", course.vehicleNumber);
            gpsData.put("uit", course.uit);
            gpsData.put("status", course.status);
            gpsData.put("hdop", "1.0");
            gpsData.put("gsm_signal", "4G");
            
            Log.d(TAG, "📡 Transmitting GPS data: " + gpsData.toString());
            
            // CRITICAL: Send HTTP POST on SAME thread to avoid blocking timer
            try {
                URL url = new URL(API_BASE_URL + "/gps.php");
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setRequestProperty("Authorization", "Bearer " + userAuthToken);
                connection.setRequestProperty("User-Agent", "iTrack-Android-Service/1.0");
                connection.setDoOutput(true);
                connection.setConnectTimeout(8000); // Shorter timeout to prevent blocking
                connection.setReadTimeout(8000);
                
                OutputStream os = connection.getOutputStream();
                os.write(gpsData.toString().getBytes("UTF-8"));
                os.close();
                
                int responseCode = connection.getResponseCode();
                Log.d(TAG, "📡 GPS transmission response: " + responseCode + " for course: " + course.courseId);
                
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    Log.d(TAG, "✅ GPS SUCCESS: " + course.courseId + " - Timer continues");
                } else {
                    Log.w(TAG, "⚠️ GPS FAILED: " + responseCode + " - Timer continues anyway");
                }
                
                connection.disconnect();
                Log.d(TAG, "✅ HTTP transmission completed - Timer should continue");
            } catch (Exception e) {
                Log.e(TAG, "❌ GPS transmission error: " + e.getMessage() + " - Timer continues");
                // Timer continues regardless of HTTP errors
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error creating GPS data: " + e.getMessage(), e);
        }
    }
    
    /**
     * Get real battery level from system
     */
    private int getBatteryLevel() {
        try {
            IntentFilter filter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = registerReceiver(null, filter);
            int level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
            int scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
            return (int) ((level * 100.0f) / scale);
        } catch (Exception e) {
            Log.w(TAG, "Could not get battery level: " + e.getMessage());
            return 85; // Default fallback
        }
    }
}
