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
import android.os.Build;
import android.os.IBinder;
import android.os.SystemClock;
import android.telephony.TelephonyManager;
import android.util.Log;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import java.util.HashMap;
import java.util.Map;

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
    private Map<String, CourseData> activeCourses = new HashMap<>();
    private boolean isAlarmActive = false;
    
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
    
    private static final int NOTIFICATION_ID = 1;
    private static final String CHANNEL_ID = "OptimalGPSChannel";
    
    @Override
    public void onCreate() {
        super.onCreate();
        alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, createNotification());
        
        Log.d(TAG, "✅ OPTIMAL GPS Service created - AlarmManager + On-demand GPS + Foreground");
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
        Log.d(TAG, "📡 OPTIMAL GPS Service started with action: " + (intent != null ? intent.getAction() : "NULL"));
        Log.d(TAG, "⚡ Current activeCourses count: " + activeCourses.size());
        
        // IMMEDIATE: Start foreground service to prevent termination
        startForeground(NOTIFICATION_ID, createNotification());
        
        if (intent != null && ACTION_GPS_ALARM.equals(intent.getAction())) {
            // ALARM TRIGGERED: Get GPS location and transmit for all active courses
            Log.d(TAG, "🔄 ALARM TRIGGERED - performing GPS cycle");
            performOptimalGPSCycle();
        } else {
            // Regular service commands (START_GPS, STOP_GPS, etc.)
            Log.d(TAG, "📥 HANDLING SERVICE COMMAND");
            handleServiceCommand(intent);
            
            // CRITICAL: After handling command, perform GPS cycle if we have active courses
            if (!activeCourses.isEmpty()) {
                Log.d(TAG, "🚀 EXECUTING INITIAL GPS CYCLE for " + activeCourses.size() + " active courses");
                performOptimalGPSCycle();
            } else {
                Log.w(TAG, "⚠️ NO ACTIVE COURSES - skipping GPS cycle");
            }
        }
        
        return START_STICKY; // Restart if killed
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
        
        Log.d(TAG, "⏰ OPTIMAL GPS CYCLE - getting location for " + activeCourses.size() + " courses");
        
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
        
        for (CourseData course : activeCourses.values()) {
            if (course.status == 2) { // Only ACTIVE courses
                activeCoursesCount++;
                
                // ANTI-DUPLICATE: Check if UIT already transmitted in this cycle
                if (transmittedUITs.contains(course.uit)) {
                    Log.w(TAG, "⚠️ SKIPPING duplicate UIT: " + course.uit + " for course: " + course.courseId);
                    continue;
                }
                
                Log.d(TAG, "🚀 OPTIMAL transmission for: " + course.courseId + " (UIT: " + course.uit + ")");
                
                try {
                    transmitOptimalGPSData(course, location);
                    transmittedUITs.add(course.uit); // Mark UIT as transmitted
                    transmissionCount++;
                    Log.d(TAG, "✅ OPTIMAL GPS SUCCESS for: " + course.courseId);
                } catch (Exception e) {
                    Log.e(TAG, "❌ OPTIMAL GPS FAILED for " + course.courseId + ": " + e.getMessage());
                    e.printStackTrace();
                }
            }
        }
        
        Log.d(TAG, "📊 OPTIMAL GPS SUMMARY:");
        Log.d(TAG, "  - Active courses: " + activeCoursesCount);
        Log.d(TAG, "  - Successfully transmitted: " + transmissionCount);
        Log.d(TAG, "  - UITs transmitted: " + transmittedUITs.size());
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
        gpsData.put("lat", String.format("%.4f", location.getLatitude()));
        gpsData.put("lng", String.format("%.4f", location.getLongitude()));
        gpsData.put("timestamp", new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", java.util.Locale.getDefault()).format(new java.util.Date()));
        gpsData.put("viteza", (int)(location.getSpeed() * 3.6)); // m/s to km/h
        gpsData.put("directie", (int)location.getBearing());
        gpsData.put("altitudine", (int)location.getAltitude());
        gpsData.put("baterie", getBatteryLevel());
        gpsData.put("numar_inmatriculare", course.vehicleNumber);
        gpsData.put("uit", course.uit);
        gpsData.put("status", course.status);
        gpsData.put("hdop", String.format("%.1f", getHdopFromLocation(location)));
        gpsData.put("gsm_signal", getSignalStrength());
        
        Log.d(TAG, "📡 OPTIMAL GPS data: " + gpsData.toString());
        
        // UNIFIED: Use CapacitorHttp through WebView for consistent HTTP method
        MainActivity mainActivity = MainActivity.getInstance();
        if (mainActivity != null && mainActivity.getWebView() != null) {
            // Call JavaScript function to send GPS via CapacitorHttp
            String jsCode = String.format(
                "window.sendGPSViaCapacitor && window.sendGPSViaCapacitor(%s, '%s');",
                gpsData.toString(),
                userAuthToken
            );
            
            mainActivity.runOnMainThread(new Runnable() {
                @Override
                public void run() {
                    mainActivity.getWebView().evaluateJavascript(jsCode, null);
                }
            });
            
            Log.d(TAG, "📡 UNIFIED GPS sent via CapacitorHttp for course: " + course.courseId);
        } else {
            Log.w(TAG, "⚠️ WebView not available - falling back to direct HTTP");
            
            // Fallback: Direct HTTP transmission if WebView unavailable
            java.net.URL url = new java.net.URL("https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php");
            java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Authorization", "Bearer " + userAuthToken);
            connection.setRequestProperty("User-Agent", "iTrack-Optimal-GPS/1.0");
            connection.setDoOutput(true);
            connection.setConnectTimeout(8000);
            connection.setReadTimeout(8000);
            
            java.io.OutputStream os = connection.getOutputStream();
            os.write(gpsData.toString().getBytes("UTF-8"));
            os.close();
            
            int responseCode = connection.getResponseCode();
            Log.d(TAG, "📡 FALLBACK GPS response: " + responseCode + " for course: " + course.courseId);
            
            connection.disconnect();
        }
    }
    
    /**
     * Schedule next exact GPS cycle
     */
    private void scheduleNextOptimalGPSCycle() {
        if (!activeCourses.isEmpty()) {
            long nextTriggerTime = SystemClock.elapsedRealtime() + GPS_INTERVAL_MS;
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.ELAPSED_REALTIME_WAKEUP,
                nextTriggerTime,
                gpsPendingIntent
            );
            Log.d(TAG, "⏰ NEXT GPS ALARM SET: in exactly " + (GPS_INTERVAL_MS/1000) + "s for " + activeCourses.size() + " active courses");
            Log.d(TAG, "📡 Trigger time: " + nextTriggerTime + " (current: " + SystemClock.elapsedRealtime() + ")");
        } else {
            Log.w(TAG, "❌ NO ACTIVE COURSES - GPS cycle NOT scheduled");
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
        
        Intent alarmIntent = new Intent(this, OptimalGPSService.class);
        alarmIntent.setAction(ACTION_GPS_ALARM);
        
        gpsPendingIntent = PendingIntent.getService(
            this, 0, alarmIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // CRITICAL: Use setExactAndAllowWhileIdle for EXACT 5-second intervals
        alarmManager.setExactAndAllowWhileIdle(
            AlarmManager.ELAPSED_REALTIME_WAKEUP,
            SystemClock.elapsedRealtime() + GPS_INTERVAL_MS,
            gpsPendingIntent
        );
        
        isAlarmActive = true;
        Log.d(TAG, "✅ OPTIMAL GPS timer started - EXACT " + (GPS_INTERVAL_MS/1000) + "s intervals");
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
    
    private String userAuthToken;
    
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
            
            userAuthToken = authToken;
            
            // Check if course already exists to prevent duplicates
            if (activeCourses.containsKey(courseId)) {
                Log.w(TAG, "⚠️ Course " + courseId + " already exists - updating status only");
                activeCourses.get(courseId).status = status;
                return; // Don't add duplicate or restart timer
            }
            
            CourseData courseData = new CourseData(courseId, uit, status, vehicleNumber);
            activeCourses.put(courseId, courseData);
            
            Log.d(TAG, "✅ OPTIMAL course added: " + courseId + " (UIT: " + uit + ")");
            
            if (!isAlarmActive) {
                startOptimalGPSTimer();
            }
            
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
                course.status = newStatus;
                Log.d(TAG, "📊 OPTIMAL status updated: " + courseId + " -> " + newStatus);
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
    
    @Override
    public void onDestroy() {
        stopOptimalGPSTimer();
        super.onDestroy();
        Log.d(TAG, "✅ Optimal GPS Service destroyed");
    }
}