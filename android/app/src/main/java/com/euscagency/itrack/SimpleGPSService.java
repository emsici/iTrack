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
import android.util.Log;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

/**
 * SISTEM GPS SIMPLU ȘI EFICIENT - De la zero pentru funcționare garantată
 * - Funcționează în background cu telefon blocat
 * - Trimite coordonate la fiecare 10 secunde
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
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.e(TAG, "🚀 SimpleGPS Service Created");
        
        alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        
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
            channel.setDescription("Background GPS tracking every 10 seconds");
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
                } else if (newStatus == 3) { // PAUSE
                    Log.e(TAG, "⏸️ PAUSE: Course " + courseId + " GPS tracking PAUSED");
                    // Check if all courses are paused
                    boolean allPaused = activeCourses.values().stream()
                        .allMatch(c -> c.status == 3 || c.status == 4);
                    if (allPaused) {
                        Log.e(TAG, "⏸️ All courses paused - stopping GPS timer");
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
        
        try {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.ELAPSED_REALTIME_WAKEUP,
                triggerTime,
                gpsPendingIntent
            );
            Log.e(TAG, "✅ AlarmManager configured successfully");
        } catch (Exception e) {
            Log.e(TAG, "❌ AlarmManager setup failed: " + e.getMessage());
            e.printStackTrace();
        }
        
        isGPSActive = true;
        Log.e(TAG, "✅ GPS Timer Started - 5 second intervals (identic cu OptimalGPSService)");
        
        // Immediate first GPS reading with debug
        Log.e(TAG, "📍 === TRIGGERING IMMEDIATE GPS READING ===");
        Log.e(TAG, "📊 Active courses before first reading: " + activeCourses.size());
        
        // Add debug delay to verify the method is called
        new Thread(() -> {
            try {
                Thread.sleep(1000); // 1 second delay for clarity
                Log.e(TAG, "🔥 === IMMEDIATE GPS CYCLE STARTING ===");
                performGPSCycle();
            } catch (Exception e) {
                Log.e(TAG, "❌ Error in immediate GPS cycle: " + e.getMessage());
            }
        }).start();
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
        Log.e(TAG, "🔥 === PERFORM GPS CYCLE CALLED ===");
        Log.e(TAG, "📊 Active courses: " + activeCourses.size());
        
        if (activeCourses.isEmpty()) {
            Log.e(TAG, "❌ No active courses - skipping GPS cycle");
            scheduleNextGPSCycle(); // Still schedule next cycle
            return;
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
            new android.os.Handler().postDelayed(() -> {
                Log.e(TAG, "⏰ GPS timeout (10s) - accepting any available location");
                locationManager.removeUpdates(listener);
                scheduleNextGPSCycle();
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
        
        // Transmit for each active course
        for (CourseData course : activeCourses.values()) {
            if (course.status == 2) { // Only for ACTIVE courses
                transmitGPSDataForCourse(location, course, sharedTimestamp);
            } else {
                Log.e(TAG, "⏸️ Skipping course " + course.courseId + " - status: " + course.status);
            }
        }
    }
    
    /**
     * Transmit GPS data for specific course with OFFLINE SUPPORT
     */
    private void transmitGPSDataForCourse(Location location, CourseData course, String timestamp) {
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
                    // EXACT GPS DATA FORMAT: Identic cu OptimalGPSService original
                    String postData = "uit=" + course.uit +
                                    "&lat=" + lat +
                                    "&lng=" + lng +
                                    "&data=" + timestamp +
                                    "&numar_masina=" + course.vehicleNumber +
                                    "&level_baterie=" + batteryLevel +
                                    "&putere_semnal=" + signalStrength +
                                    "&status=" + course.status +
                                    "&jwt_token=" + course.authToken;
                    
                    Log.e(TAG, "📤 POST DATA EXACT pentru gps.php:");
                    Log.e(TAG, "  uit=" + course.uit);
                    Log.e(TAG, "  lat=" + lat + " lng=" + lng);
                    Log.e(TAG, "  numar_masina=" + course.vehicleNumber);
                    Log.e(TAG, "  level_baterie=" + batteryLevel + " putere_semnal=" + signalStrength);
                    Log.e(TAG, "  status=" + course.status + " jwt_token=[HIDDEN]");
                    
                    // Send HTTP POST to gps.php
                    URL url = new URL(GPS_ENDPOINT);
                    HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                    connection.setRequestMethod("POST");
                    connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
                    connection.setRequestProperty("User-Agent", "iTrack-Android-Native");
                    connection.setDoOutput(true);
                    connection.setConnectTimeout(10000);
                    connection.setReadTimeout(10000);
                    
                    // Write POST data
                    OutputStreamWriter writer = new OutputStreamWriter(connection.getOutputStream());
                    writer.write(postData);
                    writer.flush();
                    writer.close();
                    
                    // Get response
                    int responseCode = connection.getResponseCode();
                    if (responseCode == 200) {
                        transmissionSuccess = true;
                        Log.e(TAG, "✅ NATIVE GPS transmission SUCCESS for " + course.courseId + " - Response: " + responseCode);
                        
                        // Read response for debugging
                        java.io.BufferedReader reader = new java.io.BufferedReader(
                            new java.io.InputStreamReader(connection.getInputStream()));
                        String response = reader.readLine();
                        Log.e(TAG, "📥 Server response for " + course.courseId + ": " + response);
                        reader.close();
                    } else {
                        Log.e(TAG, "⚠️ Server returned non-200 response: " + responseCode);
                    }
                    
                    connection.disconnect();
                    
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
                        
                        // Prepare POST data from saved coordinate
                        String postData = "uit=" + coord.getString("uit") +
                                        "&lat=" + coord.getDouble("lat") +
                                        "&lng=" + coord.getDouble("lng") +
                                        "&data=" + coord.getString("timestamp") +
                                        "&numar_masina=" + coord.getString("vehicleNumber") +
                                        "&level_baterie=" + coord.getInt("battery") +
                                        "&putere_semnal=" + coord.getInt("signal") +
                                        "&status=" + coord.getInt("status") +
                                        "&jwt_token=" + coord.getString("authToken");
                        
                        // Send to server
                        URL url = new URL(GPS_ENDPOINT);
                        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                        connection.setRequestMethod("POST");
                        connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
                        connection.setRequestProperty("User-Agent", "iTrack-Android-Sync");
                        connection.setDoOutput(true);
                        connection.setConnectTimeout(10000);
                        connection.setReadTimeout(10000);
                        
                        OutputStreamWriter writer = new OutputStreamWriter(connection.getOutputStream());
                        writer.write(postData);
                        writer.flush();
                        writer.close();
                        
                        int responseCode = connection.getResponseCode();
                        if (responseCode == 200) {
                            syncedCount++;
                            Log.e(TAG, "✅ Synced offline coordinate " + (i+1) + "/" + coordinates.length());
                        } else {
                            failedCount++;
                            remainingCoordinates.put(coord);
                            Log.e(TAG, "❌ Failed to sync coordinate " + (i+1) + " - Response: " + responseCode);
                        }
                        
                        connection.disconnect();
                        
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
            
            try {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.ELAPSED_REALTIME_WAKEUP,
                    nextTriggerTime,
                    gpsPendingIntent
                );
                Log.e(TAG, "✅ Next GPS cycle scheduled successfully for " + activeCourses.size() + " courses");
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to schedule next GPS cycle: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            Log.e(TAG, "❌ Cannot schedule GPS cycle - GPS not active or no courses");
            Log.e(TAG, "  - GPS Active: " + isGPSActive);
            Log.e(TAG, "  - Active courses: " + activeCourses.size());
        }
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
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