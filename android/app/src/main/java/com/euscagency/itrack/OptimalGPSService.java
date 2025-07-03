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
import android.location.LocationManager;
import android.os.Bundle;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
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
 * MOST EFFICIENT GPS Background Service
 * Uses AlarmManager for exact 5-second intervals + on-demand GPS
 * Minimizes battery consumption by activating GPS only when needed
 */
public class OptimalGPSService extends Service {
    private static final String TAG = "OptimalGPS";
    private static final long GPS_INTERVAL_MS = 5000; // Exact 5 seconds
    private static final String ACTION_GPS_ALARM = "com.euscagency.itrack.GPS_ALARM";
    
    private AlarmManager alarmManager;
    private PendingIntent gpsPendingIntent;
    private LocationManager locationManager;
    private PowerManager.WakeLock wakeLock;
    private Map<String, CourseData> activeCourses = new HashMap<>();
    private boolean isAlarmActive = false;
    
    // HYBRID: AlarmManager (efficient) + Handler backup (guaranteed)
    private Handler gpsHandler = new Handler(Looper.getMainLooper());
    private long lastGPSTransmission = 0;
    private boolean alarmManagerWorking = false;
    private Runnable gpsRunnable = new Runnable() {
        @Override
        public void run() {
            long now = System.currentTimeMillis();
            long timeSinceLastGPS = now - lastGPSTransmission;
            
            // Only trigger if it's been more than 6 seconds since last GPS transmission
            if (timeSinceLastGPS > 6000) {
                Log.d(TAG, "🔄 HANDLER BACKUP GPS CYCLE - " + timeSinceLastGPS + "ms since last GPS");
                alarmManagerWorking = false;
                performOptimalGPSCycle();
            } else {
                Log.d(TAG, "⏸️ HANDLER: Skipping GPS - recent transmission " + timeSinceLastGPS + "ms ago");
                alarmManagerWorking = true;
            }
            
            // Schedule next backup check only if we have active courses
            if (!activeCourses.isEmpty()) {
                gpsHandler.postDelayed(this, GPS_INTERVAL_MS);
            }
        }
    };
    

    
    // FOREGROUND OPTIMIZED HTTP TRANSMISSION
    private ExecutorService httpThreadPool; // Simple thread pool to avoid blocking main service
    
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
        alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        
        // CRITICAL: PARTIAL_WAKE_LOCK for background GPS with phone locked
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "OptimalGPS:WakeLock");
        
        // FOREGROUND OPTIMIZED: Simple thread pool to avoid blocking AlarmManager
        httpThreadPool = Executors.newFixedThreadPool(1); // Single background thread for HTTP
        
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, createNotification());
        
        Log.d(TAG, "✅ OPTIMAL GPS Service created - AlarmManager + Optimized HTTP + Batching");
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
            startForeground(NOTIFICATION_ID, createNotification());
            Log.d(TAG, "✅ DIAGNOSTIC: Foreground service started successfully");
        } catch (Exception e) {
            Log.e(TAG, "❌ DIAGNOSTIC: Foreground service failed: " + e.getMessage());
        }
        
        if (intent != null && ACTION_GPS_ALARM.equals(intent.getAction())) {
            // ALARM TRIGGERED: Get GPS location and transmit for all active courses
            long now = System.currentTimeMillis();
            long timeSinceLastGPS = now - lastGPSTransmission;
            
            Log.d(TAG, "🔄 ALARMMANAGER: ALARM TRIGGERED - " + timeSinceLastGPS + "ms since last GPS");
            
            // Only proceed if it's been more than 4 seconds since last GPS
            if (timeSinceLastGPS > 4000) {
                Log.d(TAG, "✅ ALARMMANAGER: Proceeding with GPS cycle");
                alarmManagerWorking = true;
                performOptimalGPSCycle();
            } else {
                Log.d(TAG, "⏸️ ALARMMANAGER: Skipping - too recent GPS transmission (" + timeSinceLastGPS + "ms)");
            }
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
            
            // Service command handled - let AlarmManager handle GPS cycles
        }
        
        Log.d(TAG, "🚨 === DIAGNOSTIC END === onStartCommand completed");
        return START_STICKY; // Restart if killed
    }
    
    /**
     * OPTIMAL GPS CYCLE: Triggered by AlarmManager (efficient) or Handler backup (guaranteed)
     * GPS hardware is activated ONLY when needed, then immediately turned off
     */
    private void performOptimalGPSCycle() {
        lastGPSTransmission = System.currentTimeMillis(); // Track when GPS runs
        Log.d(TAG, "🔍 GPS CYCLE: performOptimalGPSCycle() called - activeCourses size: " + activeCourses.size());
        
        if (activeCourses.isEmpty()) {
            Log.d(TAG, "⏸️ No active courses - stopping GPS cycles");
            stopOptimalGPSTimer();
            return;
        }
        
        Log.d(TAG, "⏰ OPTIMAL GPS CYCLE - getting location for " + activeCourses.size() + " courses");
        
        // CRITICAL DEBUG: Show all active courses
        for (Map.Entry<String, CourseData> entry : activeCourses.entrySet()) {
            CourseData course = entry.getValue();
            Log.d(TAG, "  📋 Active course: " + course.courseId + " (UIT: " + course.uit + ", Status: " + course.status + ")");
        }
        
        try {
            // CRITICAL: Get LAST KNOWN location first (instant, no battery)
            Location lastLocation = null;
            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                lastLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            }
            
            if (lastLocation != null && 
                (System.currentTimeMillis() - lastLocation.getTime()) < 3000) { // Less than 3s old
                
                Log.d(TAG, "✅ Using recent GPS location (battery efficient) - NO fresh request needed");
                transmitGPSForAllCourses(lastLocation);
                // IMPORTANT: scheduleNextOptimalGPSCycle() called inside transmitGPSForAllCourses
                
            } else {
                Log.d(TAG, "🔄 Requesting fresh GPS location (minimal battery impact)");
                requestSingleGPSLocation();
                // IMPORTANT: onLocationChanged will call transmitGPSForAllCourses → scheduleNextOptimalGPSCycle
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error in optimal GPS cycle: " + e.getMessage());
            // Still schedule next cycle even on error to maintain background operation
            scheduleNextOptimalGPSCycle();
        }
    }
    
    /**
     * Request single GPS location update (most battery efficient)
     * GPS turns on briefly, gets location, turns off immediately
     */
    private void requestSingleGPSLocation() {
        try {
            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                Log.e(TAG, "❌ No location permission for optimal GPS");
                return;
            }
            
            // Single location request - GPS active for minimal time
            locationManager.requestSingleUpdate(
                LocationManager.GPS_PROVIDER,
                new android.location.LocationListener() {
                    @Override
                    public void onLocationChanged(Location location) {
                        Log.d(TAG, "📍 Fresh OPTIMAL GPS location received");
                        transmitGPSForAllCourses(location);
                        // GPS automatically turns off after this callback
                        // IMPORTANT: scheduleNextOptimalGPSCycle() called inside transmitGPSForAllCourses
                    }
                    
                    @Override
                    public void onStatusChanged(String provider, int status, android.os.Bundle extras) {}
                    @Override
                    public void onProviderEnabled(String provider) {}
                    @Override
                    public void onProviderDisabled(String provider) {}
                },
                null // Main thread - minimal overhead
            );
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error requesting single GPS location: " + e.getMessage());
        }
    }
    
    /**
     * Transmit GPS data for all active courses with minimal battery usage
     */
    private void transmitGPSForAllCourses(Location location) {
        int transmissionCount = 0;
        int activeCoursesCount = 0;
        java.util.Set<String> transmittedUITs = new java.util.HashSet<>();
        
        Log.d(TAG, "🚀 STARTING GPS transmission for " + activeCourses.size() + " total courses");
        
        java.util.List<String> coursesToRemove = new java.util.ArrayList<>();
        
        for (CourseData course : activeCourses.values()) {
            if (course.status == 2 || course.status == 3 || course.status == 4) { // ACTIVE, PAUSE, or FINAL transmission
                activeCoursesCount++;
                
                // ANTI-DUPLICATE: Check if UIT already transmitted in this cycle
                if (transmittedUITs.contains(course.uit)) {
                    Log.w(TAG, "⚠️ SKIPPING duplicate UIT: " + course.uit + " for course: " + course.courseId);
                    
                    // Still handle status 4 removal even if skipped transmission
                    if (course.status == 4) {
                        coursesToRemove.add(course.courseId);
                    }
                    continue;
                }
                
                // STATUS 3 (PAUSE): Transmit only once, then skip
                if (course.status == 3) {
                    if (course.pauseTransmitted) {
                        Log.d(TAG, "⏸️ PAUSE already transmitted for: " + course.courseId + " - SKIPPING");
                        continue; // Skip transmission - pause was already sent
                    }
                }
                
                String statusType = (course.status == 2) ? "ACTIVE" : 
                                  (course.status == 3) ? "PAUSE" : "FINAL";
                Log.d(TAG, "🚀 OPTIMAL " + statusType + " transmission for: " + course.courseId + " (UIT: " + course.uit + ")");
                
                try {
                    transmitOptimalGPSData(course, location);
                    transmittedUITs.add(course.uit); // Mark UIT as transmitted
                    transmissionCount++;
                    Log.d(TAG, "✅ OPTIMAL GPS SUCCESS for: " + course.courseId + " (status: " + course.status + ")");
                    
                    // Mark STATUS 3 (PAUSE) as transmitted to prevent future transmissions
                    if (course.status == 3) {
                        course.pauseTransmitted = true;
                        Log.d(TAG, "⏸️ PAUSE marked as transmitted for: " + course.courseId + " - no more GPS until RESUME");
                    }
                    
                    // Schedule removal for status 4 after successful transmission
                    if (course.status == 4) {
                        coursesToRemove.add(course.courseId);
                        Log.d(TAG, "🏁 Course " + course.courseId + " marked for removal after FINAL transmission");
                    }
                    
                } catch (Exception e) {
                    Log.e(TAG, "❌ OPTIMAL GPS FAILED for " + course.courseId + ": " + e.getMessage());
                    e.printStackTrace();
                    
                    // Still remove status 4 courses even if transmission failed
                    if (course.status == 4) {
                        coursesToRemove.add(course.courseId);
                    }
                }
            }
        }
        
        // Remove completed courses (status 4) after transmission
        for (String courseIdToRemove : coursesToRemove) {
            activeCourses.remove(courseIdToRemove);
            Log.d(TAG, "🗑️ REMOVED completed course: " + courseIdToRemove);
        }
        
        // CRITICAL DEBUG: Check remaining courses after removal
        Log.d(TAG, "📊 AFTER REMOVAL: " + activeCourses.size() + " courses remaining");
        if (activeCourses.isEmpty()) {
            Log.d(TAG, "🛑 ALL COURSES COMPLETED - GPS will stop after this cycle");
        } else {
            Log.d(TAG, "🔄 GPS will continue for remaining " + activeCourses.size() + " active courses");
            for (CourseData remainingCourse : activeCourses.values()) {
                Log.d(TAG, "  - Course: " + remainingCourse.courseId + " (status: " + remainingCourse.status + ")");
            }
        }
        
        Log.d(TAG, "📊 OPTIMAL GPS SUMMARY:");
        Log.d(TAG, "  - Processed courses: " + activeCoursesCount + " (active + final)");
        Log.d(TAG, "  - Successfully transmitted: " + transmissionCount);
        Log.d(TAG, "  - UITs transmitted: " + transmittedUITs.size());
        Log.d(TAG, "  - Completed courses removed: " + coursesToRemove.size());
        Log.d(TAG, "  - Remaining active courses: " + activeCourses.size());
        Log.d(TAG, "✅ Optimal GPS cycle completed - next in exactly " + (GPS_INTERVAL_MS/1000) + "s");
        
        // CRITICAL: Schedule next GPS cycle to continue background operation
        Log.d(TAG, "🔄 SCHEDULING NEXT GPS CYCLE - activeCourses size: " + activeCourses.size());
        scheduleNextOptimalGPSCycle();
        Log.d(TAG, "⏰ NEXT GPS CYCLE SCHEDULED successfully");
    }
    
    /**
     * Most efficient GPS data transmission
     */
    private void transmitOptimalGPSData(CourseData course, Location location) throws Exception {
        // Create GPS data JSON
        org.json.JSONObject gpsData = new org.json.JSONObject();
        // JUNE 26TH FORMAT: Real coordinates + JWT token in UIT field
        gpsData.put("lat", location.getLatitude()); // Real coordinates as numbers
        gpsData.put("lng", location.getLongitude()); // Real coordinates as numbers
        gpsData.put("timestamp", new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.getDefault()).format(new java.util.Date()));
        gpsData.put("viteza", location.getSpeed() * 3.6); // m/s to km/h as float
        gpsData.put("directie", location.getBearing()); // Real bearing as float
        gpsData.put("altitudine", location.getAltitude()); // Real altitude as float
        gpsData.put("baterie", getBatteryLevel() + "%"); // Battery with % like June 26th
        gpsData.put("numar_inmatriculare", course.vehicleNumber);
        gpsData.put("uit", course.uit); // Real UIT from course data
        gpsData.put("status", course.status);
        gpsData.put("hdop", 1); // Simple numeric value like June 26th
        gpsData.put("gsm_signal", 4); // Simple numeric value like June 26th
        
        Log.d(TAG, "📡 OPTIMAL GPS data for course " + course.courseId + ": " + gpsData.toString());
        Log.d(TAG, "🔑 Auth token length: " + course.authToken.length() + " chars (starts with: " + course.authToken.substring(0, Math.min(20, course.authToken.length())) + "...)");
        Log.d(TAG, "🌐 Transmitting to: https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php");
        
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
            java.net.URL url = new java.net.URL("https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php");
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
                Log.d(TAG, "✅ GPS SUCCESS " + responseCode + " for course: " + courseId + " | Response: " + responseBody);
            } else {
                Log.w(TAG, "⚠️ GPS FAILED " + responseCode + " for course: " + courseId + " | Response: " + responseBody);
                Log.w(TAG, "🔍 Request was: " + jsonData);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ FOREGROUND GPS FAILED for " + courseId + ": " + e.getMessage());
            // No retry for foreground - next transmission comes in 5 seconds anyway
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }
    
    /**
     * Schedule next exact GPS cycle
     */
    private void scheduleNextOptimalGPSCycle() {
        Log.d(TAG, "🔄 SCHEDULE CHECK: activeCourses.size() = " + activeCourses.size());
        
        if (!activeCourses.isEmpty()) {
            Log.d(TAG, "✅ SCHEDULING next GPS cycle - " + activeCourses.size() + " courses need GPS");
            long nextTriggerTime = SystemClock.elapsedRealtime() + GPS_INTERVAL_MS;
            
            // CRITICAL: Ensure PendingIntent exists before scheduling
            if (gpsPendingIntent == null) {
                Log.e(TAG, "❌ CRITICAL: gpsPendingIntent is NULL - recreating");
                Intent alarmIntent = new Intent(this, OptimalGPSService.class);
                alarmIntent.setAction(ACTION_GPS_ALARM);
                gpsPendingIntent = PendingIntent.getService(
                    this, 0, alarmIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                Log.d(TAG, "✅ RECREATED gpsPendingIntent for alarm scheduling");
            }
            
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.ELAPSED_REALTIME_WAKEUP,
                nextTriggerTime,
                gpsPendingIntent
            );
            Log.d(TAG, "⏰ NEXT GPS ALARM SET: in exactly " + (GPS_INTERVAL_MS/1000) + "s for " + activeCourses.size() + " active courses");
            Log.d(TAG, "📡 Trigger time: " + nextTriggerTime + " (current: " + SystemClock.elapsedRealtime() + ")");
            Log.d(TAG, "🔧 ALARM DEBUG: AlarmManager=" + alarmManager + ", PendingIntent=" + gpsPendingIntent);
            Log.d(TAG, "🎯 ALARM DEBUG: Expected trigger in " + (nextTriggerTime - SystemClock.elapsedRealtime()) + "ms");
        } else {
            Log.w(TAG, "❌ NO ACTIVE COURSES - GPS cycle NOT scheduled, stopping timer");
            stopOptimalGPSTimer();
        }
    }
    
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
     * Start EXACT 5-second AlarmManager timer (most accurate)
     */
    private void startOptimalGPSTimer() {
        if (isAlarmActive) {
            Log.d(TAG, "⚠️ Optimal GPS timer already active");
            return;
        }
        
        // CRITICAL: Check for SCHEDULE_EXACT_ALARM permission (Android 12+)
        if (android.os.Build.VERSION.SDK_INT >= 31) {
            if (!alarmManager.canScheduleExactAlarms()) {
                Log.e(TAG, "❌ CRITICAL: SCHEDULE_EXACT_ALARM permission denied - AlarmManager will NOT work");
                Log.e(TAG, "   User must enable: Settings > Apps > iTrack > Special permissions > Alarms & reminders");
                Log.e(TAG, "   WITHOUT this permission, GPS will NOT transmit in background");
                return;
            } else {
                Log.d(TAG, "✅ SCHEDULE_EXACT_ALARM permission granted - AlarmManager functional");
            }
        }
        
        Intent alarmIntent = new Intent(this, OptimalGPSService.class);
        alarmIntent.setAction(ACTION_GPS_ALARM);
        
        gpsPendingIntent = PendingIntent.getService(
            this, 0, alarmIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // CRITICAL: Use setExactAndAllowWhileIdle for EXACT 5-second intervals
        long triggerTime = SystemClock.elapsedRealtime() + GPS_INTERVAL_MS;
        alarmManager.setExactAndAllowWhileIdle(
            AlarmManager.ELAPSED_REALTIME_WAKEUP,
            triggerTime,
            gpsPendingIntent
        );
        
        // CRITICAL: Acquire PARTIAL_WAKE_LOCK for background GPS with phone locked
        if (wakeLock != null && !wakeLock.isHeld()) {
            wakeLock.acquire();
            Log.d(TAG, "🔒 WAKE_LOCK acquired - GPS will work with phone locked");
        }
        
        isAlarmActive = true;
        Log.d(TAG, "✅ OPTIMAL GPS timer started - EXACT " + (GPS_INTERVAL_MS/1000) + "s intervals");
        Log.d(TAG, "⏰ ALARM DEBUG: First trigger at " + triggerTime + " (current: " + SystemClock.elapsedRealtime() + ")");
        Log.d(TAG, "🔧 ALARM DEBUG: AlarmManager=" + alarmManager + ", PendingIntent=" + gpsPendingIntent);
        Log.d(TAG, "⚡ ALARM CRITICAL: TIME TO TRIGGER = " + (triggerTime - SystemClock.elapsedRealtime()) + "ms");
        Log.d(TAG, "📊 ALARM CRITICAL: ACTIVE COURSES = " + activeCourses.size());
        
        // CRITICAL: Immediate test to ensure alarm system works
        Log.d(TAG, "🧪 ALARM TEST: Scheduling immediate test alarm in 2 seconds...");
        Intent testIntent = new Intent(this, OptimalGPSService.class);
        testIntent.setAction(ACTION_GPS_ALARM);
        PendingIntent testPendingIntent = PendingIntent.getService(
            this, 99, testIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        long testTriggerTime = SystemClock.elapsedRealtime() + 2000; // 2 seconds
        alarmManager.setExactAndAllowWhileIdle(
            AlarmManager.ELAPSED_REALTIME_WAKEUP,
            testTriggerTime,
            testPendingIntent
        );
        Log.d(TAG, "🧪 TEST ALARM SET: Will trigger in 2 seconds to verify AlarmManager is working");
    }
    
    /**
     * Stop AlarmManager timer
     */
    private void stopOptimalGPSTimer() {
        if (gpsPendingIntent != null) {
            alarmManager.cancel(gpsPendingIntent);
            gpsPendingIntent = null;
        }
        
        // Stop Handler backup
        gpsHandler.removeCallbacks(gpsRunnable);
        
        // CRITICAL: Release PARTIAL_WAKE_LOCK when GPS stops
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            Log.d(TAG, "🔓 WAKE_LOCK released - GPS background service stopped");
        }
        
        isAlarmActive = false;
        Log.d(TAG, "🛑 HYBRID GPS system stopped (AlarmManager + Handler)");
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
            
            Log.d(TAG, "📋 RECEIVED GPS PARAMETERS:");
            Log.d(TAG, "  courseId: " + courseId);
            Log.d(TAG, "  uit: " + uit);
            Log.d(TAG, "  vehicleNumber: " + vehicleNumber);
            Log.d(TAG, "  authToken: " + (authToken != null ? authToken.substring(0, Math.min(30, authToken.length())) + "..." : "null"));
            Log.d(TAG, "  status: " + status);
            
            // Validate critical parameters
            if (courseId == null || uit == null || authToken == null || vehicleNumber == null) {
                Log.e(TAG, "❌ CRITICAL: Missing required GPS parameters - cannot start GPS");
                Log.e(TAG, "Missing: " + 
                      (courseId == null ? "courseId " : "") +
                      (uit == null ? "uit " : "") +
                      (authToken == null ? "authToken " : "") +
                      (vehicleNumber == null ? "vehicleNumber " : ""));
                return;
            }
            
            // Check if course already exists to prevent duplicates
            if (activeCourses.containsKey(courseId)) {
                Log.w(TAG, "⚠️ Course " + courseId + " already exists - updating status only");
                activeCourses.get(courseId).status = status;
                Log.d(TAG, "✅ OPTIMAL course updated: " + courseId + " (UIT: " + uit + ")");
            } else {
                CourseData courseData = new CourseData(courseId, uit, status, vehicleNumber, authToken);
                activeCourses.put(courseId, courseData);
                Log.d(TAG, "✅ OPTIMAL course added: " + courseId + " (UIT: " + uit + ")");
            }
            
            // CRITICAL: ALWAYS ensure GPS timer is running when we have active courses
            if (!isAlarmActive && !activeCourses.isEmpty()) {
                Log.d(TAG, "🚀 STARTING HYBRID GPS system - " + activeCourses.size() + " active courses need GPS");
                startOptimalGPSTimer(); // AlarmManager (most efficient)
                gpsHandler.postDelayed(gpsRunnable, GPS_INTERVAL_MS); // Handler backup
                Log.d(TAG, "✅ HYBRID: AlarmManager + Handler backup both started");
                

            } else if (isAlarmActive) {
                Log.d(TAG, "✅ GPS timer already active - " + activeCourses.size() + " courses tracking");
            }
            
        } else if ("STOP_GPS".equals(action)) {
            String courseId = intent.getStringExtra("courseId");
            
            // CRITICAL FIX: Don't remove immediately - set status 4 for final transmission
            CourseData course = activeCourses.get(courseId);
            if (course != null) {
                course.status = 4; // Set to STOP status for final GPS transmission
                Log.d(TAG, "🏁 OPTIMAL course marked for FINAL transmission: " + courseId + " (status 4)");
                Log.d(TAG, "📡 Course will be removed AFTER final GPS transmission with status 4");
            } else {
                Log.w(TAG, "⚠️ Course " + courseId + " not found for STOP - already removed?");
            }
            
            // Don't stop GPS timer yet - let it transmit status 4 first
            // GPS timer will auto-stop when activeCourses becomes empty after transmission
            
        } else if ("UPDATE_STATUS".equals(action)) {
            String courseId = intent.getStringExtra("courseId");
            int newStatus = intent.getIntExtra("newStatus", 2);
            
            CourseData course = activeCourses.get(courseId);
            if (course != null) {
                course.status = newStatus;
                
                // Reset pauseTransmitted flag when resuming (status 2)
                if (newStatus == 2) {
                    course.pauseTransmitted = false;
                    Log.d(TAG, "▶️ RESUME: Reset pause flag for " + courseId + " - GPS will transmit continuously");
                }
                
                Log.d(TAG, "📊 OPTIMAL status updated: " + courseId + " -> " + newStatus);
            }
            
        } else if ("CLEAR_ALL".equals(action)) {
            activeCourses.clear();
            stopOptimalGPSTimer();
            Log.d(TAG, "🧹 OPTIMAL GPS cleared all courses");
            
            // CRITICAL: Force clear any cached GPS data or background processes
            Log.d(TAG, "🔥 FORCE CLEARING: Eliminating any potential cached GPS transmissions");
            Log.d(TAG, "⚠️ NOTE: Only real-time GPS with location.getSpeed() should transmit - NO STATIC SPEED VALUES");
        }
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    @Override
    public void onDestroy() {
        stopOptimalGPSTimer();
        
        // CLEANUP: Shutdown HTTP thread pool
        if (httpThreadPool != null && !httpThreadPool.isShutdown()) {
            httpThreadPool.shutdown();
            try {
                if (!httpThreadPool.awaitTermination(2, TimeUnit.SECONDS)) {
                    httpThreadPool.shutdownNow();
                }
            } catch (InterruptedException e) {
                httpThreadPool.shutdownNow();
            }
        }
        
        // FINAL CLEANUP: Release WakeLock if still held
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            Log.d(TAG, "🔓 FINAL: WakeLock released in onDestroy");
        }
        
        super.onDestroy();
        Log.d(TAG, "✅ Optimal GPS Service destroyed with proper cleanup");
    }
}