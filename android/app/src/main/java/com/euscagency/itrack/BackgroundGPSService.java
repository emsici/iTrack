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
    
    private String activeToken;
    private boolean isGPSRunning = false;
    // MULTI-VEHICLE: Track all courses across all vehicles - key format: "UIT|VEHICLE"
    private java.util.Map<String, Integer> globalCourseStatuses = new java.util.HashMap<>();
    
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
            String uit = intent.getStringExtra("uit");
            activeToken = intent.getStringExtra("token");
            String vehicle = intent.getStringExtra("vehicle");
            int status = intent.getIntExtra("status", 2); // Default ACTIVE
            
            Log.e(TAG, "⚡ MULTI-VEHICLE STORAGE - UIT: " + uit + ", Vehicle: " + vehicle + ", Status: " + status);
            
            // MULTI-VEHICLE: Store with composite key "UIT|VEHICLE"
            String courseKey = uit + "|" + vehicle;
            globalCourseStatuses.put(courseKey, status);
            Log.e(TAG, "📊 Stored globally: " + courseKey + " = " + status + ". Total: " + globalCourseStatuses.size());
            
            // Start foreground notification IMMEDIATELY  
            startForeground(1, createNotification());
            Log.e(TAG, "📱 Foreground service persistent notification created");
            
            if (status == 2) {
                if (!isGPSRunning) {
                    Log.e(TAG, "🚀 PORNIRE GPS pentru prima cursă activă: " + uit);
                    startBackgroundGPS();
                } else {
                    Log.e(TAG, "⚡ GPS rulează deja - adăugare cursă " + uit + " la tracking existent");
                }
            } else {
                Log.e(TAG, "GPS not started for course " + uit + " - status is " + status + " (not ACTIVE)");
            }
            
        } else if (intent != null && "UPDATE_COURSE_STATUS".equals(intent.getAction())) {
            int newStatus = intent.getIntExtra("status", 0);
            String specificUIT = intent.getStringExtra("uit");
            String specificVehicle = intent.getStringExtra("vehicle");
            String courseKey = specificUIT + "|" + specificVehicle;
            int oldStatus = globalCourseStatuses.getOrDefault(courseKey, 0);
            
            Log.e(TAG, "MULTI-VEHICLE: Updating " + courseKey + ": " + oldStatus + " → " + newStatus);
            
            // TRIMITE STATUS UPDATE LA SERVER ÎNAINTE DE SCHIMBARE (pentru 3=PAUSE, 4=STOP)
            if (newStatus == 3 || newStatus == 4) {
                Log.e(TAG, "🔄 Trimit status " + newStatus + " pentru " + courseKey);
                sendStatusUpdateToServer(newStatus, specificUIT, specificVehicle);
            }
            
            // MULTI-VEHICLE: Update specific course status
            if (newStatus == 4) { // STOP - remove completely
                globalCourseStatuses.remove(courseKey);
                Log.e(TAG, "🛑 STOP: " + courseKey + " removed. Remaining: " + globalCourseStatuses.size());
            } else {
                globalCourseStatuses.put(courseKey, newStatus);
                Log.e(TAG, "📊 UPDATED: " + courseKey + " = " + newStatus);
            }
            
            // Check if we should continue GPS service across ALL vehicles
            boolean hasActiveCourses = false;
            for (java.util.Map.Entry<String, Integer> entry : globalCourseStatuses.entrySet()) {
                if (entry.getValue() == 2) { // ACTIVE
                    hasActiveCourses = true;
                    break;
                }
            }
            
            if (newStatus == 2) { // ACTIVE/RESUME
                Log.e(TAG, "RESUME/START: UIT " + specificUIT + " is now ACTIVE");
                if (!isGPSRunning && hasActiveCourses) {
                    startBackgroundGPS();
                }
            } else if (!hasActiveCourses && isGPSRunning) {
                Log.e(TAG, "⏸️ No more ACTIVE courses - pausing GPS transmission");
                // Don't stop service completely, but pause transmission
                Log.e(TAG, "ℹ️ Service remains running for potential RESUME operations");
            }
            
            Log.e(TAG, "📊 Current course statuses: " + courseStatuses.toString());
            
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
        
        if (globalCourseStatuses.isEmpty() || activeToken == null) {
            Log.e(TAG, "Cannot start GPS - missing data (Courses: " + globalCourseStatuses.size() + ", Token: " + (activeToken != null ? "OK" : "NULL") + ")");
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
                try {
                    Log.e(TAG, "⏰ === SCHEDULED GPS CYCLE TRIGGERED ===");
                    Log.e(TAG, "🕐 Timpul curent: " + new java.text.SimpleDateFormat("HH:mm:ss").format(new java.util.Date()));
                    Log.e(TAG, "📊 Service activ: " + isGPSRunning + ", Curse globale: " + globalCourseStatuses.size());
                    sendLogToJavaScript("⏰ GPS CYCLE la " + new java.text.SimpleDateFormat("HH:mm:ss").format(new java.util.Date()));
                    performGPSCycle();
                } catch (Exception e) {
                    Log.e(TAG, "❌ CRITICAL: ScheduledExecutor error: " + e.getMessage());
                    sendLogToJavaScript("❌ EROARE GPS CYCLE: " + e.getMessage());
                    e.printStackTrace();
                }
            }
        }, 2, GPS_INTERVAL_SECONDS, TimeUnit.SECONDS);
        
        isGPSRunning = true;
        Log.e(TAG, "GPS Service STARTED successfully");
        Log.e(TAG, "⏰ PRIMUL GPS CYCLE în 2 secunde, apoi la fiecare " + GPS_INTERVAL_SECONDS + " secunde");
        sendLogToJavaScript("🚀 GPS SERVICE PORNIT - primul cycle în 2 secunde, apoi la " + GPS_INTERVAL_SECONDS + "s");
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
        Log.e(TAG, "📊 Global Courses: " + globalCourseStatuses.size() + ", Token: " + (activeToken != null ? "OK" : "NULL"));
        Log.e(TAG, "🔋 Service running: " + isGPSRunning + ", WakeLock held: " + (wakeLock != null && wakeLock.isHeld()));
        Log.e(TAG, "📱 Executor status: " + (gpsExecutor != null && !gpsExecutor.isShutdown() ? "ACTIVE" : "SHUTDOWN"));
        
        // Send Android log to JavaScript for debugging
        sendLogToJavaScript("🔄 Android GPS CYCLE START - Active courses: " + courseStatuses.size() + " - Service: " + isGPSRunning);
        
        if (activeToken == null || courseStatuses.isEmpty()) {
            Log.e(TAG, "❌ GPS cycle skipped - missing data (Token: " + (activeToken != null ? "OK" : "NULL") + ", Courses: " + courseStatuses.size() + ")");
            sendLogToJavaScript("❌ GPS cycle skipped - missing token or no courses registered");
            // ✅ CORECTARE CRITICĂ: Nu face return - continuă cu fallback pentru a completa ciclul
            Log.e(TAG, "🔄 Continuând cu fallback pentru a completa ciclul și a permite următorul cycle");
            
            // Încearcă fallback cu last known location chiar dacă lipsesc date
            Location lastKnown = getLastKnownLocation();
            if (lastKnown != null && !courseStatuses.isEmpty()) {
                Log.e(TAG, "📍 EMERGENCY FALLBACK: Using last known location cu curse existente");
                transmitGPSDataForActiveCourses(lastKnown);
                Log.e(TAG, "✅ === GPS CYCLE COMPLETED cu EMERGENCY FALLBACK ===");
                sendLogToJavaScript("✅ GPS CYCLE COMPLET (emergency) - următorul în " + GPS_INTERVAL_SECONDS + "s");
            } else {
                Log.e(TAG, "❌ Cycle completed without transmission - waiting for next cycle");
                sendLogToJavaScript("❌ Cycle complet fără transmisie - următorul în " + GPS_INTERVAL_SECONDS + "s");
            }
            return; // Acum return este OK - ciclul s-a completat
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
            // ✅ CORECTARE CRITICĂ: Nu face return - completează ciclul pentru continuitate
            Log.e(TAG, "🔄 Completând ciclul fără permisiuni pentru a permite următorul cycle");
            sendLogToJavaScript("❌ GPS permissions denied - cycle completed, următorul în " + GPS_INTERVAL_SECONDS + "s");
            return; // Acum return este OK - ciclul s-a completat
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
                        Log.e(TAG, "🔄 === STARTING MULTI-COURSE GPS TRANSMISSION ===");
                        // MULTI-COURSE: Send GPS data for ALL ACTIVE courses
                        transmitGPSDataForActiveCourses(location);
                        Log.e(TAG, "✅ === GPS CYCLE COMPLETED SUCCESSFULLY ===");
                        sendLogToJavaScript("✅ GPS CYCLE COMPLET - următorul în " + GPS_INTERVAL_SECONDS + " secunde");
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
                
                // CORECTARE CRITICĂ: Timeout scurt + fallback garantat
                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            Thread.sleep(5000); // SCURTAT la 5 secunde pentru răspuns rapid
                            
                            // Oprește listener-ul după timeout
                            try {
                                locationManager.removeUpdates(listener);
                                Log.e(TAG, "⏰ GPS timeout after 5 seconds - folosind fallback");
                                sendLogToJavaScript("⏰ GPS timeout 5s - folosesc last known location");
                                
                                // FALLBACK GARANTAT: Folosește last known location
                                Location lastKnown = getLastKnownLocation();
                                if (lastKnown != null) {
                                    Log.e(TAG, "📍 FALLBACK: Using last known location: " + lastKnown.getLatitude() + ", " + lastKnown.getLongitude());
                                    sendLogToJavaScript("📍 FALLBACK GPS: " + lastKnown.getLatitude() + ", " + lastKnown.getLongitude());
                                    
                                    // Transmite GPS cu last known location pentru a menține continuitatea
                                    transmitGPSDataForActiveCourses(lastKnown);
                                    Log.e(TAG, "✅ === GPS CYCLE COMPLETED cu FALLBACK ===");
                                    sendLogToJavaScript("✅ GPS CYCLE COMPLET (fallback) - următorul în " + GPS_INTERVAL_SECONDS + "s");
                                } else {
                                    Log.e(TAG, "❌ No GPS data available - completing cycle without transmission");
                                    sendLogToJavaScript("❌ GPS indisponibil - cycle completed, următorul în " + GPS_INTERVAL_SECONDS + "s");
                                    Log.e(TAG, "✅ === GPS CYCLE COMPLETED (NO DATA) ===");
                                }
                                
                            } catch (SecurityException se) {
                                Log.e(TAG, "❌ Security exception removing GPS updates: " + se.getMessage());
                            }
                            
                        } catch (Exception e) {
                            Log.e(TAG, "❌ Timeout error: " + e.getMessage());
                        }
                    }
                }).start();
            } else {
                Log.e(TAG, "❌ No location providers available - GPS and Network both disabled");
                sendLogToJavaScript("❌ Providers disabled - încercare fallback cu last known");
                
                // ULTIMUL FALLBACK: Încearcă oricum last known location
                Location lastKnown = getLastKnownLocation();
                if (lastKnown != null) {
                    Log.e(TAG, "🔄 PROVIDER DISABLED FALLBACK: Using cached location");
                    sendLogToJavaScript("🔄 PROVIDER DISABLED - folosesc cached GPS");
                    transmitGPSDataForActiveCourses(lastKnown);
                    Log.e(TAG, "✅ === GPS CYCLE COMPLETED cu CACHED FALLBACK ===");
                } else {
                    Log.e(TAG, "❌ Absolutely no GPS data available - completing cycle");
                    sendLogToJavaScript("❌ NO GPS DATA - cycle completed, următorul în " + GPS_INTERVAL_SECONDS + "s");
                    Log.e(TAG, "✅ === GPS CYCLE COMPLETED (NO PROVIDERS) ===");
                }
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ GPS cycle error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // MULTI-VEHICLE: Send GPS data for ALL ACTIVE courses across ALL vehicles
    private void transmitGPSDataForActiveCourses(Location location) {
        try {
            Log.e(TAG, "📤 === MULTI-VEHICLE GPS TRANSMISSION ===");
            Log.e(TAG, "📊 Total global courses: " + globalCourseStatuses.size());
            
            int activeCourseCount = 0;
            
            // Send GPS data for each ACTIVE course across ALL vehicles
            for (java.util.Map.Entry<String, Integer> entry : globalCourseStatuses.entrySet()) {
                String courseKey = entry.getKey();
                int status = entry.getValue();
                
                if (status == 2) { // ACTIVE only
                    activeCourseCount++;
                    // Extract UIT and Vehicle from composite key "UIT|VEHICLE"
                    String[] parts = courseKey.split("\\|");
                    String uit = parts[0];
                    String vehicle = parts[1];
                    transmitGPSDataForCourse(location, uit, vehicle);
                } else {
                    Log.e(TAG, "⏸️ SKIPPING " + courseKey + " - status " + status);
                }
            }
            
            Log.e(TAG, "📊 GPS transmitted for " + activeCourseCount + " ACTIVE courses out of " + globalCourseStatuses.size() + " total");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Multi-course GPS transmission error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // Send GPS data for a specific course with specific vehicle
    private void transmitGPSDataForCourse(Location location, String uit, String vehicle) {
        try {
            Log.e(TAG, "📤 GPS pentru UIT: " + uit + " → Vehicle: " + vehicle);
            
            // Create GPS data JSON
            org.json.JSONObject gpsData = new org.json.JSONObject();
            gpsData.put("uit", uit);
            gpsData.put("numar_inmatriculare", vehicle);
            gpsData.put("lat", location.getLatitude());
            gpsData.put("lng", location.getLongitude());
            gpsData.put("viteza", (int) (location.getSpeed() * 3.6)); // m/s to km/h
            gpsData.put("directie", (int) location.getBearing());
            gpsData.put("altitudine", (int) location.getAltitude());
            gpsData.put("hdop", (int) location.getAccuracy());
            gpsData.put("gsm_signal", getNetworkSignal()); // Real network signal
            gpsData.put("baterie", getBatteryLevel());
            gpsData.put("status", 2); // IMPORTANT: GPS data is ALWAYS status 2 (ACTIVE transmission)
            
            // Romania timestamp
            java.util.TimeZone romaniaTimeZone = java.util.TimeZone.getTimeZone("Europe/Bucharest");
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            sdf.setTimeZone(romaniaTimeZone);
            String timestamp = sdf.format(new java.util.Date());
            gpsData.put("timestamp", timestamp);
            
            Log.e(TAG, "📊 GPS Data for " + uit + ": " + location.getLatitude() + ", " + location.getLongitude());
            
            // Call direct HTTP transmission
            callJavaScriptBridge(gpsData.toString());
            
        } catch (Exception e) {
            Log.e(TAG, "❌ GPS transmission error for UIT " + uit + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
    
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
    
    private void sendStatusUpdateToServer(int newStatus, String specificUIT, String specificVehicle) {
        try {
            Log.e(TAG, "📤 === STATUS UPDATE FROM ANDROID SERVICE ===");
            
            // Create status update JSON
            org.json.JSONObject statusData = new org.json.JSONObject();
            statusData.put("uit", specificUIT);
            statusData.put("numar_inmatriculare", specificVehicle);
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
            
            Log.e(TAG, "📊 Status pentru UIT: " + specificUIT + " → Vehicle: " + specificVehicle + " (Status: " + newStatus + ")");
            
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