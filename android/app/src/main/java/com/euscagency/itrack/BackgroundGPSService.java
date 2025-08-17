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
    
    private String activeUIT;
    private String activeToken;
    private String activeVehicle;
    private boolean isGPSRunning = false;
    private int courseStatus = 0; // 2=ACTIV, 3=PAUZA, 4=STOP
    
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
            activeUIT = intent.getStringExtra("uit");
            activeToken = intent.getStringExtra("token");
            activeVehicle = intent.getStringExtra("vehicle");
            courseStatus = intent.getIntExtra("status", 2); // Default ACTIVE
            
            Log.e(TAG, "Data received - UIT: " + activeUIT + ", Vehicle: " + activeVehicle + ", Status: " + courseStatus);
            
            // Start foreground notification IMMEDIATELY
            startForeground(1, createNotification());
            Log.e(TAG, "Foreground service notification created");
            
            if (courseStatus == 2) {
                startBackgroundGPS();
            } else {
                Log.e(TAG, "GPS not started - course status is " + courseStatus + " (not ACTIVE)");
            }
            
        } else if (intent != null && "UPDATE_COURSE_STATUS".equals(intent.getAction())) {
            int newStatus = intent.getIntExtra("status", 0);
            Log.e(TAG, "Updating course status: " + courseStatus + " → " + newStatus);
            
            // TRIMITE STATUS UPDATE LA SERVER ÎNAINTE DE SCHIMBARE (pentru 3=PAUSE, 4=STOP)
            if (newStatus == 3 || newStatus == 4) {
                Log.e(TAG, "🔄 Trimit status " + newStatus + " la server din serviciul Android");
                sendStatusUpdateToServer(newStatus);
            }
            
            courseStatus = newStatus;
            
            if (newStatus == 2) { // ACTIVE/RESUME
                Log.e(TAG, "RESUME: Starting GPS transmission");
                if (!isGPSRunning) {
                    startBackgroundGPS();
                }
            } else if (newStatus == 3) { // PAUSE
                Log.e(TAG, "PAUSE: UIT paused but service continues for other UITs");
                // Nu oprim GPS complet - doar notăm că acest UIT este în pauză
                // GPS va continua pentru alte UIT-uri active din TypeScript
                Log.e(TAG, "ℹ️ GPS service remains active for other active UITs");
            } else if (newStatus == 4) { // STOP
                Log.e(TAG, "STOP: Removing UIT from active tracking (service continues for other UITs)");
                // Nu oprim serviciul complet - doar eliminăm UIT-ul din tracking
                // Serviciul va continua pentru alte UIT-uri active
                Log.e(TAG, "ℹ️ Service remains active for other potential UITs");
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
        
        if (activeUIT == null || activeToken == null) {
            Log.e(TAG, "Cannot start GPS - missing data (UIT: " + activeUIT + ", Token: " + (activeToken != null ? "OK" : "NULL") + ")");
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
        Log.e(TAG, "📊 UIT: " + activeUIT + ", Token: " + (activeToken != null ? "OK" : "NULL"));
        
        // Send Android log to JavaScript for debugging
        sendLogToJavaScript("🔄 Android GPS CYCLE START - UIT: " + activeUIT);
        
        if (activeUIT == null || activeToken == null) {
            Log.e(TAG, "❌ GPS cycle skipped - missing data (UIT: " + activeUIT + ", Token: " + (activeToken != null ? "OK" : "NULL") + ")");
            sendLogToJavaScript("❌ GPS cycle skipped - missing token or UIT");
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
                        transmitGPSData(location);
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
    
    private void transmitGPSData(Location location) {
        try {
            Log.e(TAG, "📤 === PREPARING GPS TRANSMISSION ===");
            
            // Create GPS data JSON
            org.json.JSONObject gpsData = new org.json.JSONObject();
            gpsData.put("uit", activeUIT);
            gpsData.put("numar_inmatriculare", activeVehicle);
            gpsData.put("lat", location.getLatitude());
            gpsData.put("lng", location.getLongitude());
            gpsData.put("viteza", (int) (location.getSpeed() * 3.6)); // m/s to km/h
            gpsData.put("directie", (int) location.getBearing());
            gpsData.put("altitudine", (int) location.getAltitude());
            gpsData.put("hdop", (int) location.getAccuracy());
            gpsData.put("gsm_signal", 4); // Default good signal
            gpsData.put("baterie", getBatteryLevel());
            gpsData.put("status", courseStatus); // Current course status
            
            // Romania timestamp
            java.util.TimeZone romaniaTimeZone = java.util.TimeZone.getTimeZone("Europe/Bucharest");
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            sdf.setTimeZone(romaniaTimeZone);
            String timestamp = sdf.format(new java.util.Date());
            gpsData.put("timestamp", timestamp);
            
            Log.e(TAG, "📊 GPS Data prepared:");
            Log.e(TAG, "   UIT: " + activeUIT);
            Log.e(TAG, "   Vehicle: " + activeVehicle);
            Log.e(TAG, "   Coordinates: " + location.getLatitude() + ", " + location.getLongitude());
            Log.e(TAG, "   Battery: " + getBatteryLevel());
            Log.e(TAG, "   Timestamp: " + timestamp);
            Log.e(TAG, "📤 Full JSON: " + gpsData.toString());
            
            // Call direct HTTP transmission
            callJavaScriptBridge(gpsData.toString());
            
        } catch (Exception e) {
            Log.e(TAG, "❌ GPS transmission preparation error: " + e.getMessage());
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
    
    private void sendStatusUpdateToServer(int newStatus) {
        try {
            Log.e(TAG, "📤 === PREPARING STATUS UPDATE FROM ANDROID SERVICE ===");
            
            // Create status update JSON cu exact aceeași structură ca GPS
            org.json.JSONObject statusData = new org.json.JSONObject();
            statusData.put("uit", activeUIT);
            statusData.put("numar_inmatriculare", activeVehicle);
            statusData.put("lat", 0);  // Nu contează pentru status update
            statusData.put("lng", 0);
            statusData.put("viteza", 0);
            statusData.put("directie", 0);
            statusData.put("altitudine", 0);
            statusData.put("hdop", 0);
            statusData.put("gsm_signal", 4);
            statusData.put("baterie", getBatteryLevel());
            statusData.put("status", newStatus); // PAUSE (3) sau STOP (4)
            
            // Romania timestamp
            java.util.TimeZone romaniaTimeZone = java.util.TimeZone.getTimeZone("Europe/Bucharest");
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            sdf.setTimeZone(romaniaTimeZone);
            String timestamp = sdf.format(new java.util.Date());
            statusData.put("timestamp", timestamp);
            
            Log.e(TAG, "📊 Status Data prepared for status " + newStatus + ":");
            Log.e(TAG, "   UIT: " + activeUIT);
            Log.e(TAG, "   Vehicle: " + activeVehicle);
            Log.e(TAG, "   Status: " + newStatus);
            Log.e(TAG, "   Timestamp: " + timestamp);
            Log.e(TAG, "📤 Full JSON: " + statusData.toString());
            
            // Call direct HTTP transmission - ACELAȘI ca GPS-ul!
            callJavaScriptBridge(statusData.toString());
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Status update preparation error: " + e.getMessage());
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