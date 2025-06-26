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
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

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
        if (intent == null) return START_STICKY;
        
        String action = intent.getAction();
        Log.d(TAG, "onStartCommand - Action: " + action);

        if ("START_TRACKING".equals(action)) {
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
        String authToken = intent.getStringExtra("authToken");
        
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
            
            Log.d(TAG, "⏰ Starting GPS transmissions timer");
            startGPSTransmissions();
            
            Log.d(TAG, "✅ GPS SYSTEM FULLY INITIALIZED");
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
        
        // Cancel any existing timer
        stopGPSTimer();
        
        // Create background repeating runnable
        gpsRunnable = new Runnable() {
            @Override
            public void run() {
                Log.d(TAG, "📡 BACKGROUND GPS Timer executing on thread: " + Thread.currentThread().getName());
                Log.d(TAG, "🔄 forceTimerContinuous: " + forceTimerContinuous);
                Log.d(TAG, "📊 activeCourses.size(): " + activeCourses.size());
                
                if (forceTimerContinuous && !activeCourses.isEmpty()) {
                    Log.d(TAG, "✅ Performing BACKGROUND GPS transmission");
                    performGPSTransmission();
                    
                    // Schedule next execution on background thread
                    gpsHandler.postDelayed(this, GPS_INTERVAL_MS);
                    Log.d(TAG, "🔄 Next BACKGROUND cycle scheduled in " + (GPS_INTERVAL_MS/1000) + "s");
                } else {
                    Log.w(TAG, "🛑 Stopping BACKGROUND GPS - conditions not met");
                    Log.w(TAG, "   forceTimerContinuous: " + forceTimerContinuous);
                    Log.w(TAG, "   activeCourses empty: " + activeCourses.isEmpty());
                }
            }
        };
        
        // Start the first execution on background thread
        gpsHandler.post(gpsRunnable);
        Log.d(TAG, "✅ BACKGROUND GPS Timer started on dedicated thread");
    }
    
    private void stopGPSTimer() {
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

    private void transmitGPSData(CourseData course, Location location) {
        try {
            JSONObject gpsData = new JSONObject();
            
            // Log data construction process
            Log.d(TAG, "🔍 ANDROID GPS DATA CONSTRUCTION:");
            
            double lat = Double.parseDouble(String.format(Locale.US, "%.4f", location.getLatitude()));
            double lng = Double.parseDouble(String.format(Locale.US, "%.4f", location.getLongitude()));
            
            gpsData.put("lat", lat);
            gpsData.put("lng", lng);
            gpsData.put("timestamp", new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(new Date()));
            gpsData.put("viteza", location.hasSpeed() ? (int)(location.getSpeed() * 3.6) : 0);
            gpsData.put("directie", location.hasBearing() ? (int)location.getBearing() : 0);
            gpsData.put("altitudine", location.hasAltitude() ? (int)location.getAltitude() : 0);
            gpsData.put("baterie", getBatteryLevel());
            gpsData.put("numar_inmatriculare", course.vehicleNumber);
            gpsData.put("uit", course.uit);
            gpsData.put("status", course.status);
            gpsData.put("hdop", 1.2);
            gpsData.put("gsm_signal", 4);
            
            Log.d(TAG, "Field types constructed:");
            Log.d(TAG, "- lat: " + lat + " (type: double)");
            Log.d(TAG, "- lng: " + lng + " (type: double)");
            Log.d(TAG, "- status: " + course.status + " (int)");
            Log.d(TAG, "Complete JSON object: " + gpsData.toString());

            sendGPSRequest(gpsData, course.courseId);
            Log.d(TAG, "GPS transmitted for UIT: " + course.uit);
            
        } catch (Exception e) {
            Log.e(TAG, "Error transmitting GPS", e);
        }
    }

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
        
        Log.d(TAG, String.format("=== UPDATE_STATUS received ==="));
        Log.d(TAG, String.format("Course: %s, New Status: %d", courseId, newStatus));
        
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
        Log.d(TAG, "=== HANDLER GPS CYCLE " + currentTime + " ===");
        
        if (lastLocation != null && !activeCourses.isEmpty() && forceTimerContinuous) {
            Log.d(TAG, "✅ CONDITIONS MET - Transmitting GPS for " + activeCourses.size() + " courses");
            for (CourseData course : activeCourses.values()) {
                if (course.status == 2) {
                    Log.d(TAG, "📡 TRANSMIT: " + course.courseId + " at " + currentTime);
                    transmitGPSData(course, lastLocation);
                }
            }
        } else {
            Log.w(TAG, "❌ SKIP: location=" + (lastLocation != null) + 
                  ", courses=" + activeCourses.size() + 
                  ", continuous=" + forceTimerContinuous);
        }
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
    

    
    private int getBatteryLevel() {
        try {
            IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = registerReceiver(null, ifilter);
            
            if (batteryStatus != null) {
                int level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
                int scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
                
                if (level != -1 && scale != -1) {
                    int batteryPct = Math.round((level / (float) scale) * 100);
                    Log.d(TAG, "Battery level from sensors: " + batteryPct + "%");
                    return batteryPct;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to get battery level", e);
        }
        
        // Fallback if battery info unavailable
        Log.d(TAG, "Using fallback battery level: 85%");
        return 85;
    }
}