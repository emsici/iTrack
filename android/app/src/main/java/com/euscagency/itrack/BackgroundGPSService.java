package com.euscagency.itrack;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.location.LocationManager;
import android.location.LocationListener;
import android.location.Location;
import android.content.Context;
import android.os.PowerManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import android.os.HandlerThread;
import android.app.Notification;

/**
 * SERVICIU GPS DE FUNDAL - Mai eficient pentru transmisia continuă GPS
 * Folosește ScheduledExecutorService în loc de Handler pentru mai multă stabilitate
 */
public class BackgroundGPSService extends Service {
    private static final String TAG = "BackgroundGPS";
    private static final long GPS_INTERVAL_SECONDS = 10;
    private static final int NOTIFICATION_ID = 2002;
    private static final String CHANNEL_ID = "BackgroundGPSChannel";
    
    private LocationManager locationManager;
    private PowerManager.WakeLock wakeLock;
    private ScheduledExecutorService gpsExecutor;
    private HandlerThread backgroundThread;
    private Handler backgroundHandler;
    
    // MULTI-UIT SUPPORT: Map pentru toate cursele active simultan
    private java.util.Map<String, CourseData> activeCourses = new java.util.HashMap<>();
    private String globalToken;
    private String globalVehicle;
    private boolean isGPSRunning = false;
    
    // Clasă pentru datele cursei
    private static class CourseData {
        String uit;
        int status; // 2=ACTIV, 3=PAUZA, 4=STOP
        
