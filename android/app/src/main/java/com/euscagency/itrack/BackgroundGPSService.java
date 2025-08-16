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

/**
 * BACKGROUND GPS SERVICE - Mai eficient pentru transmisia continuă GPS
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
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.e(TAG, "🚀 BackgroundGPS Service Created");
        
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        
        // WakeLock pentru background garantat
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "iTrack:BackgroundGPS");
        
        // Background thread pentru GPS operations
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
            
            Log.e(TAG, "Data received - UIT: " + activeUIT + ", Vehicle: " + activeVehicle);
            startBackgroundGPS();
            
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
                try {
                    Log.e(TAG, "GPS Cycle executing");
                    performGPSCycle();
                } catch (Exception e) {
                    Log.e(TAG, "Cycle error: " + e.getMessage());
                    e.printStackTrace();
                }
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
        Log.e(TAG, "📍 GPS CYCLE START");
        
        if (activeUIT == null || activeToken == null) {
            Log.e(TAG, "❌ Missing data");
            return;
        }
        
        // Check permissions
        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Log.e(TAG, "❌ No GPS permission");
            return;
        }
        
        try {
            // Request single GPS location
            LocationListener listener = new LocationListener() {
                @Override
                public void onLocationChanged(Location location) {
                    try {
                        Log.e(TAG, "✅ GPS: " + location.getLatitude() + ", " + location.getLongitude());
                        locationManager.removeUpdates(this);
                        transmitGPSData(location);
                    } catch (Exception e) {
                        Log.e(TAG, "❌ Location error: " + e.getMessage());
                    }
                }
                
                @Override
                public void onProviderEnabled(String provider) {}
                
                @Override
                public void onProviderDisabled(String provider) {}
                
                @Override
                public void onStatusChanged(String provider, int status, android.os.Bundle extras) {}
            };
            
            // Direct GPS request - simplified
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0, 0, listener);
                Log.e(TAG, "🛰️ GPS request sent");
                
                // Simple timeout without handler complications
                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            Thread.sleep(8000);
                            locationManager.removeUpdates(listener);
                            Log.e(TAG, "⏰ GPS timeout");
                        } catch (Exception e) {}
                    }
                }).start();
            } else {
                Log.e(TAG, "❌ GPS disabled");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ GPS cycle error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void transmitGPSData(Location location) {
        try {
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
            gpsData.put("status", 2); // ACTIVE
            
            // Romania timestamp
            java.util.TimeZone romaniaTimeZone = java.util.TimeZone.getTimeZone("Europe/Bucharest");
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            sdf.setTimeZone(romaniaTimeZone);
            String timestamp = sdf.format(new java.util.Date());
            gpsData.put("timestamp", timestamp);
            
            Log.e(TAG, "📤 Transmitting: " + gpsData.toString());
            
            // Call direct HTTP transmission
            callJavaScriptBridge(gpsData.toString());
            
        } catch (Exception e) {
            Log.e(TAG, "❌ GPS transmission error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void callJavaScriptBridge(String gpsDataJson) {
        try {
            Log.e(TAG, "🌐 HTTP Request start");
            
            // Make HTTP request on background thread
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        java.net.URL url = new java.net.URL("https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php");
                        javax.net.ssl.HttpsURLConnection conn = (javax.net.ssl.HttpsURLConnection) url.openConnection();
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("Content-Type", "application/json");
                        conn.setRequestProperty("Authorization", "Bearer " + activeToken);
                        conn.setDoOutput(true);
                        
                        // Send JSON data
                        try (java.io.OutputStream os = conn.getOutputStream()) {
                            byte[] input = gpsDataJson.getBytes("utf-8");
                            os.write(input, 0, input.length);
                        }
                        
                        int responseCode = conn.getResponseCode();
                        Log.e(TAG, "📡 Response: " + responseCode);
                        
                        if (responseCode == 200) {
                            Log.e(TAG, "✅ GPS OK");
                        } else {
                            Log.e(TAG, "❌ GPS Failed: " + responseCode);
                        }
                        
                    } catch (Exception e) {
                        Log.e(TAG, "❌ Native HTTP GPS error: " + e.getMessage());
                        e.printStackTrace();
                    }
                }
            }).start();
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Bridge call failed: " + e.getMessage());
            e.printStackTrace();
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
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Background GPS Tracking",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Efficient background GPS tracking");
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }
    
    private android.app.Notification createNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("📍 iTrack GPS Background")
            .setContentText("Efficient GPS tracking - " + GPS_INTERVAL_SECONDS + "s intervals")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_NAVIGATION)
            .build();
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    @Override
    public void onDestroy() {
        Log.e(TAG, "🛑 BackgroundGPS Service Destroyed");
        stopBackgroundGPS();
        
        if (backgroundThread != null) {
            backgroundThread.quitSafely();
        }
        
        super.onDestroy();
    }
}