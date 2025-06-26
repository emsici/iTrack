package com.euscagency.itrack;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
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
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

// Removed OkHttp dependencies - using CapacitorHttp instead

public class SimpleGPSService extends Service implements LocationListener {
    private static final String TAG = "SimpleGPSService";
    private static final int NOTIFICATION_ID = 1001;
    private static final String CHANNEL_ID = "gps_service_channel";
    private static final long GPS_INTERVAL_MS = 5000; // 5 seconds
    private static final String API_BASE_URL = "https://www.euscagency.com/etsm3/platforme/transport/apk";

    private LocationManager locationManager;
    private Handler gpsHandler;
    private Runnable gpsRunnable;
    private Location lastLocation;
    private boolean isTracking = false;
    private Map<String, CourseData> activeCourses = new HashMap<>();
    private String userAuthToken;
    private PowerManager.WakeLock wakeLock;
    // Removed OkHttpClient - using CapacitorHttp through WebView

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
        Log.d(TAG, "✅ Foreground service started in onCreate()");
        
        // Acquire wake lock to prevent CPU sleep
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "iTrack:GPSWakeLock");
            if (!wakeLock.isHeld()) {
                wakeLock.acquire();
                Log.d(TAG, "🔋 Wake lock acquired for continuous background operation");
            }
        }
        
        initializeGPSHandler();
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

    private void initializeGPSHandler() {
        gpsHandler = new Handler(Looper.getMainLooper());
        gpsRunnable = new Runnable() {
            @Override
            public void run() {
                Log.d(TAG, String.format("🔄 GPS Timer TICK: location=%s, activeCourses=%d", 
                    lastLocation != null ? "OK" : "NULL", activeCourses.size()));
                    
                if (lastLocation != null && !activeCourses.isEmpty()) {
                    Log.d(TAG, String.format("📡 Processing %d active courses", activeCourses.size()));
                    int transmitted = 0;
                    for (CourseData course : activeCourses.values()) {
                        Log.d(TAG, String.format("📋 Course %s status: %d", course.courseId, course.status));
                        if (course.status == 2) {
                            Log.d(TAG, String.format("📍 TRANSMITTING GPS for course: %s", course.courseId));
                            transmitGPSData(course, lastLocation);
                            transmitted++;
                        }
                    }
                    Log.d(TAG, String.format("✅ Transmitted GPS for %d courses", transmitted));
                } else {
                    Log.w(TAG, String.format("⚠️ GPS Timer SKIP: location=%s, courses=%d", 
                        lastLocation != null ? "available" : "null", activeCourses.size()));
                }
                
                // CRITICAL: Continue timer as long as there are active courses
                if (!activeCourses.isEmpty()) {
                    gpsHandler.postDelayed(this, GPS_INTERVAL_MS);
                    Log.d(TAG, "🔄 GPS Timer continues - next transmission in 5 seconds");
                } else {
                    Log.d(TAG, "🛑 GPS Timer stopped - no active courses remaining");
                    isTracking = false;
                }
            }
        };
    }

    private void startGPSTransmissions() {
        Log.d(TAG, "🚀 STARTING GPS TRANSMISSIONS");
        Log.d(TAG, "📊 Active courses: " + activeCourses.size());
        Log.d(TAG, "⏰ GPS interval: " + (GPS_INTERVAL_MS/1000) + " seconds");
        
        // Stop any existing timer first
        if (gpsHandler != null && gpsRunnable != null) {
            gpsHandler.removeCallbacks(gpsRunnable);
        }
        
        isTracking = true;
        if (gpsHandler != null && gpsRunnable != null) {
            gpsHandler.postDelayed(gpsRunnable, GPS_INTERVAL_MS);
            Log.d(TAG, "✅ GPS Timer scheduled - transmissions will begin");
        } else {
            Log.e(TAG, "❌ GPS Handler or Runnable is null!");
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

            sendGPSRequest(gpsData);
            Log.d(TAG, "GPS transmitted for UIT: " + course.uit);
            
        } catch (Exception e) {
            Log.e(TAG, "Error transmitting GPS", e);
        }
    }

    private void sendGPSRequest(JSONObject gpsData) {
        Log.d(TAG, "🚀 TRANSMITTING GPS DATA via CapacitorHttp");
        Log.d(TAG, "📊 GPS Data size: " + gpsData.toString().length() + " chars");
        Log.d(TAG, "🔑 Auth token available: " + (userAuthToken != null ? "YES" : "NO"));
        
        // Convert JSONObject to string for CapacitorHttp
        String jsonString = gpsData.toString();
        Log.d(TAG, "📡 Complete GPS payload: " + jsonString);
        
        // CRITICAL: Use CapacitorHttp through WebView - same as JavaScript
        MainActivity.runOnMainThread(() -> {
            try {
                String jsCode = "window.sendGPSViaCapacitor('" + jsonString.replace("'", "\\'") + "', '" + userAuthToken + "')";
                Log.d(TAG, "🎯 Executing JavaScript GPS transmission for course: " + course.courseId);
                
                MainActivity.getInstance().getWebView().evaluateJavascript(jsCode, result -> {
                    Log.d(TAG, "✅ GPS RESULT for " + course.courseId + ": " + result);
                    if (result != null && result.contains("true")) {
                        Log.d(TAG, "🎉 GPS SUCCESS for course: " + course.courseId);
                    } else {
                        Log.e(TAG, "❌ GPS FAILED for course: " + course.courseId + " - " + result);
                    }
                });
            } catch (Exception e) {
                Log.e(TAG, "❌ GPS transmission exception for " + course.courseId + ": " + e.getMessage());
                e.printStackTrace();
            }
        });
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
                Log.d(TAG, String.format("🛑 STOP: Course %s will be removed from activeCourses", courseId));
                // Șterge din activeCourses după 2 secunde
                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    activeCourses.remove(courseId);
                    Log.d(TAG, String.format("🗑️ Course %s removed from activeCourses", courseId));
                    Log.d(TAG, String.format("📊 Remaining active courses: %d", activeCourses.size()));
                    
                    if (activeCourses.isEmpty()) {
                        Log.d(TAG, "🏁 No more active courses - stopping GPS service");
                        stopSelf();
                    }
                }, 2000);
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
        Log.d(TAG, "Location updated: " + location.getLatitude() + ", " + location.getLongitude());
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
    
    private void stopGPSTimer() {
        Log.d(TAG, "Stopping GPS transmissions");
        if (gpsHandler != null && gpsRunnable != null) {
            gpsHandler.removeCallbacks(gpsRunnable);
        }
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