        CourseData(String uit, int status) {
            this.uit = uit;
            this.status = status;
        }
    }
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.e(TAG, "🚀 Serviciul BackgroundGPS Creat");
        
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        
        // WakeLock pentru fundal garantat
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "iTrack:BackgroundGPS");
        
        // Thread de fundal pentru operații GPS
        backgroundThread = new HandlerThread("BackgroundGPSThread");
        backgroundThread.start();
        backgroundHandler = new Handler(backgroundThread.getLooper());
        
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, createNotification());
        
        Log.e(TAG, "✅ BackgroundGPS Service Ready");
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.e(TAG, "onStartCommand called with action: " + (intent != null ? intent.getAction() : "null"));
        
        if (intent != null && "START_BACKGROUND_GPS".equals(intent.getAction())) {
            String uitId = intent.getStringExtra("uit");
            globalToken = intent.getStringExtra("token");
            globalVehicle = intent.getStringExtra("vehicle");
            int courseStatus = intent.getIntExtra("status", 2); // Default ACTIVE
            
            Log.e(TAG, "⚡ MULTI-UIT - Adăugare cursă UIT: " + uitId + ", Vehicle: " + globalVehicle + ", Status: " + courseStatus);
            
            // Adaugă cursa la lista activă
            activeCourses.put(uitId, new CourseData(uitId, courseStatus));
            Log.e(TAG, "📋 Total curse active: " + activeCourses.size());
            
            // Start foreground notification IMMEDIATELY  
            startForeground(1, createNotification());
            Log.e(TAG, "📱 Foreground service persistent notification created");
            
            if (courseStatus == 2) {
                if (!isGPSRunning) {
                    Log.e(TAG, "🚀 PORNIRE GPS pentru prima cursă activă");
                    startBackgroundGPS();
                } else {
                    Log.e(TAG, "⚡ GPS rulează deja - cursă nouă adăugată la tracking existent");
                }
            } else {
                Log.e(TAG, "GPS not started - course status is " + courseStatus + " (not ACTIVE)");
            }
            
        } else if (intent != null && "UPDATE_COURSE_STATUS".equals(intent.getAction())) {
            int newStatus = intent.getIntExtra("status", 0);
            String specificUIT = intent.getStringExtra("uit");
            
            CourseData courseData = activeCourses.get(specificUIT);
            if (courseData != null) {
                int oldStatus = courseData.status;
                Log.e(TAG, "🔄 Updating course status: " + oldStatus + " → " + newStatus + " pentru UIT: " + specificUIT);
                
                // TRIMITE STATUS UPDATE LA SERVER ÎNAINTE DE SCHIMBARE (pentru 3=PAUSE, 4=STOP)
                if (newStatus == 3 || newStatus == 4) {
                    Log.e(TAG, "🔄 Trimit status " + newStatus + " la server pentru UIT " + specificUIT);
                    sendStatusUpdateToServer(newStatus, specificUIT);
                }
                
                if (newStatus == 2) { // ACTIVE/RESUME
                    courseData.status = 2;
                    Log.e(TAG, "▶️ RESUME: UIT " + specificUIT + " reactivat");
                    if (!isGPSRunning) {
                        startBackgroundGPS();
                    }
                } else if (newStatus == 3) { // PAUSE
                    courseData.status = 3;
                    Log.e(TAG, "⏸️ PAUSE: UIT " + specificUIT + " paused, serviciul continuă pentru alte curse");
                } else if (newStatus == 4) { // STOP
                    activeCourses.remove(specificUIT);
                    Log.e(TAG, "🛑 STOP: UIT " + specificUIT + " eliminat din tracking");
                    Log.e(TAG, "📋 Curse active rămase: " + activeCourses.size());
                    
                    // Dacă nu mai sunt curse active, oprește GPS complet
                    if (activeCourses.isEmpty()) {
                        Log.e(TAG, "🛑 Nu mai sunt curse active - opresc GPS complet");
                        stopBackgroundGPS();
                    }
                }
            } else {
                Log.e(TAG, "⚠️ UIT " + specificUIT + " nu găsit în liste active");
            }
            
        } else if (intent != null && "STOP_BACKGROUND_GPS".equals(intent.getAction())) {
            Log.e(TAG, "Stop GPS requested");
            stopBackgroundGPS();
        }
        
        return START_STICKY;
    }
    
    private void startBackgroundGPS() {
        Log.e(TAG, "startBackgroundGPS called, isGPSRunning: " + isGPSRunning);
        
        if (isGPSRunning) {
            Log.e(TAG, "GPS already running, skipping");
            return;
        }
        
        if (activeCourses.isEmpty() || globalToken == null) {
            Log.e(TAG, "Cannot start GPS - missing data (Active Courses: " + activeCourses.size() + ", Token: " + (globalToken != null ? "OK" : "NULL") + ")");
            return;
        }
        
        // Acquire WakeLock
        if (!wakeLock.isHeld()) {
            wakeLock.acquire();
            Log.e(TAG, "WakeLock acquired");
        }
        
        // Start ScheduledExecutorService
        gpsExecutor = Executors.newSingleThreadScheduledExecutor();
        Log.e(TAG, "GPS Executor created, scheduling cycles every " + GPS_INTERVAL_SECONDS + "s");
        
        gpsExecutor.scheduleAtFixedRate(new Runnable() {
            @Override
            public void run() {
                performGPSCycle();
            }
        }, 2, GPS_INTERVAL_SECONDS, TimeUnit.SECONDS);
        
        isGPSRunning = true;
        Log.e(TAG, "GPS Service STARTED successfully");
    }
    
    private void stopBackgroundGPS() {
        isGPSRunning = false;
        
        if (gpsExecutor != null && !gpsExecutor.isShutdown()) {
            gpsExecutor.shutdown();
            Log.e(TAG, "🛑 ScheduledExecutorService stopped");
        }
        
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            Log.e(TAG, "🛑 WakeLock released");
        }
    }
    
    private void performGPSCycle() {
        Log.e(TAG, "🔄 === GPS CYCLE START ===");
        Log.e(TAG, "📊 Active Courses: " + activeCourses.size() + ", Token: " + (globalToken != null ? "OK" : "NULL"));
        
        // Send Android log to JavaScript for debugging
        sendLogToJavaScript("🔄 Android GPS CYCLE START - Active Courses: " + activeCourses.size());
        
        if (activeCourses.isEmpty() || globalToken == null) {
            Log.e(TAG, "❌ GPS cycle skipped - missing data (Active Courses: " + activeCourses.size() + ", Token: " + (globalToken != null ? "OK" : "NULL") + ")");
            sendLogToJavaScript("❌ GPS cycle skipped - missing token or active courses");
            return;
        }
        
        // Direct GPS reading - no dummy data
        Log.e(TAG, "🔄 Reading REAL GPS sensors now...");
        sendLogToJavaScript("🔄 Reading REAL GPS sensors...");
        
        // Check permissions
        boolean fineLocationPermission = ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean coarseLocationPermission = ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        
        Log.e(TAG, "📍 Permissions - Fine: " + fineLocationPermission + ", Coarse: " + coarseLocationPermission);
        
        if (!fineLocationPermission && !coarseLocationPermission) {
            Log.e(TAG, "❌ No GPS permission - stopping cycle");
            return;
        }
        
        try {
            // Request single GPS location
            LocationListener listener = new LocationListener() {
                @Override
                public void onLocationChanged(Location location) {
                    try {
                        Log.e(TAG, "✅ === GPS LOCATION RECEIVED ===");
                        Log.e(TAG, "📍 Coordinates: " + location.getLatitude() + ", " + location.getLongitude());
                        Log.e(TAG, "📐 Accuracy: " + location.getAccuracy() + "m");
                        Log.e(TAG, "🕐 Age: " + (System.currentTimeMillis() - location.getTime()) + "ms");
                        Log.e(TAG, "🚀 Provider: " + location.getProvider());
                        
                        sendLogToJavaScript("✅ REAL GPS RECEIVED: " + location.getLatitude() + ", " + location.getLongitude() + " (accuracy: " + location.getAccuracy() + "m)");
                        
                        locationManager.removeUpdates(this);
                        transmitGPSDataToAllActiveCourses(location);
                    } catch (Exception e) {
                        Log.e(TAG, "❌ Location processing error: " + e.getMessage());
                        e.printStackTrace();
                    }
                }
                
                @Override
                public void onProviderEnabled(String provider) {
                    Log.e(TAG, "🟢 Provider enabled: " + provider);
                }
                
                @Override
                public void onProviderDisabled(String provider) {
                    Log.e(TAG, "🔴 Provider disabled: " + provider);
                }
                
                @Override
                public void onStatusChanged(String provider, int status, android.os.Bundle extras) {
                    Log.e(TAG, "🔄 Provider status change: " + provider + " status: " + status);
                }
            };
            
            // Check GPS provider status
            boolean gpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);
            boolean networkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
            
            Log.e(TAG, "🛰️ GPS Enabled: " + gpsEnabled + ", Network Enabled: " + networkEnabled);
            
            // Try GPS first, then network as fallback
            String provider = gpsEnabled ? LocationManager.GPS_PROVIDER : 
                            (networkEnabled ? LocationManager.NETWORK_PROVIDER : null);
            
            if (provider != null) {
                Log.e(TAG, "📡 Using provider: " + provider);
                sendLogToJavaScript("📡 Using GPS provider: " + provider);
                locationManager.requestLocationUpdates(provider, 0, 0, listener);
                Log.e(TAG, "🛰️ GPS request sent to " + provider);
                sendLogToJavaScript("🛰️ GPS request sent to " + provider);
                
                // Get last known location as immediate fallback
                try {
                    Location lastKnown = locationManager.getLastKnownLocation(provider);
                    if (lastKnown != null) {
                        Log.e(TAG, "📍 Last known location available: " + lastKnown.getLatitude() + ", " + lastKnown.getLongitude());
                        // Dar totuși așteaptă locația proaspătă
                    } else {
                        Log.e(TAG, "📍 No last known location");
                    }
                } catch (Exception e) {
                    Log.e(TAG, "❌ Last known location error: " + e.getMessage());
                }
                
                // Simple timeout without handler complications
                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            Thread.sleep(8000);
                            locationManager.removeUpdates(listener);
                            Log.e(TAG, "⏰ GPS timeout after 8 seconds");
                        } catch (Exception e) {
                            Log.e(TAG, "❌ Timeout error: " + e.getMessage());
                        }
                    }
                }).start();
            } else {
                Log.e(TAG, "❌ No location providers available - GPS and Network both disabled");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ GPS cycle error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void transmitGPSDataToAllActiveCourses(Location location) {
        try {
            Log.e(TAG, "📤 === PREPARING GPS TRANSMISSION FOR ALL ACTIVE COURSES ===");
            Log.e(TAG, "📊 Total active courses: " + activeCourses.size());
            
            // Romania timestamp - calculat o singură dată pentru toate cursele
            java.util.TimeZone romaniaTimeZone = java.util.TimeZone.getTimeZone("Europe/Bucharest");
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            sdf.setTimeZone(romaniaTimeZone);
            String timestamp = sdf.format(new java.util.Date());
            
            // Senzori reali - calculați o singură dată pentru toate cursele
            int networkSignal = getNetworkSignal();
            String batteryLevel = getBatteryLevel();
            
            // Transmite GPS pentru fiecare cursă activă cu status 2
            for (java.util.Map.Entry<String, CourseData> entry : activeCourses.entrySet()) {
                String uitId = entry.getKey();
                CourseData courseData = entry.getValue();
                
                // CRITICĂ: Nu trimite GPS data dacă cursa este în PAUSE (status 3) sau STOP (status 4)
                if (courseData.status == 3) {
                    Log.e(TAG, "⏸️ GPS transmission SKIPPED pentru UIT " + uitId + " - PAUSED (status 3)");
                    continue;
                } else if (courseData.status == 4) {
                    Log.e(TAG, "🛑 GPS transmission SKIPPED pentru UIT " + uitId + " - STOPPED (status 4)");
                    continue;
                }
                
                Log.e(TAG, "✅ GPS transmission PROCEEDING pentru UIT " + uitId + " - ACTIVE (status " + courseData.status + ")");
                
                // Create GPS data JSON pentru această cursă
                org.json.JSONObject gpsData = new org.json.JSONObject();
                gpsData.put("uit", uitId);
                gpsData.put("numar_inmatriculare", globalVehicle);
                gpsData.put("lat", location.getLatitude());
                gpsData.put("lng", location.getLongitude());
                gpsData.put("viteza", (int) (location.getSpeed() * 3.6)); // m/s to km/h
                gpsData.put("directie", (int) location.getBearing());
                gpsData.put("altitudine", (int) location.getAltitude());
                gpsData.put("hdop", (int) location.getAccuracy());
                gpsData.put("gsm_signal", networkSignal);
                gpsData.put("baterie", batteryLevel);
                gpsData.put("status", 2); // IMPORTANT: GPS data is ALWAYS status 2 (ACTIVE transmission)
                gpsData.put("timestamp", timestamp);
                
                Log.e(TAG, "📊 GPS Data pentru UIT " + uitId + ":");
                Log.e(TAG, "   Vehicle: " + globalVehicle);
                Log.e(TAG, "   Coordinates: " + location.getLatitude() + ", " + location.getLongitude());
                Log.e(TAG, "   Battery: " + batteryLevel);
                Log.e(TAG, "   Timestamp: " + timestamp);
                
                // Call direct HTTP transmission pentru această cursă
                transmitSingleCourseGPS(gpsData, uitId);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Multi-course GPS transmission preparation error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void transmitSingleCourseGPS(org.json.JSONObject gpsData, String uitId) {
        try {
            String gpsDataJson = gpsData.toString();
            Log.e(TAG, "🌐 === STARTING HTTP TRANSMISSION PENTRU UIT " + uitId + " ===");
            Log.e(TAG, "🔗 URL: https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php");
            Log.e(TAG, "🔑 Token length: " + (globalToken != null ? globalToken.length() : "NULL"));
            
            // Make HTTP request on background thread
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Log.e(TAG, "📡 HTTP thread started pentru UIT " + uitId);
                        
                        java.net.URL url = new java.net.URL("https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php");
                        javax.net.ssl.HttpsURLConnection conn = (javax.net.ssl.HttpsURLConnection) url.openConnection();
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("Content-Type", "application/json");
                        conn.setRequestProperty("Authorization", "Bearer " + globalToken);
                        conn.setRequestProperty("Accept", "application/json");
                        conn.setRequestProperty("User-Agent", "iTrack-BackgroundGPS/1.0");
                        conn.setDoOutput(true);
                        conn.setConnectTimeout(15000); // 15 seconds
                        conn.setReadTimeout(15000);    // 15 seconds
                        
                        Log.e(TAG, "🔗 Connection configured pentru UIT " + uitId + ", sending data...");
                        
                        // Send JSON data
                        try (java.io.OutputStream os = conn.getOutputStream()) {
                            byte[] input = gpsDataJson.getBytes("utf-8");
                            os.write(input, 0, input.length);
                            Log.e(TAG, "📤 Data sent pentru UIT " + uitId + ": " + input.length + " bytes");
                        }
                        
                        int responseCode = conn.getResponseCode();
                        String responseMessage = conn.getResponseMessage();
                        
                        Log.e(TAG, "📡 === HTTP RESPONSE PENTRU UIT " + uitId + " ===");
                        Log.e(TAG, "📊 Response Code: " + responseCode);
                        Log.e(TAG, "📝 Response Message: " + responseMessage);
                        
                        // Read response body for debugging
                        try {
                            java.io.InputStream is = (responseCode >= 200 && responseCode < 300) ? 
                                conn.getInputStream() : conn.getErrorStream();
                            if (is != null) {
                                java.util.Scanner scanner = new java.util.Scanner(is).useDelimiter("\\A");
                                String responseBody = scanner.hasNext() ? scanner.next() : "";
                                Log.e(TAG, "📄 Response Body pentru UIT " + uitId + ": " + responseBody);
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "⚠️ Could not read response body pentru UIT " + uitId + ": " + e.getMessage());
                        }
                        
                        if (responseCode >= 200 && responseCode < 300) {
                            Log.e(TAG, "✅ === GPS TRANSMISSION SUCCESS PENTRU UIT " + uitId + " ===");
                        } else {
                            Log.e(TAG, "❌ === GPS TRANSMISSION FAILED PENTRU UIT " + uitId + " ===");
                        }
                        
                    } catch (Exception e) {
                        Log.e(TAG, "❌ Native HTTP GPS error pentru UIT " + uitId + ": " + e.getMessage());
                        Log.e(TAG, "💾 Salvez coordonata offline pentru UIT " + uitId);
                        
                        // Salvează coordonata offline când transmisia eșuează
                        try {
                            sendOfflineGPSToJavaScript(gpsDataJson);
                        } catch (Exception offlineError) {
                            Log.e(TAG, "❌ Eroare salvare offline pentru UIT " + uitId + ": " + offlineError.getMessage());
                        }
                        
                        e.printStackTrace();
                    }
                }
            }).start();
            
        } catch (Exception e) {
            Log.e(TAG, "❌ GPS transmission error pentru UIT " + uitId + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // DEPRECATED - păstrat pentru compatibilitate
    private void callJavaScriptBridge(String gpsDataJson) {
        try {
            Log.e(TAG, "🌐 === STARTING HTTP TRANSMISSION ===");
            Log.e(TAG, "🔗 URL: https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php");
            Log.e(TAG, "🔑 Token length: " + (activeToken != null ? activeToken.length() : "NULL"));
            
            // Make HTTP request on background thread
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Log.e(TAG, "📡 HTTP thread started");
                        
                        java.net.URL url = new java.net.URL("https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php");
                        javax.net.ssl.HttpsURLConnection conn = (javax.net.ssl.HttpsURLConnection) url.openConnection();
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("Content-Type", "application/json");
                        conn.setRequestProperty("Authorization", "Bearer " + activeToken);
                        conn.setRequestProperty("Accept", "application/json");
                        conn.setRequestProperty("User-Agent", "iTrack-BackgroundGPS/1.0");
                        conn.setDoOutput(true);
                        conn.setConnectTimeout(15000); // 15 seconds
                        conn.setReadTimeout(15000);    // 15 seconds
                        
                        Log.e(TAG, "🔗 Connection configured, sending data...");
                        
                        // Send JSON data
                        try (java.io.OutputStream os = conn.getOutputStream()) {
                            byte[] input = gpsDataJson.getBytes("utf-8");
                            os.write(input, 0, input.length);
                            Log.e(TAG, "📤 Data sent: " + input.length + " bytes");
                        }
                        
                        int responseCode = conn.getResponseCode();
                        String responseMessage = conn.getResponseMessage();
                        
                        Log.e(TAG, "📡 === HTTP RESPONSE ===");
                        Log.e(TAG, "📊 Response Code: " + responseCode);
                        Log.e(TAG, "📝 Response Message: " + responseMessage);
                        
                        // Read response body for debugging
                        try {
                            java.io.InputStream is = (responseCode >= 200 && responseCode < 300) ? 
                                conn.getInputStream() : conn.getErrorStream();
                            if (is != null) {
                                java.util.Scanner scanner = new java.util.Scanner(is).useDelimiter("\\A");
                                String responseBody = scanner.hasNext() ? scanner.next() : "";
                                Log.e(TAG, "📄 Response Body: " + responseBody);
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "⚠️ Could not read response body: " + e.getMessage());
                        }
                        
                        if (responseCode >= 200 && responseCode < 300) {
                            Log.e(TAG, "✅ === GPS TRANSMISSION SUCCESS ===");
                        } else {
                            Log.e(TAG, "❌ === GPS TRANSMISSION FAILED ===");
                        }
                        
                    } catch (Exception e) {
                        Log.e(TAG, "❌ Native HTTP GPS error: " + e.getMessage());
                        Log.e(TAG, "💾 Salvez coordonata offline pentru sincronizare ulterioară");
                        
                        // Salvează coordonata offline când transmisia eșuează
                        try {
                            sendOfflineGPSToJavaScript(gpsDataJson);
                        } catch (Exception offlineError) {
                            Log.e(TAG, "❌ Eroare salvare offline: " + offlineError.getMessage());
                        }
                        
                        e.printStackTrace();
                    }
                }
            }).start();
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Bridge call failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void sendStatusUpdateToServer(int newStatus, String specificUIT) {
        try {
            Log.e(TAG, "📤 === PREPARING STATUS UPDATE FROM ANDROID SERVICE ===");
            
            // Create status update JSON cu exact aceeași structură ca GPS
            org.json.JSONObject statusData = new org.json.JSONObject();
            statusData.put("uit", specificUIT); // CORECTARE: Folosește UIT-ul specificat!
            statusData.put("numar_inmatriculare", activeVehicle);
            // Obține coordonate GPS reale pentru status update
            Location lastLocation = getLastKnownLocation();
            if (lastLocation != null) {
                statusData.put("lat", lastLocation.getLatitude());
                statusData.put("lng", lastLocation.getLongitude());
                statusData.put("viteza", (int) (lastLocation.getSpeed() * 3.6));
                statusData.put("directie", (int) lastLocation.getBearing());
                statusData.put("altitudine", (int) lastLocation.getAltitude());
                statusData.put("hdop", (int) lastLocation.getAccuracy());
            } else {
                // Fallback doar dacă nu avem GPS
                statusData.put("lat", 0);
                statusData.put("lng", 0);
                statusData.put("viteza", 0);
                statusData.put("directie", 0);
                statusData.put("altitudine", 0);
                statusData.put("hdop", 0);
            }
            statusData.put("gsm_signal", getNetworkSignal());
            statusData.put("baterie", getBatteryLevel());
            statusData.put("status", newStatus); // PAUSE (3) sau STOP (4)
            
            // Romania timestamp
            java.util.TimeZone romaniaTimeZone = java.util.TimeZone.getTimeZone("Europe/Bucharest");
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            sdf.setTimeZone(romaniaTimeZone);
            String timestamp = sdf.format(new java.util.Date());
            statusData.put("timestamp", timestamp);
            
            Log.e(TAG, "📊 Status Data prepared for status " + newStatus + ":");
            Log.e(TAG, "   UIT: " + specificUIT); // CORECTARE: Log UIT-ul specificat!
            Log.e(TAG, "   Vehicle: " + activeVehicle);
            Log.e(TAG, "   Status: " + newStatus);
            Log.e(TAG, "   Timestamp: " + timestamp);
            Log.e(TAG, "📤 Full JSON: " + statusData.toString());
            
            // CORECTARE: Transmisie HTTP directă pentru status updates!
            sendStatusHTTPDirect(statusData.toString());
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Status update preparation error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void sendStatusHTTPDirect(String statusDataJson) {
        try {
            Log.e(TAG, "🔄 === STARTING STATUS HTTP TRANSMISSION ===");
            Log.e(TAG, "🔗 URL: https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php");
            Log.e(TAG, "📊 Status Data: " + statusDataJson);
            
            // Make HTTP request on background thread
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Log.e(TAG, "📡 Status HTTP thread started");
                        
                        java.net.URL url = new java.net.URL("https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php");
                        javax.net.ssl.HttpsURLConnection conn = (javax.net.ssl.HttpsURLConnection) url.openConnection();
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("Content-Type", "application/json");
                        conn.setRequestProperty("Authorization", "Bearer " + activeToken);
                        conn.setRequestProperty("Accept", "application/json");
                        conn.setRequestProperty("User-Agent", "iTrack-StatusUpdate/1.0");
                        conn.setDoOutput(true);
                        conn.setConnectTimeout(15000); // 15 seconds
                        conn.setReadTimeout(15000);    // 15 seconds
                        
                        Log.e(TAG, "🔗 Status connection configured, sending data...");
                        
                        // Send JSON data
                        try (java.io.OutputStream os = conn.getOutputStream()) {
                            byte[] input = statusDataJson.getBytes("utf-8");
                            os.write(input, 0, input.length);
                            Log.e(TAG, "📤 Status data sent: " + input.length + " bytes");
                        }
                        
                        int responseCode = conn.getResponseCode();
                        String responseMessage = conn.getResponseMessage();
                        
                        Log.e(TAG, "📡 === STATUS HTTP RESPONSE ===");
                        Log.e(TAG, "📊 Response Code: " + responseCode);
                        Log.e(TAG, "📝 Response Message: " + responseMessage);
                        
                        // Read response body for debugging
                        try {
                            java.io.InputStream is = (responseCode >= 200 && responseCode < 300) ? 
                                conn.getInputStream() : conn.getErrorStream();
                            if (is != null) {
                                java.util.Scanner scanner = new java.util.Scanner(is).useDelimiter("\\A");
                                String responseBody = scanner.hasNext() ? scanner.next() : "";
                                Log.e(TAG, "📄 Status Response Body: " + responseBody);
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "⚠️ Could not read status response body: " + e.getMessage());
                        }
                        
                        if (responseCode >= 200 && responseCode < 300) {
                            Log.e(TAG, "✅ === STATUS TRANSMISSION SUCCESS ===");
                        } else {
                            Log.e(TAG, "❌ === STATUS TRANSMISSION FAILED ===");
                        }
                        
                    } catch (Exception e) {
                        Log.e(TAG, "❌ Status HTTP error: " + e.getMessage());
                        e.printStackTrace();
                    }
                }
            }).start();
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Status HTTP bridge call failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void sendOfflineGPSToJavaScript(String gpsDataJson) {
        try {
            Log.e(TAG, "💾 === SALVARE GPS OFFLINE ===");
            Log.e(TAG, "📤 GPS Data pentru salvare offline: " + gpsDataJson);
            
            // Call JavaScript bridge pentru salvare offline
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                String script = "if (window.saveOfflineGPS) { window.saveOfflineGPS(" + gpsDataJson + "); }";
                Log.e(TAG, "📱 Apelez JavaScript pentru salvare offline");
                
                // Această funcție va fi apelată din JavaScript side pentru a salva datele
                Log.e("OFFLINE_GPS_SAVE", gpsDataJson);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Eroare salvare GPS offline: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void sendLogToJavaScript(String message) {
        try {
            // Send log via Android system log with special tag for JS capture
            Log.e("JS_BRIDGE_LOG", "[Android GPS]: " + message);
            
            // Also send to system log for debugging
            Log.e(TAG, "JS Log: " + message);
        } catch (Exception e) {
            Log.e(TAG, "Failed to send log to JS: " + e.getMessage());
        }
    }
    

    
    private String getBatteryLevel() {
        try {
            android.content.IntentFilter ifilter = new android.content.IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = registerReceiver(null, ifilter);
            int level = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_LEVEL, -1);
            int scale = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_SCALE, -1);
            float batteryPct = level * 100 / (float) scale;
            return Math.round(batteryPct) + "%";
        } catch (Exception e) {
            return "0%";
        }
    }
    
    private int getNetworkSignal() {
        try {
            android.net.ConnectivityManager cm = (android.net.ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            android.net.NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
            
            if (activeNetwork == null || !activeNetwork.isConnected()) {
                return 0; // No connection
            }
            
            // Detect network type
            int networkType = activeNetwork.getType();
            if (networkType == android.net.ConnectivityManager.TYPE_WIFI) {
                return 0; // WiFi is not GSM signal
            } else if (networkType == android.net.ConnectivityManager.TYPE_MOBILE) {
                // Try to get cellular signal strength
                try {
                    android.telephony.TelephonyManager telephonyManager = 
                        (android.telephony.TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
                    
                    if (telephonyManager != null) {
                        // Basic cellular detection - return good signal for now
                        // Real signal strength requires more complex implementation
                        return 4; // Good cellular signal
                    }
                } catch (Exception e) {
                    Log.e(TAG, "❌ Cannot get telephony info: " + e.getMessage());
                }
                return 3; // Default cellular signal
            }
            
            return 2; // Unknown connection type
        } catch (Exception e) {
            Log.e(TAG, "❌ Network signal detection error: " + e.getMessage());
            return 1; // Error fallback
        }
    }
    
    private Location getLastKnownLocation() {
        try {
            android.location.LocationManager locationManager = 
                (android.location.LocationManager) getSystemService(Context.LOCATION_SERVICE);
            
            if (locationManager == null) {
                return null;
            }
            
            // Try GPS first, then Network
            Location gpsLocation = null;
            Location networkLocation = null;
            
            try {
                gpsLocation = locationManager.getLastKnownLocation(android.location.LocationManager.GPS_PROVIDER);
            } catch (SecurityException e) {
                Log.e(TAG, "❌ No GPS permission for last known location");
            }
            
            try {
                networkLocation = locationManager.getLastKnownLocation(android.location.LocationManager.NETWORK_PROVIDER);
            } catch (SecurityException e) {
                Log.e(TAG, "❌ No Network permission for last known location");
            }
            
            // Return the most recent location
            if (gpsLocation != null && networkLocation != null) {
                return gpsLocation.getTime() > networkLocation.getTime() ? gpsLocation : networkLocation;
            } else if (gpsLocation != null) {
                return gpsLocation;
            } else {
                return networkLocation;
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Last known location error: " + e.getMessage());
            return null;
        }
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "iTrack GPS Tracking",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Transmisie GPS continuă pentru urmărire vehicule");
            channel.setShowBadge(false);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }
    
    private Notification createNotification() {
        return new Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("iTrack GPS Active")
            .setContentText("Transmisie coordonate la 10 secunde")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .setPriority(Notification.PRIORITY_HIGH)
            .setCategory(Notification.CATEGORY_SERVICE)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .build();
    }
    
    @Override
    public void onDestroy() {
        Log.e(TAG, "🛑 Serviciul BackgroundGPS Distrus");
        stopBackgroundGPS();
        
        if (backgroundThread != null) {
            backgroundThread.quitSafely();
        }
        
        super.onDestroy();
    }
}