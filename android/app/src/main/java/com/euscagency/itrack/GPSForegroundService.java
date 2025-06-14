package com.euscagency.itrack;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import android.telephony.TelephonyManager;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import okhttp3.*;
import org.json.JSONObject;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class GPSForegroundService extends Service implements LocationListener {
    private static final String TAG = "GPSForegroundService";
    private static final String CHANNEL_ID = "gps_tracking_channel";
    private static final int NOTIFICATION_ID = 1;
    private static final int LOCATION_INTERVAL = 30000; // 30 seconds
    private static final float LOCATION_DISTANCE = 0.5f; // 0.5 meter minimum distance
    
    private LocationManager locationManager;
    private PowerManager.WakeLock wakeLock;
    private ScheduledExecutorService scheduler;
    private OkHttpClient httpClient;
    private TelephonyManager telephonyManager;
    
    // GPS tracking data
    private String vehicleNumber;
    private String courseId;
    private String uit;
    private String authToken;
    private int courseStatus = 2; // 2=active, 3=paused, 4=stopped
    private Location lastLocation;
    private Location previousLocation;
    private float lastValidBearing = 0f;
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "GPS Foreground Service Created");
        
        try {
            createNotificationChannel();
            acquireWakeLock();
            initializeLocationManager();
            initializeTelephonyManager();
            initializeHttpClient();
            initializeScheduler();
            Log.d(TAG, "GPS Service initialized successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error initializing GPS service", e);
        }
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "GPS Service Started");
        
        if (intent != null) {
            String action = intent.getStringExtra("action");
            
            if ("START_TRACKING".equals(action)) {
                vehicleNumber = intent.getStringExtra("vehicleNumber");
                courseId = intent.getStringExtra("courseId");
                uit = intent.getStringExtra("uit");
                authToken = intent.getStringExtra("authToken");
                courseStatus = intent.getIntExtra("status", 2);
                
                Log.d(TAG, "Starting tracking for course: " + courseId + ", UIT: " + uit);
                
                startLocationTracking();
                startForeground(NOTIFICATION_ID, createNotification());
                
            } else if ("STOP_TRACKING".equals(action)) {
                Log.d(TAG, "Stopping GPS tracking");
                stopLocationTracking();
                stopForeground(true);
                stopSelf();
            }
        }
        
        return START_STICKY; // Restart if killed
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "GPS Tracking",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("iTrack GPS tracking service");
            channel.enableVibration(false);
            channel.setSound(null, null);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }
    
    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent, 
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );
        
        String contentText = String.format("Tracking: %s", uit != null ? uit : "Unknown");
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("iTrack GPS Active")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }
    
    private void acquireWakeLock() {
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "iTrack:GPSWakeLock");
        wakeLock.acquire(10*60*1000L); // 10 minutes
        Log.d(TAG, "Wake lock acquired");
    }
    
    private void initializeLocationManager() {
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        Log.d(TAG, "LocationManager initialized");
    }
    
    private void initializeTelephonyManager() {
        telephonyManager = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
        Log.d(TAG, "TelephonyManager initialized");
    }
    
    private void initializeHttpClient() {
        httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build();
        Log.d(TAG, "HTTP client initialized");
    }
    
    private void initializeScheduler() {
        scheduler = Executors.newScheduledThreadPool(1);
        Log.d(TAG, "Scheduler initialized");
    }
    
    private void startLocationTracking() {
        try {
            // Request location updates
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    LOCATION_INTERVAL,
                    LOCATION_DISTANCE,
                    this
                );
                Log.d(TAG, "GPS provider enabled");
            }
            
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    LOCATION_INTERVAL,
                    LOCATION_DISTANCE,
                    this
                );
                Log.d(TAG, "Network provider enabled");
            }
            
            // Start periodic transmission at 60 second intervals
            startPeriodicGPSTransmission();
            
        } catch (SecurityException e) {
            Log.e(TAG, "Location permission not granted", e);
        }
    }
    
    private void startPeriodicGPSTransmission() {
        Log.d(TAG, "Starting periodic GPS transmission every 60 seconds for UIT: " + uit);
        
        scheduler.scheduleAtFixedRate(new Runnable() {
            @Override
            public void run() {
                try {
                    if (lastLocation != null) {
                        Log.d(TAG, "Sending GPS data for UIT: " + uit);
                        sendGPSDataToServer();
                    } else {
                        Log.w(TAG, "No location available for UIT: " + uit);
                        
                        // Try to get last known location
                        try {
                            Location lastKnown = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                            if (lastKnown == null) {
                                lastKnown = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                            }
                            
                            if (lastKnown != null) {
                                Log.d(TAG, "Using last known location for UIT: " + uit);
                                lastLocation = lastKnown;
                                sendGPSDataToServer();
                            }
                        } catch (SecurityException e) {
                            Log.e(TAG, "Cannot access last known location", e);
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error in periodic GPS transmission for UIT: " + uit, e);
                }
            }
        }, 10, 60, TimeUnit.SECONDS); // Start after 10 seconds, then every 60 seconds
        
        Log.d(TAG, "Periodic transmission scheduled for UIT: " + uit);
    }
    
    @Override
    public void onLocationChanged(Location location) {
        previousLocation = lastLocation;
        lastLocation = location;
        
        // Calculate bearing if we have movement
        if (previousLocation != null && location.hasSpeed() && location.getSpeed() > 0.5f) {
            if (location.hasBearing() && location.getBearing() >= 0) {
                lastValidBearing = location.getBearing();
            } else {
                lastValidBearing = calculateBearing(previousLocation, location);
            }
        }
        
        Log.d(TAG, String.format("Location updated for UIT %s: %.6f, %.6f, speed: %.1f km/h", 
            uit, location.getLatitude(), location.getLongitude(), location.getSpeed() * 3.6));
    }
    
    private void sendGPSDataToServer() {
        if (lastLocation == null || authToken == null) {
            Log.w(TAG, "Cannot send GPS data - missing location or token for UIT: " + uit);
            return;
        }
        
        try {
            int batteryLevel = getBatteryLevel();
            
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
            String timestamp = sdf.format(new Date());
            
            JSONObject gpsData = new JSONObject();
            gpsData.put("lat", lastLocation.getLatitude());
            gpsData.put("lng", lastLocation.getLongitude());
            gpsData.put("timestamp", timestamp);
            gpsData.put("viteza", Math.round(lastLocation.getSpeed() * 3.6)); // km/h
            gpsData.put("directie", Math.round(lastValidBearing));
            gpsData.put("altitudine", Math.round(lastLocation.getAltitude()));
            gpsData.put("baterie", batteryLevel);
            gpsData.put("numar_inmatriculare", vehicleNumber);
            gpsData.put("uit", uit);
            gpsData.put("status", courseStatus);
            gpsData.put("hdop", Math.round(lastLocation.getAccuracy()));
            gpsData.put("gsm_signal", getGSMSignalStrength());
            
            RequestBody body = RequestBody.create(
                gpsData.toString(),
                MediaType.get("application/json; charset=utf-8")
            );
            
            Request request = new Request.Builder()
                .url("https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php")
                .addHeader("Authorization", "Bearer " + authToken)
                .addHeader("Content-Type", "application/json")
                .post(body)
                .build();
            
            httpClient.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    Log.e(TAG, "GPS transmission failed for UIT " + uit, e);
                }
                
                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    if (response.isSuccessful()) {
                        Log.d(TAG, "GPS data sent successfully for UIT: " + uit);
                    } else {
                        Log.w(TAG, "GPS transmission failed with code: " + response.code() + " for UIT: " + uit);
                    }
                    response.close();
                }
            });
            
        } catch (Exception e) {
            Log.e(TAG, "Error sending GPS data for UIT " + uit, e);
        }
    }
    
    private float calculateBearing(Location start, Location end) {
        if (start == null || end == null) return 0f;
        
        double lat1 = Math.toRadians(start.getLatitude());
        double lat2 = Math.toRadians(end.getLatitude());
        double deltaLon = Math.toRadians(end.getLongitude() - start.getLongitude());
        
        double y = Math.sin(deltaLon) * Math.cos(lat2);
        double x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
        
        double bearing = Math.toDegrees(Math.atan2(y, x));
        return (float) ((bearing + 360) % 360);
    }
    
    private int getBatteryLevel() {
        try {
            android.content.IntentFilter ifilter = new android.content.IntentFilter(android.content.Intent.ACTION_BATTERY_CHANGED);
            android.content.Intent batteryStatus = registerReceiver(null, ifilter);
            
            if (batteryStatus != null) {
                int level = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_LEVEL, -1);
                int scale = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_SCALE, -1);
                return Math.round(level * 100.0f / scale);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting battery level", e);
        }
        return 100; // Default value
    }
    
    private String getGSMSignalStrength() {
        try {
            if (telephonyManager != null) {
                // Simplified GSM signal - in a real implementation this would read actual signal
                return "85"; // Good signal strength
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting GSM signal strength", e);
        }
        return "0";
    }
    
    private void stopLocationTracking() {
        Log.d(TAG, "Stopping GPS location tracking for UIT: " + uit);
        
        if (locationManager != null) {
            locationManager.removeUpdates(this);
        }
        
        if (scheduler != null && !scheduler.isShutdown()) {
            scheduler.shutdown();
        }
    }
    
    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {}

    @Override
    public void onProviderEnabled(String provider) {
        Log.d(TAG, "Provider enabled: " + provider);
    }

    @Override
    public void onProviderDisabled(String provider) {
        Log.d(TAG, "Provider disabled: " + provider);
    }
    
    @Override
    public void onDestroy() {
        Log.d(TAG, "GPS Service destroyed for UIT: " + uit);
        stopLocationTracking();
        
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        
        super.onDestroy();
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null; // Not a bound service
    }
}