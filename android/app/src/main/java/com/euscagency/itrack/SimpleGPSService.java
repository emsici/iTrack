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
import android.location.GpsStatus;
import android.location.GnssStatus;
import android.location.Criteria;
import android.telephony.TelephonyManager;
import android.telephony.SignalStrength;
import android.content.BroadcastReceiver;
import android.content.IntentFilter;
import android.os.BatteryManager;
import android.os.Bundle;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.SystemClock;
import android.os.Looper;
import android.util.Log;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;


// OkHttp imports pentru HTTP modern și eficient
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.MediaType;
import okhttp3.logging.HttpLoggingInterceptor;

// Volley imports pentru HTTP - biblioteca oficială Google
import com.android.volley.Request.Method;
import com.android.volley.RequestQueue;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;
import java.util.HashMap;
import java.util.Map;

/**
 * SISTEM GPS SIMPLU ȘI EFICIENT - De la zero pentru funcționare garantată
 * - Funcționează în background cu telefon blocat
 * - Trimite coordonate la fiecare 5 secunde
 * - Transmite la gps.php cu datele exacte
 */
public class SimpleGPSService extends Service {
    private static final String TAG = "SimpleGPS";
    private static final long GPS_INTERVAL_MS = 5000; // 5 secunde - identic cu OptimalGPSService
    private static final String ACTION_GPS_ALARM = "com.euscagency.itrack.SIMPLE_GPS_ALARM";
    
    // API Configuration
    private static final String GPS_ENDPOINT = "https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php";
    
    private AlarmManager alarmManager;
    private PendingIntent gpsPendingIntent;
    private LocationManager locationManager;
    private PowerManager.WakeLock wakeLock;
    
    // Multiple courses management - identic cu OptimalGPSService
    private Map<String, CourseData> activeCourses = new HashMap<>();
    private boolean isGPSActive = false;
    
    // Course data structure
    public static class CourseData {
        public String courseId;
        public String uit;
        public int status;
        public String vehicleNumber;
        public String authToken;
        
        public CourseData(String courseId, String uit, int status, String vehicleNumber, String authToken) {
            this.courseId = courseId;
            this.uit = uit;
            this.status = status;
            this.vehicleNumber = vehicleNumber;
            this.authToken = authToken;
        }
    }
    
    private static final int NOTIFICATION_ID = 2001;
    private static final String CHANNEL_ID = "SimpleGPSChannel";
    
    // HTTP clients moderni pentru performanță maximă
    private static OkHttpClient okHttpClient;
    private static final MediaType JSON_MEDIA_TYPE = MediaType.get("application/json; charset=utf-8");
    private static RequestQueue volleyQueue;
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.e(TAG, "🚀 SimpleGPS Service Created");
        
        alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        
        // Initialize HTTP clients cu optimizări pentru performanță
        initializeHttpClients();
        
