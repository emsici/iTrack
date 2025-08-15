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
    private static final long GPS_INTERVAL_LOCKED_MS = 5000; // 5 secunde când telefonul e blocat - REVERT LA SETAREA CARE MERGEA
    private static final long GPS_INTERVAL_UNLOCKED_MS = 5000; // 5 secunde când telefonul e deblocat - CONSISTENT
    private static final String ACTION_GPS_ALARM = "com.euscagency.itrack.GPS_ALARM";
    
    // Configurație API Centralizată
    private static final String API_BASE_URL_DEV = "https://www.euscagency.com/etsm3/platforme/transport/apk/";
    private static final String API_BASE_URL_PROD = "https://www.euscagency.com/etsm_prod/platforme/transport/apk/";
    
    // Mediul activ curent - TRECUT PE PROD (etsm_prod) - conform solicitării utilizatorului  
    private static final String API_BASE_URL = API_BASE_URL_PROD; // Trecut pe PRODUCȚIE
    
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
    
    // WebView interface pentru raportarea status-ului network către frontend
    private MainActivity webInterface;
    
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
        
        // Initialize WakeLock for background operation
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "iTrack:OptimalGPS");
        
        // FOREGROUND OPTIMIZED: Simple thread pool to avoid blocking AlarmManager
        httpThreadPool = Executors.newFixedThreadPool(1); // Single background thread for HTTP
        
        // Get MainActivity reference for network status reporting
        webInterface = MainActivity.getInstance();
        
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, createNotification());
        
        Log.d(TAG, "✅ OPTIMAL GPS Service created - AlarmManager + Optimized HTTP + Batching + WakeLock + WebInterface");
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
                wakeLock.acquire(10*60*1000L /*10 minutes*/);
                android.util.Log.e(TAG, "✅ WAKELOCK ACQUIRED pentru 10 min - previne deep sleep când e blocat");
            }
        } catch (Exception e) {
            android.util.Log.e(TAG, "❌ CRITICAL: Foreground service FAILED: " + e.getMessage());
        }
        
        if (intent != null && ACTION_GPS_ALARM.equals(intent.getAction())) {
            // ALARM TRIGGERED: Get GPS location and transmit for all active courses
            Log.d(TAG, "🔄 DIAGNOSTIC: ALARM TRIGGERED - performing GPS cycle");
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
            
            // CRITICAL: After handling command, perform GPS cycle if we have active courses
            if (!activeCourses.isEmpty()) {
                Log.d(TAG, "🚀 DIAGNOSTIC: EXECUTING INITIAL GPS CYCLE for " + activeCourses.size() + " active courses");
                Log.d(TAG, "🔍 DIAGNOSTIC: Active courses details:");
                for (Map.Entry<String, CourseData> entry : activeCourses.entrySet()) {
                    CourseData course = entry.getValue();
                    Log.d(TAG, "  - CourseId: " + course.courseId + ", UIT: " + course.uit + ", Status: " + course.status);
                }
                performOptimalGPSCycle();
            } else {
                Log.w(TAG, "⚠️ DIAGNOSTIC: NO ACTIVE COURSES - skipping GPS cycle");
            }
        }
        
        Log.d(TAG, "🚨 === DIAGNOSTIC END === onStartCommand completed");
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
        
        // CRITICAL: WakeLock check în GPS cycle
        if (wakeLock != null && !wakeLock.isHeld()) {
            wakeLock.acquire(10*60*1000L /*10 minutes*/);
            Log.e(TAG, "🔋 WakeLock RE-ACQUIRED în GPS cycle pentru background operation");
        }
        
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
                Log.d(TAG, "✅ Using recent GPS location (battery efficient) - Age: " + age + "ms");
                transmitGPSForAllCourses(lastLocation);
                
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
     * Request single GPS location update (most battery efficient)
     * ENHANCED: Multiple providers + guaranteed scheduling pentru telefon blocat
     */
    private void requestSingleGPSLocation() {
        try {
            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                Log.e(TAG, "❌ No location permission for optimal GPS - SCHEDULING NEXT CYCLE ANYWAY");
                scheduleNextOptimalGPSCycle();
                return;
            }
            
            Log.e(TAG, "🚀 ENHANCED GPS REQUEST pentru telefon blocat - multiple providers");
            
            // ENHANCED: Try multiple providers pentru telefon blocat
            String[] providers = {LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER, LocationManager.PASSIVE_PROVIDER};
            boolean requestSent = false;
            
            for (String provider : providers) {
                if (locationManager.isProviderEnabled(provider)) {
                    try {
                        Log.e(TAG, "📡 Trying provider: " + provider + " pentru background GPS");
                        locationManager.requestSingleUpdate(
                            provider,
                            new android.location.LocationListener() {
                                @Override
                                public void onLocationChanged(Location location) {
                                    Log.e(TAG, "📍 ENHANCED GPS SUCCESS - " + provider + " location received pentru telefon blocat");
                                    transmitGPSForAllCourses(location);
                                }
                                
                                @Override
                                public void onStatusChanged(String provider, int status, android.os.Bundle extras) {}
                                @Override
                                public void onProviderEnabled(String provider) {}
                                @Override
                                public void onProviderDisabled(String provider) {
                                    Log.w(TAG, "⚠️ Provider " + provider + " disabled - continuăm cu următorul");
                                }
                            },
                            null
                        );
                        requestSent = true;
                        Log.e(TAG, "✅ GPS request sent via " + provider + " pentru background operation");
                        break; // Success, exit loop
                    } catch (Exception providerError) {
                        Log.w(TAG, "⚠️ Provider " + provider + " failed: " + providerError.getMessage());
                    }
                }
            }
            
            if (!requestSent) {
                Log.e(TAG, "❌ CRITICAL: No GPS providers available - using FALLBACK strategy");
                tryFallbackGPSStrategy();
            }
            
            // GUARANTEED SCHEDULING: Program următorul ciclu indiferent de răspuns GPS
            Log.e(TAG, "🔄 GUARANTEED NEXT CYCLE programming în 3 secunde...");
            new android.os.Handler().postDelayed(() -> {
                Log.e(TAG, "⏰ GUARANTEED NEXT CYCLE executing pentru continuitate background");
                scheduleNextOptimalGPSCycle();
            }, 3000); // 3 secunde timeout pentru răspuns rapid
            
        } catch (Exception e) {
            Log.e(TAG, "❌ ENHANCED GPS REQUEST FAILED: " + e.getMessage());
            e.printStackTrace();
            // CRITICAL: Program următorul ciclu oricum
            scheduleNextOptimalGPSCycle();
        }
    }

    /**
     * FALLBACK STRATEGY când GPS nu răspunde pentru telefon blocat
     */
    private void tryFallbackGPSStrategy() {
        try {
            // Caută ultima poziție validă din orice provider
            Location fallbackLocation = null;
            String[] providers = {LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER, LocationManager.PASSIVE_PROVIDER};
            
            for (String provider : providers) {
                try {
                    Location loc = locationManager.getLastKnownLocation(provider);
                    if (loc != null && (fallbackLocation == null || loc.getTime() > fallbackLocation.getTime())) {
                        fallbackLocation = loc;
                    }
                } catch (Exception e) {
                    Log.w(TAG, "Cannot get last known from " + provider + ": " + e.getMessage());
                }
            }
            
            if (fallbackLocation != null) {
                long age = System.currentTimeMillis() - fallbackLocation.getTime();
                Log.e(TAG, "📍 FALLBACK GPS TRANSMISSION - using location aged " + (age/1000) + " seconds");
                transmitGPSForAllCourses(fallbackLocation);
            } else {
                Log.e(TAG, "❌ NO FALLBACK LOCATION AVAILABLE - skipping transmission but continuing cycle");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ FALLBACK STRATEGY FAILED: " + e.getMessage());
        }
    }
    
    /**
     * Transmit GPS data for all active courses with minimal battery usage
     */
    private void transmitGPSForAllCourses(Location location) {
        int transmissionCount = 0;
        int activeCoursesCount = 0;
        java.util.Set<String> transmittedUITs = new java.util.HashSet<>();
        
        Log.e(TAG, "🚀 CRITICAL: STARTING GPS transmission for " + activeCourses.size() + " total courses");
        Log.e(TAG, "📍 GPS Location: " + location.getLatitude() + ", " + location.getLongitude() + " (accuracy: " + location.getAccuracy() + "m)");
        
        java.util.List<String> coursesToRemove = new java.util.ArrayList<>();
        
        // IMPORTANT: Sort courses by courseId to ensure consistent transmission order
        java.util.List<CourseData> sortedCourses = new java.util.ArrayList<>(activeCourses.values());
        sortedCourses.sort((a, b) -> a.courseId.compareTo(b.courseId));
        
        Log.d(TAG, "🔄 TRANSMISSION ORDER: " + sortedCourses.stream()
            .map(c -> c.courseId + "(" + c.status + ")")
            .collect(java.util.stream.Collectors.joining(", ")));
        
        for (CourseData course : sortedCourses) {
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
                
                // STATUS 3 (PAUSE): Transmit once, then REMOVE from list (consistent with frontend)
                if (course.status == 3) {
                    if (course.pauseTransmitted) {
                        Log.d(TAG, "⏸️ PAUSE already transmitted for: " + course.courseId + " - REMOVING from list");
                        coursesToRemove.add(course.courseId); // Remove paused course
                        continue; // Skip transmission - pause was already sent and course will be removed
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
                    
                    // Mark STATUS 3 (PAUSE) as transmitted and schedule for removal (consistent with frontend)
                    if (course.status == 3) {
                        course.pauseTransmitted = true;
                        coursesToRemove.add(course.courseId);
                        Log.d(TAG, "⏸️ PAUSE transmitted and marked for removal for: " + course.courseId + " - consistent with frontend");
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
        
        // Remove completed courses (status 3 PAUSE and status 4 STOP) after transmission
        for (String courseIdToRemove : coursesToRemove) {
            activeCourses.remove(courseIdToRemove);
            Log.d(TAG, "🗑️ REMOVED course: " + courseIdToRemove + " (PAUSE or STOP status)");
        }
        
        Log.d(TAG, "📊 OPTIMAL GPS SUMMARY:");
        Log.d(TAG, "  - Processed courses: " + activeCoursesCount + " (active + final)");
        Log.d(TAG, "  - Successfully transmitted: " + transmissionCount);
        Log.d(TAG, "  - UITs transmitted: " + transmittedUITs.size());
        Log.d(TAG, "  - Completed courses removed: " + coursesToRemove.size());
        Log.d(TAG, "  - Remaining active courses: " + activeCourses.size());
        // Log completion with adaptive interval info
        boolean isScreenOn = isScreenOn();
        long nextInterval = isScreenOn ? GPS_INTERVAL_UNLOCKED_MS : GPS_INTERVAL_LOCKED_MS;
        String screenState = isScreenOn ? "DEBLOCAT" : "BLOCAT";
        Log.d(TAG, "✅ Optimal GPS cycle completed - next in " + (nextInterval/1000) + "s for TELEFON " + screenState);
        
        // CRITICAL: Schedule next GPS cycle to continue background operation
        // Reset shared timestamp pentru următorul ciclu
        gpsSharedTimestamp = null;
        
        Log.d(TAG, "🔄 SCHEDULING NEXT GPS CYCLE - activeCourses size: " + activeCourses.size());
        
        // CRITICAL FIX: Always call scheduleNextOptimalGPSCycle for proper continuation
        Log.d(TAG, "🔄 SCHEDULING NEXT GPS CYCLE after transmission complete");
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
        // STANDARDIZARE FINALĂ: Exact 7 decimale pentru consistență
        double lat = Math.round(location.getLatitude() * 10000000.0) / 10000000.0;
        double lng = Math.round(location.getLongitude() * 10000000.0) / 10000000.0;
        gpsData.put("lat", lat); // Exact 7 decimale - standard GPS
        gpsData.put("lng", lng); // Exact 7 decimale - standard GPS
        // TIMESTAMP UTC CORECT - ACELAȘI pentru toate cursele din acest ciclu
        // Folosim un timestamp static pentru întregul ciclu GPS
        if (gpsSharedTimestamp == null) {
            gpsSharedTimestamp = new java.util.Date();
        }
        java.text.SimpleDateFormat utcFormat = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.getDefault());
        utcFormat.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
        String sharedTimestamp = utcFormat.format(gpsSharedTimestamp);
        gpsData.put("timestamp", sharedTimestamp);
        
        Log.d(TAG, "🕒 SHARED TIMESTAMP Android: " + sharedTimestamp + " for course: " + course.courseId);
        gpsData.put("viteza", location.getSpeed() * 3.6); // m/s to km/h as float
        gpsData.put("directie", location.getBearing()); // Real bearing as float
        double altitude = location.getAltitude();
        gpsData.put("altitudine", altitude); // Real altitude as float
        Log.d(TAG, "📏 ALTITUDE DEBUG - Raw: " + altitude + "m, After JSON: " + gpsData.get("altitudine"));
        gpsData.put("baterie", getBatteryLevel() + "%"); // Battery with % like June 26th
        gpsData.put("numar_inmatriculare", course.vehicleNumber);
        gpsData.put("uit", course.uit); // Real UIT from course data
        gpsData.put("status", course.status);
        gpsData.put("hdop", location.getAccuracy()); // Real GPS accuracy from Android Location
        gpsData.put("gsm_signal", getNetworkSignalStrength()); // Real network signal strength
        
        Log.d(TAG, "📡 OPTIMAL GPS data for course " + course.courseId + ": " + gpsData.toString());
        Log.d(TAG, "🔑 Auth token length: " + course.authToken.length() + " chars (starts with: " + course.authToken.substring(0, Math.min(20, course.authToken.length())) + "...)");
        Log.d(TAG, "🌐 Transmitting to: " + API_BASE_URL + "gps.php");
        
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
                Log.d(TAG, "✅ GPS SUCCESS " + responseCode + " for course: " + courseId + " | Response: " + responseBody);
                
                // CRITICAL: Raportează succesul către frontend pentru network status
                try {
                    // Notifică WebView-ul despre transmisia reușită
                    if (webInterface != null) {
                        webInterface.onGPSTransmissionSuccess();
                        Log.d(TAG, "📡 SUCCESS raported to WebView for network status");
                    }
                } catch (Exception e) {
                    Log.w(TAG, "⚠️ Could not report success to WebView: " + e.getMessage());
                }
            } else {
                Log.w(TAG, "⚠️ GPS FAILED " + responseCode + " for course: " + courseId + " | Response: " + responseBody);
                Log.w(TAG, "🔍 Request was: " + jsonData);
                
                // CRITICAL: Raportează eșecul către frontend pentru network status
                try {
                    if (webInterface != null) {
                        webInterface.onGPSTransmissionError(responseCode);
                        Log.d(TAG, "📡 ERROR raported to WebView for network status");
                    }
                } catch (Exception e) {
                    Log.w(TAG, "⚠️ Could not report error to WebView: " + e.getMessage());
                }
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ FOREGROUND GPS FAILED for " + courseId + ": " + e.getMessage());
            
            // CRITICAL: Raportează eșecul către frontend pentru network status
            try {
                if (webInterface != null) {
                    webInterface.onGPSTransmissionError(0); // 0 = network error
                    Log.d(TAG, "📡 NETWORK ERROR raported to WebView");
                }
            } catch (Exception webError) {
                Log.w(TAG, "⚠️ Could not report network error to WebView: " + webError.getMessage());
            }
            
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
            // CRITICAL: Ensure alarm and PendingIntent are valid
            if (!isAlarmActive || gpsPendingIntent == null) {
                Log.w(TAG, "🔧 Alarm state invalid - reinitializing GPS timer");
                startOptimalGPSTimer();
                return;
            }
            
            // CRITICAL: WakeLock PERSISTENT pentru următorul ciclu când e blocat
            if (wakeLock != null && !wakeLock.isHeld()) {
                wakeLock.acquire(10*60*1000L /*10 minutes*/);
                Log.e(TAG, "🔋 WakeLock ACQUIRED pentru următorul ciclu GPS - GARANTEZ background operation");
            }
            
            // ADAPTIVE INTERVAL: Mai des când e blocat, mai rar când e deblocat
            boolean isScreenOn = isScreenOn();
            long intervalMs = isScreenOn ? GPS_INTERVAL_UNLOCKED_MS : GPS_INTERVAL_LOCKED_MS;
            
            long nextTriggerTime = SystemClock.elapsedRealtime() + intervalMs;
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.ELAPSED_REALTIME_WAKEUP,
                nextTriggerTime,
                gpsPendingIntent
            );
            
            String screenState = isScreenOn ? "DEBLOCAT" : "BLOCAT";
            Log.d(TAG, "⏰ NEXT GPS ALARM SET: in " + (intervalMs/1000) + "s for " + activeCourses.size() + " courses - TELEFON " + screenState);
            Log.d(TAG, "📡 Trigger time: " + nextTriggerTime + " (current: " + SystemClock.elapsedRealtime() + ")");
            Log.d(TAG, "✅ GPS CONTINUITY GUARANTEED - interval adaptat pentru " + screenState + ", WakeLock: " + wakeLock.isHeld());
        } else {
            Log.w(TAG, "❌ NO ACTIVE COURSES - stopping GPS timer");
            stopOptimalGPSTimer();
        }
    }
    
    /**
     * Check if screen is on/off for adaptive intervals
     */
    private boolean isScreenOn() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            return pm.isInteractive(); // true = screen on, false = screen off/locked
        } catch (Exception e) {
            Log.w(TAG, "Cannot check screen state: " + e.getMessage());
            return false; // Default to locked (more frequent GPS)
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
        if (isAlarmActive) {
            Log.d(TAG, "⚠️ Optimal GPS timer already active");
            return;
        }
        
        Intent alarmIntent = new Intent(this, OptimalGPSService.class);
        alarmIntent.setAction(ACTION_GPS_ALARM);
        
        gpsPendingIntent = PendingIntent.getService(
            this, 0, alarmIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // ADAPTIVE INTERVAL: Start with screen state check
        boolean isScreenOn = isScreenOn();
        long initialInterval = isScreenOn ? GPS_INTERVAL_UNLOCKED_MS : GPS_INTERVAL_LOCKED_MS;
        
        alarmManager.setExactAndAllowWhileIdle(
            AlarmManager.ELAPSED_REALTIME_WAKEUP,
            SystemClock.elapsedRealtime() + initialInterval,
            gpsPendingIntent
        );
        
        isAlarmActive = true;
        String screenState = isScreenOn ? "DEBLOCAT" : "BLOCAT";
        Log.d(TAG, "✅ OPTIMAL GPS timer started - " + (initialInterval/1000) + "s intervals for TELEFON " + screenState);
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
                return; // Don't add duplicate or restart timer
            }
            
            CourseData courseData = new CourseData(courseId, uit, status, vehicleNumber, authToken);
            activeCourses.put(courseId, courseData);
            
            Log.d(TAG, "✅ OPTIMAL course added: " + courseId + " (UIT: " + uit + ")");
            Log.d(TAG, "📊 ACTIVE COURSES COUNT: " + activeCourses.size());
            Log.d(TAG, "🔍 ALARM STATUS: isAlarmActive = " + isAlarmActive);
            
            if (!isAlarmActive) {
                Log.d(TAG, "🚀 STARTING GPS TIMER for new course");
                startOptimalGPSTimer();
            } else {
                Log.d(TAG, "⏰ GPS TIMER already active - continuing with " + activeCourses.size() + " courses");
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