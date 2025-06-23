package com.euscagency.itrack;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
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
        Log.d(TAG, "SimpleGPSService created");
        
        createNotificationChannel();
        locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        // Removed OkHttpClient - using CapacitorHttp through WebView
        initializeGPSHandler();
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

        return START_STICKY;
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
        
        if (userAuthToken == null) {
            userAuthToken = authToken;
        }

        CourseData courseData = new CourseData(courseId, uit, status, vehicleNumber);
        activeCourses.put(courseId, courseData);
        
        Log.d(TAG, String.format("✅ Course %s added to activeCourses Map", courseId));
        Log.d(TAG, String.format("📊 activeCourses Map size: %d", activeCourses.size()));
        Log.d(TAG, String.format("📊 activeCourses contains: %s", activeCourses.keySet().toString()));
        Log.d(TAG, String.format("🎯 Course %s status: %d (GPS will transmit: %s)", 
            courseId, status, status == 2 ? "YES" : "NO"));

        if (!isTracking) {
            Log.d(TAG, "Starting foreground service");
            startForeground(NOTIFICATION_ID, createNotification());
            startLocationUpdates();
            isTracking = true;
            startGPSTransmissions();
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
                if (lastLocation != null && !activeCourses.isEmpty()) {
                    Log.d(TAG, String.format("🔄 GPS Timer: Checking %d active courses", activeCourses.size()));
                    for (CourseData course : activeCourses.values()) {
                        Log.d(TAG, String.format("📡 Course %s status: %d (transmit: %s)", 
                            course.courseId, course.status, course.status == 2 ? "YES" : "NO"));
                        if (course.status == 2) {
                            Log.d(TAG, String.format("📍 Transmitting GPS for active course: %s", course.courseId));
                            transmitGPSData(course, lastLocation);
                        }
                    }
                } else {
                    Log.d(TAG, String.format("⏸️ GPS Timer: No location (%s) or no active courses (%d)", 
                        lastLocation != null ? "available" : "null", activeCourses.size()));
                }
                
                if (isTracking && !activeCourses.isEmpty()) {
                    gpsHandler.postDelayed(this, GPS_INTERVAL_MS);
                } else {
                    Log.d(TAG, "🛑 GPS Timer stopped: tracking=" + isTracking + ", courses=" + activeCourses.size());
                }
            }
        };
    }

    private void startGPSTransmissions() {
        Log.d(TAG, "Starting GPS transmissions");
        gpsHandler.postDelayed(gpsRunnable, GPS_INTERVAL_MS);
    }

    private void transmitGPSData(CourseData course, Location location) {
        try {
            JSONObject gpsData = new JSONObject();
            gpsData.put("lat", String.format(Locale.US, "%.6f", location.getLatitude()));
            gpsData.put("lng", String.format(Locale.US, "%.6f", location.getLongitude()));
            gpsData.put("timestamp", new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(new Date()));
            gpsData.put("viteza", location.hasSpeed() ? (int)(location.getSpeed() * 3.6) : 0);
            gpsData.put("directie", location.hasBearing() ? (int)location.getBearing() : 0);
            gpsData.put("altitudine", location.hasAltitude() ? (int)location.getAltitude() : 0);
            gpsData.put("baterie", 100);
            gpsData.put("numar_inmatriculare", course.vehicleNumber);
            gpsData.put("uit", course.uit);
            gpsData.put("status", String.valueOf(course.status));
            gpsData.put("hdop", "1.0");
            gpsData.put("gsm_signal", "4G");

            sendGPSRequest(gpsData);
            Log.d(TAG, "GPS transmitted for UIT: " + course.uit);
            
        } catch (Exception e) {
            Log.e(TAG, "Error transmitting GPS", e);
        }
    }

    private void sendGPSRequest(JSONObject gpsData) {
        Log.d(TAG, "🚀 USING CAPACITOR HTTP for GPS transmission");
        
        // Convert JSONObject to string for CapacitorHttp
        String jsonString = gpsData.toString();
        Log.d(TAG, "📊 GPS Data: " + jsonString);
        
        // Use CapacitorHttp through WebView - same as JavaScript
        MainActivity.runOnMainThread(() -> {
            MainActivity.getInstance().getWebView().evaluateJavascript(
                "window.sendGPSViaCapacitor('" + jsonString.replace("'", "\\'") + "', '" + userAuthToken + "')",
                result -> {
                    Log.d(TAG, "✅ CapacitorHttp GPS result: " + result);
                }
            );
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
}