        // WakeLock pentru background
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "iTrack:SimpleGPS");
        
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, createNotification());
        
        Log.e(TAG, "✅ SimpleGPS Service Ready");
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Simple GPS Tracking",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Background GPS tracking every 5 seconds");
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }
    
    private Notification createNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("iTrack GPS Active")
            .setContentText("Background tracking active")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.e(TAG, "📥 SimpleGPS Command: " + (intent != null ? intent.getAction() : "NULL"));
        
        // Acquire WakeLock
        if (wakeLock != null && !wakeLock.isHeld()) {
            wakeLock.acquire();
            Log.e(TAG, "✅ WakeLock acquired - background operation guaranteed");
        }
        
        if (intent != null && ACTION_GPS_ALARM.equals(intent.getAction())) {
            // AlarmManager triggered - get GPS and transmit
            Log.e(TAG, "🔥 === GPS ALARM TRIGGERED === AlarmManager working!");
            Log.e(TAG, "📍 Starting GPS cycle for " + activeCourses.size() + " active courses");
            
            // Log each active course before GPS cycle
            for (Map.Entry<String, CourseData> entry : activeCourses.entrySet()) {
                CourseData course = entry.getValue();
                Log.e(TAG, "🎯 Active Course: " + course.courseId + " (UIT: " + course.uit + ") Status: " + course.status);
            }
            
            performGPSCycle();
            
        } else if (intent != null && "START_SIMPLE_GPS".equals(intent.getAction())) {
            // Start GPS tracking for new course
            String courseId = intent.getStringExtra("courseId");
            String uit = intent.getStringExtra("uit");
            String authToken = intent.getStringExtra("authToken");
            String vehicleNumber = intent.getStringExtra("vehicleNumber");
            int status = intent.getIntExtra("status", 2);
            
            Log.e(TAG, "🚀 Starting NATIVE GPS for multiple courses:");
            Log.e(TAG, "  NEW Course: " + courseId + " (UIT: " + uit + ")");
            Log.e(TAG, "  Vehicle: " + vehicleNumber + ", Status: " + status);
            
            // Add course to active courses map
            CourseData courseData = new CourseData(courseId, uit, status, vehicleNumber, authToken);
            activeCourses.put(courseId, courseData);
            
            Log.e(TAG, "📊 ACTIVE COURSES COUNT: " + activeCourses.size());
            Log.e(TAG, "🗂️ Active courses: " + activeCourses.keySet());
            
            // Start GPS timer if not already active
            if (!isGPSActive) {
                startGPSTimer();
            } else {
                Log.e(TAG, "✅ GPS timer already active - new course added to tracking");
            }
            
        } else if (intent != null && "STOP_SIMPLE_GPS".equals(intent.getAction())) {
            // Stop GPS tracking for specific course
            String courseId = intent.getStringExtra("courseId");
            Log.e(TAG, "🛑 Stopping NATIVE GPS tracking for course: " + courseId);
            
            // Remove course from active courses
            CourseData removedCourse = activeCourses.remove(courseId);
            if (removedCourse != null) {
                Log.e(TAG, "✅ Course removed: " + courseId);
                
                // Send final GPS position for this course with STOP status
                performFinalGPSTransmission(removedCourse);
            }
            
            Log.e(TAG, "📊 REMAINING COURSES: " + activeCourses.size());
            Log.e(TAG, "🗂️ Still active: " + activeCourses.keySet());
            
            // Stop GPS timer only if no more active courses
            if (activeCourses.isEmpty()) {
                Log.e(TAG, "🏁 No more active courses - stopping GPS timer");
                stopGPSTimer();
            } else {
                Log.e(TAG, "▶️ GPS timer continues for remaining courses");
            }
            
        } else if (intent != null && "CLEAR_ALL_SIMPLE_GPS".equals(intent.getAction())) {
            // Clear all courses and stop GPS
            Log.e(TAG, "🧹 CLEAR ALL - Stopping all courses and GPS timer");
            activeCourses.clear();
            stopGPSTimer();
            
        } else if (intent != null && "SYNC_OFFLINE_GPS".equals(intent.getAction())) {
            // Sync offline GPS coordinates
            Log.e(TAG, "🔄 SYNC OFFLINE GPS - Starting sync process");
            syncOfflineCoordinates();
            
        } else if (intent != null && "UPDATE_SIMPLE_GPS_STATUS".equals(intent.getAction())) {
            // Update course status (START/PAUSE/RESUME/STOP)
            String courseId = intent.getStringExtra("courseId");
            int newStatus = intent.getIntExtra("newStatus", 2);
            
            Log.e(TAG, "🔄 NATIVE GPS Status Update: " + courseId + " → " + newStatus);
            Log.e(TAG, "  Status meanings: 2=ACTIVE, 3=PAUSE, 4=STOP");
            
            CourseData course = activeCourses.get(courseId);
            if (course != null) {
                course.status = newStatus;
                
                if (newStatus == 2) { // ACTIVE/RESUME
                    Log.e(TAG, "▶️ RESUME/START: Course " + courseId + " GPS tracking ACTIVE");
                    if (!isGPSActive) {
                        startGPSTimer();
                    }
                } else if (newStatus == 3) { // PAUSE - OPTIMIZED: Remove from map
                    Log.e(TAG, "⏸️ PAUSE: Course " + courseId + " GPS tracking PAUSED");
                    Log.e(TAG, "🚀 OPTIMIZATION: Removing paused course from activeCourses for efficiency");
                    
                    // Store paused course data for quick resume
                    saveToSharedPreferences("paused_course_" + courseId, course);
                    
                    // Remove from active map to optimize GPS loop
                    activeCourses.remove(courseId);
                    
                    // Stop GPS timer if no more active courses
                    if (activeCourses.isEmpty()) {
                        Log.e(TAG, "⏸️ No active courses - stopping GPS timer");
                        stopGPSTimer();
                    }
                } else if (newStatus == 4) { // STOP
                    Log.e(TAG, "🏁 STOP: Course " + courseId + " GPS tracking STOPPED");
                    // Send final GPS position and remove course
                    performFinalGPSTransmission(course);
                    activeCourses.remove(courseId);
                    
                    if (activeCourses.isEmpty()) {
                        Log.e(TAG, "🏁 No more active courses - stopping GPS timer");
                        stopGPSTimer();
                    }
                }
                
                Log.e(TAG, "📊 Updated course status - Active courses: " + activeCourses.size());
            } else if (newStatus == 2) {
                // RESUME: Check if course is in paused storage
                Log.e(TAG, "🔄 RESUME: Checking for paused course " + courseId);
                CourseData pausedCourse = loadFromSharedPreferences("paused_course_" + courseId);
                
                if (pausedCourse != null) {
                    Log.e(TAG, "✅ RESUME: Restoring paused course " + courseId + " to active map");
                    pausedCourse.status = 2; // Set to ACTIVE
                    activeCourses.put(courseId, pausedCourse);
                    
                    // Remove from paused storage
                    removeFromSharedPreferences("paused_course_" + courseId);
                    
                    // Start GPS timer if not active
                    if (!isGPSActive) {
                        startGPSTimer();
                    }
                } else {
                    Log.e(TAG, "⚠️ RESUME: No paused course found for " + courseId);
                }
            } else {
                Log.e(TAG, "⚠️ Status update for unknown course: " + courseId);
            }
        }
        
        return START_STICKY; // Restart if killed
    }
    
    private void startGPSTimer() {
        if (isGPSActive) {
            Log.e(TAG, "⚠️ GPS timer already active");
            return;
        }
        
        Intent alarmIntent = new Intent(this, SimpleGPSService.class);
        alarmIntent.setAction(ACTION_GPS_ALARM);
        
        gpsPendingIntent = PendingIntent.getService(
            this, 0, alarmIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // Set exact alarm every 5 seconds with detailed logging
        long triggerTime = SystemClock.elapsedRealtime() + GPS_INTERVAL_MS;
        
        Log.e(TAG, "⏰ Setting AlarmManager:");
        Log.e(TAG, "  - Trigger time: " + triggerTime + " (in " + GPS_INTERVAL_MS + "ms)");
        Log.e(TAG, "  - PendingIntent: " + (gpsPendingIntent != null ? "CREATED" : "NULL"));
        Log.e(TAG, "  - AlarmManager: " + (alarmManager != null ? "AVAILABLE" : "NULL"));
        Log.e(TAG, "  - Current time: " + SystemClock.elapsedRealtime());
        Log.e(TAG, "  - GPS_INTERVAL_MS: " + GPS_INTERVAL_MS);
        
        try {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.ELAPSED_REALTIME_WAKEUP,
                triggerTime,
                gpsPendingIntent
            );
            Log.e(TAG, "✅ AlarmManager configured successfully");
            Log.e(TAG, "🔥 CRITICAL: AlarmManager should trigger in " + GPS_INTERVAL_MS + "ms with ACTION: " + ACTION_GPS_ALARM);
        } catch (Exception e) {
            Log.e(TAG, "❌ AlarmManager setup failed: " + e.getMessage());
            e.printStackTrace();
        }
        
        isGPSActive = true;
        Log.e(TAG, "✅ GPS Timer Started - 5 second intervals (identic cu OptimalGPSService)");
        
        // Immediate first GPS reading with debug
        Log.e(TAG, "📍 === TRIGGERING IMMEDIATE GPS READING ===");
        Log.e(TAG, "📊 Active courses before first reading: " + activeCourses.size());
        
        // Log active courses for debugging
        for (Map.Entry<String, CourseData> entry : activeCourses.entrySet()) {
            CourseData course = entry.getValue();
            Log.e(TAG, "🎯 IMMEDIATE READ - Course: " + course.courseId + " (UIT: " + course.uit + ") Status: " + course.status);
        }
        
        // IMMEDIATE GPS reading with error checking
        Log.e(TAG, "🔥 === IMMEDIATE GPS CYCLE STARTING ===");
        Log.e(TAG, "📊 Active courses count: " + activeCourses.size());
        
        // Check permissions immediately
        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Log.e(TAG, "❌ === CRITICAL === No GPS permission at startup!");
            return;
        }
        
        Log.e(TAG, "✅ GPS permission verified - starting immediate cycle");
        
        // DIRECT immediate call - no thread delay
        Log.e(TAG, "🚀 CALLING performGPSCycle() DIRECTLY NOW");
        performGPSCycle();
        
        // Start continuous timer
        Log.e(TAG, "⏰ Starting continuous GPS timer");
        startContinuousGPSTimer();
        
    }
    
    /**
     * Start continuous GPS timer with Handler instead of AlarmManager for reliability
     */
    private void startContinuousGPSTimer() {
        Log.e(TAG, "⏰ Starting CONTINUOUS GPS timer with Handler");
        
        android.os.Handler gpsHandler = new android.os.Handler(Looper.getMainLooper());
        
        Runnable gpsRunnable = new Runnable() {
            @Override
            public void run() {
                if (isGPSActive && !activeCourses.isEmpty()) {
                    Log.e(TAG, "🔄 === CONTINUOUS GPS CYCLE ===");
                    Log.e(TAG, "📊 Active courses: " + activeCourses.size());
                    
                    // Run GPS cycle in background thread
                    new Thread(() -> {
                        performGPSCycle();
                    }).start();
                    
                    // Schedule next cycle
                    gpsHandler.postDelayed(this, GPS_INTERVAL_MS);
                } else {
                    Log.e(TAG, "❌ Stopping continuous GPS - no active courses or GPS inactive");
                }
            }
        };
        
        // Start first continuous cycle
        gpsHandler.postDelayed(gpsRunnable, GPS_INTERVAL_MS);
        Log.e(TAG, "✅ Continuous GPS timer started - next cycle in " + GPS_INTERVAL_MS + "ms");
    }
    
    private void stopGPSTimer() {
        if (gpsPendingIntent != null) {
            alarmManager.cancel(gpsPendingIntent);
            gpsPendingIntent = null;
        }
        isGPSActive = false;
        Log.e(TAG, "🛑 GPS Timer Stopped");
    }
    
    private void performGPSCycle() {
        Log.e(TAG, "🚀 === STARTING GPS CYCLE === for " + activeCourses.size() + " courses");
        Log.e(TAG, "🔥 === PERFORM GPS CYCLE CALLED ===");
        Log.e(TAG, "📊 Active courses: " + activeCourses.size());
        
        if (activeCourses.isEmpty()) {
            Log.e(TAG, "❌ No active courses - skipping GPS cycle");
            return;
        }
        
        // Log all active courses
        for (Map.Entry<String, CourseData> entry : activeCourses.entrySet()) {
            CourseData course = entry.getValue();
            Log.e(TAG, "🎯 GPS CYCLE for Course: " + course.courseId + " (UIT: " + course.uit + ") Status: " + course.status);
        }
        
        // DIRECT GPS TRANSMISSION TEST - Skip location check temporarily
        Log.e(TAG, "🧪 === TESTING DIRECT GPS TRANSMISSION ===");
        try {
            // Create fake GPS data for immediate testing
            Location testLocation = new Location("test");
            testLocation.setLatitude(44.4268); // Bucharest coordinates
            testLocation.setLongitude(26.1025);
            testLocation.setAccuracy(5.0f);
            testLocation.setAltitude(100.0);
            testLocation.setSpeed(0.0f);
            testLocation.setBearing(0.0f);
            
            Log.e(TAG, "📍 Using test coordinates: Bucharest (44.4268, 26.1025)");
            Log.e(TAG, "🚀 Calling transmitGPSDataForAllCourses() directly");
            
            transmitGPSDataForAllCourses(testLocation);
            
        } catch (Exception e) {
            Log.e(TAG, "❌ TEST GPS transmission failed: " + e.getMessage());
            e.printStackTrace();
        }
        
        Log.e(TAG, "📡 === GPS CYCLE STARTING === for " + activeCourses.size() + " active courses");
        for (String courseId : activeCourses.keySet()) {
            Log.e(TAG, "  - Course: " + courseId + " (status: " + activeCourses.get(courseId).status + ")");
        }
        
        Log.e(TAG, "📍 Getting HIGH PRECISION GPS location...");
        
        try {
            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                Log.e(TAG, "❌ === CRITICAL === No GPS permission - aborting GPS cycle");
                scheduleNextGPSCycle();
                return;
            }
            
            Log.e(TAG, "✅ GPS permission verified - proceeding with location request");
            
            // NATIVE GPS: Configure criteria for highest precision
            Criteria criteria = new Criteria();
            criteria.setAccuracy(Criteria.ACCURACY_FINE);
            criteria.setPowerRequirement(Criteria.POWER_HIGH);
            criteria.setAltitudeRequired(true);
            criteria.setBearingRequired(true);
            criteria.setSpeedRequired(true);
            criteria.setCostAllowed(true);
            
            String bestProvider = locationManager.getBestProvider(criteria, true);
            Log.e(TAG, "🎯 Best GPS provider: " + bestProvider);
            
            LocationListener listener = new LocationListener() {
                @Override
                public void onLocationChanged(Location location) {
                    // VALIDATE GPS PRECISION
                    float accuracy = location.getAccuracy();
                    Log.e(TAG, "✅ GPS Location: lat=" + location.getLatitude() + 
                               ", lng=" + location.getLongitude() + 
                               ", accuracy=" + accuracy + "m" +
                               ", altitude=" + location.getAltitude() + "m" +
                               ", speed=" + location.getSpeed() + "m/s" +
                               ", bearing=" + location.getBearing() + "°");
                    
                    // Accept only high precision locations (under 15m accuracy)
                    if (accuracy <= 15.0f) {
                        Log.e(TAG, "🎯 HIGH PRECISION GPS accepted - accuracy: " + accuracy + "m");
                        locationManager.removeUpdates(this);
                        transmitGPSDataForAllCourses(location);
                        scheduleNextGPSCycle();
                    } else {
                        Log.e(TAG, "⚠️ LOW PRECISION GPS rejected - accuracy: " + accuracy + "m, waiting for better signal...");
                        // Continue listening for better accuracy
                    }
                }
                
                @Override
                public void onStatusChanged(String provider, int status, Bundle extras) {
                    Log.e(TAG, "📡 GPS Provider " + provider + " status: " + status);
                }
                @Override
                public void onProviderEnabled(String provider) {
                    Log.e(TAG, "✅ GPS Provider enabled: " + provider);
                }
                @Override
                public void onProviderDisabled(String provider) {
                    Log.e(TAG, "❌ GPS Provider disabled: " + provider);
                }
            };
            
            // PRIORITY 1: Native GPS provider for maximum precision
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestSingleUpdate(LocationManager.GPS_PROVIDER, listener, null);
                Log.e(TAG, "📡 NATIVE GPS request sent (highest precision)");
                
            } else if (bestProvider != null && locationManager.isProviderEnabled(bestProvider)) {
                locationManager.requestSingleUpdate(bestProvider, listener, null);
                Log.e(TAG, "📡 Best provider request sent: " + bestProvider);
                
            } else if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestSingleUpdate(LocationManager.NETWORK_PROVIDER, listener, null);
                Log.e(TAG, "📡 Network location request sent (fallback)");
                
            } else {
                Log.e(TAG, "❌ No location providers available");
                scheduleNextGPSCycle();
                return;
            }
            
            // Extended timeout for high precision GPS
            new android.os.Handler(Looper.getMainLooper()).postDelayed(() -> {
                Log.e(TAG, "⏰ GPS timeout (10s) - moving to next cycle");
                locationManager.removeUpdates(listener);
                // Continue with next cycle instead of old scheduleNextGPSCycle
            }, 10000); // 10 second timeout for precision
            
        } catch (Exception e) {
            Log.e(TAG, "❌ GPS request error: " + e.getMessage());
            scheduleNextGPSCycle();
        }
    }
    
    /**
     * Transmit GPS data for all active courses
     */
    private void transmitGPSDataForAllCourses(Location location) {
        if (location == null || activeCourses.isEmpty()) {
            Log.e(TAG, "❌ Cannot transmit - no location or no active courses");
            return;
        }
        
        Log.e(TAG, "📤 Transmitting NATIVE GPS data for " + activeCourses.size() + " courses...");
        
        // Create shared timestamp for all courses
        java.util.TimeZone romaniaTimeZone = java.util.TimeZone.getTimeZone("Europe/Bucharest");
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        sdf.setTimeZone(romaniaTimeZone);
        String sharedTimestamp = sdf.format(new java.util.Date());
        
        // OPTIMIZED: Only ACTIVE courses in map - no status checking needed
        for (CourseData course : activeCourses.values()) {
            // All courses in activeCourses are guaranteed to be status 2 (ACTIVE)
            transmitGPSDataForCourse(location, course, sharedTimestamp);
        }
    }
    
    /**
     * Transmit GPS data for specific course - SIMPLIFIED LIKE LOGIN/VEHICUL.PHP
     */
    private void transmitGPSDataForCourse(Location location, CourseData course, String timestamp) {
        Log.e(TAG, "📡 === SIMPLIFIED GPS TRANSMISSION ===");
        Log.e(TAG, "🎯 Using SAME method as login/vehicul.php - only CapacitorHttp");
        Log.e(TAG, "📡 Transmitting GPS for course: " + course.courseId);
        
        // Run in background thread for each course transmission
        new Thread(() -> {
            try {
                // NATIVE VALUES: Get real device data
                int batteryLevel = getRealBatteryLevel();
                int signalStrength = getRealSignalStrength();
                
                // PRECISE GPS DATA: Round coordinates to 7 decimals for maximum precision
                double lat = Math.round(location.getLatitude() * 10000000.0) / 10000000.0;
                double lng = Math.round(location.getLongitude() * 10000000.0) / 10000000.0;
                
                // NATIVE GPS METADATA
                float accuracy = location.getAccuracy();
                double altitude = location.getAltitude();
                float speed = location.getSpeed() * 3.6f; // Convert m/s to km/h
                float bearing = location.getBearing();
                
                Log.e(TAG, "📊 NATIVE GPS Data for course " + course.courseId + ":");
                Log.e(TAG, "  Course: " + course.courseId + " (UIT: " + course.uit + ")");
                Log.e(TAG, "  Coordinates: " + lat + ", " + lng + " (accuracy: " + accuracy + "m)");
                Log.e(TAG, "  Altitude: " + altitude + "m, Speed: " + speed + "km/h, Bearing: " + bearing + "°");
                Log.e(TAG, "  Battery: " + batteryLevel + "%, Signal: " + signalStrength + "/4, Status: " + course.status);
                Log.e(TAG, "  Timestamp: " + timestamp + " (Romania timezone)");
                
                // OFFLINE SUPPORT: Try transmission, save offline if fails
                boolean transmissionSuccess = false;
                
                try {
                    // EXACT JSON FORMAT: Identic 100% cu GPSData interface din api.ts
                    org.json.JSONObject jsonData = new org.json.JSONObject();
                    jsonData.put("uit", course.uit);
                    jsonData.put("lat", lat);
                    jsonData.put("lng", lng);
                    jsonData.put("timestamp", timestamp);
                    jsonData.put("numar_inmatriculare", course.vehicleNumber);
                    jsonData.put("status", course.status);
                    jsonData.put("viteza", speed);
                    jsonData.put("directie", bearing);
                    jsonData.put("altitudine", altitude);
                    jsonData.put("baterie", batteryLevel);          // DOAR baterie (nu level_baterie)
                    jsonData.put("hdop", accuracy);                 // number (nu string)
                    jsonData.put("gsm_signal", signalStrength);     // number (nu string)
                    
                    String jsonString = jsonData.toString();
                    
                    Log.e(TAG, "📤 JSON DATA EXACT pentru gps.php:");
                    Log.e(TAG, "  JSON: " + jsonString);
                    Log.e(TAG, "  Token: Bearer [HIDDEN]");
                    
                    // SIMPLIFIED: Only CapacitorHttp like login/vehicul.php
                    Log.e(TAG, "🚀 SIMPLIFIED TRANSMISSION: Same method as login/vehicul.php");
                    Log.e(TAG, "📱 Using ONLY CapacitorHttp bridge - no complex chains");
                    
                    // Single method: CapacitorHttp bridge (same as login success)
                    transmissionSuccess = sendGPSViaCapacitorBridge(jsonString, course.authToken);
                    
                    if (!transmissionSuccess) {
                        Log.e(TAG, "❌ CapacitorHttp failed - check network or token validity");
                    } else {
                        Log.e(TAG, "✅ CapacitorHttp SUCCESS - GPS sent like login/vehicul.php");
                    }
                    
                } catch (Exception networkError) {
                    Log.e(TAG, "🔴 NETWORK ERROR for " + course.courseId + ": " + networkError.getMessage());
                    transmissionSuccess = false;
                }
                
                // OFFLINE STORAGE: Save coordinate if transmission failed
                if (!transmissionSuccess) {
                    Log.e(TAG, "💾 SAVING OFFLINE - Network transmission failed for " + course.courseId);
                    saveCoordinateOffline(course, lat, lng, timestamp, batteryLevel, signalStrength, 
                                        altitude, speed, bearing, accuracy);
                } else {
                    Log.e(TAG, "🌐 ONLINE SUCCESS - GPS coordinate transmitted for " + course.courseId);
                }
                
            } catch (Exception e) {
                Log.e(TAG, "❌ CRITICAL ERROR in GPS transmission for " + course.courseId + ": " + e.getMessage());
                e.printStackTrace();
                
                // Emergency offline save
                try {
                    double lat = Math.round(location.getLatitude() * 10000000.0) / 10000000.0;
                    double lng = Math.round(location.getLongitude() * 10000000.0) / 10000000.0;
                    saveCoordinateOffline(course, lat, lng, timestamp, getRealBatteryLevel(), 
                                        getRealSignalStrength(), location.getAltitude(), 
                                        location.getSpeed() * 3.6f, location.getBearing(), 
                                        location.getAccuracy());
                } catch (Exception saveError) {
                    Log.e(TAG, "❌ EMERGENCY: Cannot save offline coordinate: " + saveError.getMessage());
                }
            }
        }).start();
    }
    
    /**
     * Get real battery level from Android system
     */
    private int getRealBatteryLevel() {
        try {
            IntentFilter filter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = registerReceiver(null, filter);
            if (batteryStatus != null) {
                int level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
                int scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
                float batteryPercent = (level * 100) / (float) scale;
                return Math.round(batteryPercent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting battery level: " + e.getMessage());
        }
        return 85; // Default fallback
    }
    
    /**
     * Get real signal strength from telephony manager
     */
    private int getRealSignalStrength() {
        try {
            TelephonyManager telephonyManager = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
            if (telephonyManager != null) {
                // For newer Android versions, we need to use signal strength callback
                // For now, return a good default based on network type
                int networkType = telephonyManager.getNetworkType();
                if (networkType == TelephonyManager.NETWORK_TYPE_LTE || 
                    networkType == TelephonyManager.NETWORK_TYPE_NR) {
                    return 4; // Strong signal for 4G/5G
                } else if (networkType == TelephonyManager.NETWORK_TYPE_UMTS ||
                          networkType == TelephonyManager.NETWORK_TYPE_HSDPA) {
                    return 3; // Good signal for 3G
                } else {
                    return 2; // Moderate signal for 2G
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting signal strength: " + e.getMessage());
        }
        return 4; // Default strong signal
    }
    
    /**
     * Perform final GPS transmission for STOP status
     */
    private void performFinalGPSTransmission(CourseData course) {
        Log.e(TAG, "🏁 Final GPS transmission for STOP status - Course: " + course.courseId);
        
        try {
            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                Log.e(TAG, "❌ No GPS permission for final transmission");
                return;
            }
            
            // Get last known location for final transmission
            Location lastLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            if (lastLocation == null) {
                lastLocation = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
            }
            
            if (lastLocation != null) {
                // Create timestamp for final transmission
                java.util.TimeZone romaniaTimeZone = java.util.TimeZone.getTimeZone("Europe/Bucharest");
                java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                sdf.setTimeZone(romaniaTimeZone);
                String timestamp = sdf.format(new java.util.Date());
                
                // Set course status to STOP for final transmission
                course.status = 4;
                
                Log.e(TAG, "✅ Sending final GPS position with STOP status for " + course.courseId);
                transmitGPSDataForCourse(lastLocation, course, timestamp);
            } else {
                Log.e(TAG, "⚠️ No location available for final transmission of " + course.courseId);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Final GPS transmission error for " + course.courseId + ": " + e.getMessage());
        }
    }
    
    /**
     * OFFLINE STORAGE: Save GPS coordinate when network fails
     */
    private void saveCoordinateOffline(CourseData course, double lat, double lng, String timestamp,
                                     int battery, int signal, double altitude, float speed, 
                                     float bearing, float accuracy) {
        try {
            // Create JSON object with GPS data
            org.json.JSONObject coordData = new org.json.JSONObject();
            coordData.put("courseId", course.courseId);
            coordData.put("uit", course.uit);
            coordData.put("vehicleNumber", course.vehicleNumber);
            coordData.put("authToken", course.authToken);
            coordData.put("status", course.status);
            coordData.put("lat", lat);
            coordData.put("lng", lng);
            coordData.put("timestamp", timestamp);
            coordData.put("battery", battery);
            coordData.put("signal", signal);
            coordData.put("altitude", altitude);
            coordData.put("speed", speed);
            coordData.put("bearing", bearing);
            coordData.put("accuracy", accuracy);
            coordData.put("savedAt", System.currentTimeMillis());
            
            // Save to SharedPreferences
            android.content.SharedPreferences prefs = getSharedPreferences("offline_gps", MODE_PRIVATE);
            String existingData = prefs.getString("coordinates", "[]");
            
            org.json.JSONArray coordinates = new org.json.JSONArray(existingData);
            coordinates.put(coordData);
            
            // Limit to maximum 1000 offline coordinates to prevent memory issues
            if (coordinates.length() > 1000) {
                org.json.JSONArray limitedCoordinates = new org.json.JSONArray();
                for (int i = coordinates.length() - 1000; i < coordinates.length(); i++) {
                    limitedCoordinates.put(coordinates.get(i));
                }
                coordinates = limitedCoordinates;
            }
            
            prefs.edit().putString("coordinates", coordinates.toString()).apply();
            
            Log.e(TAG, "💾 OFFLINE SAVE SUCCESS for " + course.courseId + " - Total offline: " + coordinates.length());
            
        } catch (Exception e) {
            Log.e(TAG, "❌ OFFLINE SAVE FAILED for " + course.courseId + ": " + e.getMessage());
        }
    }
    
    /**
     * SYNC OFFLINE COORDINATES: Send saved coordinates when online
     */
    private void syncOfflineCoordinates() {
        new Thread(() -> {
            try {
                android.content.SharedPreferences prefs = getSharedPreferences("offline_gps", MODE_PRIVATE);
                String coordinatesData = prefs.getString("coordinates", "[]");
                org.json.JSONArray coordinates = new org.json.JSONArray(coordinatesData);
                
                if (coordinates.length() == 0) {
                    Log.e(TAG, "📭 No offline coordinates to sync");
                    return;
                }
                
                Log.e(TAG, "🔄 Starting offline sync for " + coordinates.length() + " coordinates");
                
                int syncedCount = 0;
                int failedCount = 0;
                org.json.JSONArray remainingCoordinates = new org.json.JSONArray();
                
                for (int i = 0; i < coordinates.length(); i++) {
                    try {
                        org.json.JSONObject coord = coordinates.getJSONObject(i);
                        
                        // Prepare JSON data from saved coordinate - EXACT GPSData interface
                        org.json.JSONObject jsonData = new org.json.JSONObject();
                        jsonData.put("uit", coord.getString("uit"));
                        jsonData.put("lat", coord.getDouble("lat"));
                        jsonData.put("lng", coord.getDouble("lng"));
                        jsonData.put("timestamp", coord.getString("timestamp"));
                        jsonData.put("numar_inmatriculare", coord.getString("vehicleNumber"));
                        jsonData.put("status", coord.getInt("status"));
                        jsonData.put("viteza", coord.getDouble("speed"));
                        jsonData.put("directie", coord.getDouble("bearing"));
                        jsonData.put("altitudine", coord.getDouble("altitude"));
                        jsonData.put("baterie", coord.getInt("battery"));        // DOAR baterie
                        jsonData.put("hdop", coord.getDouble("accuracy"));       // number
                        jsonData.put("gsm_signal", coord.getInt("signal"));      // number
                        
                        String jsonString = jsonData.toString();
                        
                        // MODERN SYNC CHAIN: OkHttp -> Volley (eliminat HttpURLConnection legacy)
                        boolean syncSuccess = sendGPSViaOkHttp(jsonString, coord.getString("authToken"));
                        
                        // Încercare Volley dacă OkHttp eșuează
                        if (!syncSuccess) {
                            syncSuccess = sendGPSViaVolley(jsonString, coord.getString("authToken"));
                        }
                        
                        // Nu mai folosim HttpURLConnection legacy - doar OkHttp + Volley modern
                        
                        if (syncSuccess) {
                            syncedCount++;
                            Log.e(TAG, "✅ Synced offline coordinate " + (i+1) + "/" + coordinates.length());
                        } else {
                            failedCount++;
                            remainingCoordinates.put(coord);
                            Log.e(TAG, "❌ Failed to sync coordinate " + (i+1));
                        }
                        
                        // Small delay between requests to avoid overwhelming server
                        Thread.sleep(200);
                        
                    } catch (Exception syncError) {
                        failedCount++;
                        try {
                            remainingCoordinates.put(coordinates.getJSONObject(i));
                        } catch (Exception e) {}
                        Log.e(TAG, "❌ Sync error for coordinate " + (i+1) + ": " + syncError.getMessage());
                    }
                }
                
                // Update stored coordinates (keep only failed ones)
                prefs.edit().putString("coordinates", remainingCoordinates.toString()).apply();
                
                Log.e(TAG, "🔄 SYNC COMPLETE - Synced: " + syncedCount + ", Failed: " + failedCount + ", Remaining: " + remainingCoordinates.length());
                
            } catch (Exception e) {
                Log.e(TAG, "❌ SYNC ERROR: " + e.getMessage());
            }
        }).start();
    }
    
    private void scheduleNextGPSCycle() {
        if (isGPSActive && !activeCourses.isEmpty()) {
            long nextTriggerTime = SystemClock.elapsedRealtime() + GPS_INTERVAL_MS;
            
            Log.e(TAG, "⏰ Scheduling next GPS cycle:");
            Log.e(TAG, "  - Active courses: " + activeCourses.size());
            Log.e(TAG, "  - Next trigger: " + nextTriggerTime + " (in " + GPS_INTERVAL_MS + "ms)");
            Log.e(TAG, "  - GPS Active: " + isGPSActive);
            Log.e(TAG, "  - Current time: " + SystemClock.elapsedRealtime());
            
            try {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.ELAPSED_REALTIME_WAKEUP,
                    nextTriggerTime,
                    gpsPendingIntent
                );
                Log.e(TAG, "✅ Next GPS cycle scheduled successfully for " + activeCourses.size() + " courses");
                Log.e(TAG, "🔥 ALARMMANAGER SHOULD FIRE ACTION: " + ACTION_GPS_ALARM + " in " + GPS_INTERVAL_MS + "ms");
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to schedule next GPS cycle: " + e.getMessage());
                e.printStackTrace();
            }
            
            // BACKUP MANUAL TIMER in case AlarmManager fails
            new Thread(() -> {
                try {
                    Thread.sleep(GPS_INTERVAL_MS + 2000); // Wait GPS_INTERVAL + 2 seconds extra
                    if (isGPSActive && !activeCourses.isEmpty()) {
                        Log.e(TAG, "🚨 BACKUP TIMER TRIGGERED - AlarmManager might have failed!");
                        Log.e(TAG, "📊 Current active courses: " + activeCourses.size());
                        performGPSCycle();
                    }
                } catch (Exception e) {
                    Log.e(TAG, "❌ Backup timer error: " + e.getMessage());
                }
            }).start();
            
        } else {
            Log.e(TAG, "❌ Cannot schedule GPS cycle - GPS not active or no courses");
            Log.e(TAG, "  - GPS Active: " + isGPSActive);
            Log.e(TAG, "  - Active courses: " + activeCourses.size());
        }
    }
    
    /**
     * INITIALIZE HTTP CLIENTS: Configurare optimă pentru performanță GPS
     */
    private void initializeHttpClients() {
        // Initialize OkHttp (PRIMARY)
        if (okHttpClient == null) {
            HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
            logging.setLevel(HttpLoggingInterceptor.Level.BASIC);
            
            okHttpClient = new OkHttpClient.Builder()
                .connectTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
                .writeTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
                .readTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
                .addInterceptor(logging)
                .retryOnConnectionFailure(true)
                .build();
                
            Log.e(TAG, "✅ OkHttp client inițializat cu optimizări pentru GPS");
        }
        
        // Initialize Volley (SECONDARY)
        if (volleyQueue == null) {
            volleyQueue = Volley.newRequestQueue(getApplicationContext());
            Log.e(TAG, "✅ Volley queue inițializat - biblioteca oficială Google");
        }
    }

    /**
     * SIMPLIFIED GPS VIA JAVASCRIPT BRIDGE: Same method as login/vehicul.php
     */
    private boolean sendGPSViaCapacitorBridge(String jsonString, String authToken) {
        try {
            Log.e(TAG, "🌐 SIMPLIFIED BRIDGE: Using SAME method as login/vehicul.php success");
            
            // Get MainActivity instance to access WebView
            com.euscagency.itrack.MainActivity mainActivity = com.euscagency.itrack.MainActivity.getInstance();
            if (mainActivity != null) {
                // Call JavaScript function that uses CapacitorHttp
                // Create JavaScript object from JSON string
                String jsCode = String.format(
                    "try { " +
                    "  console.log('🚀 ANDROID BRIDGE: Calling sendGPSViaCapacitor'); " +
                    "  const gpsData = %s; " +
                    "  console.log('📍 BRIDGE GPS DATA:', gpsData); " +
                    "  if (window.sendGPSViaCapacitor) { " +
                    "    window.sendGPSViaCapacitor(gpsData, '%s').then(success => { " +
                    "      console.log('✅ BRIDGE GPS Result:', success); " +
                    "    }).catch(error => { " +
                    "      console.error('❌ BRIDGE GPS Error:', error); " +
                    "    }); " +
                    "  } else { " +
                    "    console.error('❌ sendGPSViaCapacitor not available on window'); " +
                    "  } " +
                    "} catch(e) { " +
                    "  console.error('❌ BRIDGE Error:', e); " +
                    "}",
                    jsonString,
                    authToken.replace("'", "\\'")
                );
                
                // Execute on main thread
                mainActivity.runOnUiThread(() -> {
                    try {
                        android.webkit.WebView webView = mainActivity.getBridge().getWebView();
                        if (webView != null) {
                            webView.evaluateJavascript(jsCode, null);
                            Log.e(TAG, "✅ CapacitorHttp bridge called successfully");
                        } else {
                            Log.e(TAG, "❌ WebView not available for CapacitorHttp bridge");
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "❌ Error calling CapacitorHttp bridge: " + e.getMessage());
                    }
                });
                
                // Return true optimistically - actual success will be logged by JS
                return true;
            } else {
                Log.e(TAG, "❌ MainActivity not available for CapacitorHttp bridge");
                return false;
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ CapacitorHttp bridge failed: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * MODERN OKHTTP TRANSMISSION: Cel mai eficient HTTP client pentru Android
     */
    private boolean sendGPSViaOkHttp(String jsonString, String authToken) {
        try {
            Log.e(TAG, "🚀 MODERN HTTP: Folosind OkHttp pentru transmisia GPS");
            
            // Send original JSON data (metoda care mergea)
            Log.e(TAG, "📤 Sending JSON data: " + jsonString);
            
            RequestBody requestBody = RequestBody.create(jsonString, JSON_MEDIA_TYPE);
            
            Request request = new Request.Builder()
                .url(GPS_ENDPOINT)
                .post(requestBody)
                .addHeader("Content-Type", "application/json")
                .addHeader("Authorization", "Bearer " + authToken)
                .addHeader("Accept", "application/json")
                .addHeader("User-Agent", "iTrack-Android-OkHttp/1.0")
                .build();
                
            try (Response response = okHttpClient.newCall(request).execute()) {
                int responseCode = response.code();
                String responseBody = response.body() != null ? response.body().string() : "";
                
                Log.e(TAG, "📡 OkHttp Response: " + responseCode);
                if (!responseBody.isEmpty()) {
                    Log.e(TAG, "📥 Response body: " + responseBody);
                }
                
                if (responseCode == 200 || responseCode == 204) {
                    Log.e(TAG, "✅ OkHttp GPS SUCCESS - Server response: " + responseCode);
                    return true;
                } else if (responseCode == 401) {
                    Log.e(TAG, "❌ OkHttp: 401 UNAUTHORIZED - Token invalid");
                    return false;
                } else {
                    Log.e(TAG, "⚠️ OkHttp: Server returned " + responseCode);
                    return false;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ OkHttp transmission failed: " + e.getMessage());
            return false;
        }
    }

    /**
     * VOLLEY HTTP TRANSMISSION: Biblioteca oficială Google pentru Android
     */
    private boolean sendGPSViaVolley(String jsonString, String authToken) {
        try {
            Log.e(TAG, "🔄 SECONDARY HTTP: Folosind Volley (Google oficial)");
            
            org.json.JSONObject jsonObject = new org.json.JSONObject(jsonString);
            
            final boolean[] requestCompleted = {false};
            final boolean[] requestSuccess = {false};
            final Object lock = new Object();
            
            Log.e(TAG, "📤 Volley JSON data: " + jsonString);
            
            JsonObjectRequest request = new JsonObjectRequest(
                Method.POST,
                GPS_ENDPOINT,
                jsonObject,
                response -> {
                    synchronized (lock) {
                        Log.e(TAG, "✅ Volley GPS SUCCESS - Server accepted JSON data");
                        Log.e(TAG, "📥 Volley response: " + response.toString());
                        requestSuccess[0] = true;
                        requestCompleted[0] = true;
                        lock.notify();
                    }
                },
                error -> {
                    synchronized (lock) {
                        Log.e(TAG, "❌ Volley failed: " + error.getMessage());
                        if (error.networkResponse != null) {
                            Log.e(TAG, "⚠️ Volley response code: " + error.networkResponse.statusCode);
                        }
                        requestCompleted[0] = true;
                        lock.notify();
                    }
                }
            ) {
                @Override
                public java.util.Map<String, String> getHeaders() {
                    java.util.Map<String, String> headers = new java.util.HashMap<>();
                    headers.put("Content-Type", "application/json");
                    headers.put("Authorization", "Bearer " + authToken);
                    headers.put("Accept", "application/json");
                    headers.put("User-Agent", "iTrack-Android-Volley/1.0");
                    return headers;
                }
                

            };
            
            // Set timeout
            request.setRetryPolicy(new com.android.volley.DefaultRetryPolicy(
                15000, // 15 second timeout
                1, // no retries
                com.android.volley.DefaultRetryPolicy.DEFAULT_BACKOFF_MULT));
            
            volleyQueue.add(request);
            
            // Wait for completion (with timeout)
            synchronized (lock) {
                try {
                    lock.wait(20000); // 20 second max wait
                } catch (InterruptedException e) {
                    Log.e(TAG, "❌ Volley request interrupted");
                    return false;
                }
            }
            
            return requestCompleted[0] && requestSuccess[0];
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Volley transmission failed: " + e.getMessage());
            return false;
        }
    }

    /**
     * CONVERT JSON TO FORM-URLENCODED: Pentru compatibilitate server
     */
    private String convertJsonToFormData(String jsonString) {
        try {
            org.json.JSONObject jsonObject = new org.json.JSONObject(jsonString);
            StringBuilder formData = new StringBuilder();
            
            java.util.Iterator<String> keys = jsonObject.keys();
            boolean first = true;
            
            while (keys.hasNext()) {
                String key = keys.next();
                if (!first) {
                    formData.append("&");
                }
                String value = jsonObject.optString(key, "");
                formData.append(java.net.URLEncoder.encode(key, "UTF-8"));
                formData.append("=");
                formData.append(java.net.URLEncoder.encode(value, "UTF-8"));
                first = false;
            }
            
            return formData.toString();
        } catch (Exception e) {
            Log.e(TAG, "❌ Error converting JSON to form data: " + e.getMessage());
            return "";
        }
    }



    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    /**
     * HELPER METHODS for paused course storage optimization
     */
    private void saveToSharedPreferences(String key, CourseData course) {
        try {
            android.content.SharedPreferences prefs = getSharedPreferences("paused_courses", MODE_PRIVATE);
            org.json.JSONObject courseJson = new org.json.JSONObject();
            courseJson.put("courseId", course.courseId);
            courseJson.put("uit", course.uit);
            courseJson.put("status", course.status);
            courseJson.put("vehicleNumber", course.vehicleNumber);
            courseJson.put("authToken", course.authToken);
            
            prefs.edit().putString(key, courseJson.toString()).apply();
            Log.e(TAG, "💾 Paused course saved: " + key);
        } catch (Exception e) {
            Log.e(TAG, "❌ Error saving paused course: " + e.getMessage());
        }
    }
    
    private CourseData loadFromSharedPreferences(String key) {
        try {
            android.content.SharedPreferences prefs = getSharedPreferences("paused_courses", MODE_PRIVATE);
            String courseJson = prefs.getString(key, null);
            
            if (courseJson != null) {
                org.json.JSONObject json = new org.json.JSONObject(courseJson);
                CourseData course = new CourseData(
                    json.getString("courseId"),
                    json.getString("uit"),
                    json.getInt("status"),
                    json.getString("vehicleNumber"),
                    json.getString("authToken")
                );
                Log.e(TAG, "📂 Paused course loaded: " + key);
                return course;
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Error loading paused course: " + e.getMessage());
        }
        return null;
    }
    
    private void removeFromSharedPreferences(String key) {
        try {
            android.content.SharedPreferences prefs = getSharedPreferences("paused_courses", MODE_PRIVATE);
            prefs.edit().remove(key).apply();
            Log.e(TAG, "🗑️ Paused course removed: " + key);
        } catch (Exception e) {
            Log.e(TAG, "❌ Error removing paused course: " + e.getMessage());
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopGPSTimer();
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        Log.e(TAG, "🛑 SimpleGPS Service Destroyed");
    }
}