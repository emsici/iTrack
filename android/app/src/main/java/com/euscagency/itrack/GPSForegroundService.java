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
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import android.telephony.TelephonyManager;
import android.telephony.SignalStrength;
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
    private static final int LOCATION_INTERVAL = 60000; // 60 seconds
    private static final float LOCATION_DISTANCE = 5f; // 5 meters
    
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
    private Location lastLocation;
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "GPS Foreground Service Created");
        
        createNotificationChannel();
        acquireWakeLock();
        initializeLocationManager();
        initializeTelephonyManager();
        initializeHttpClient();
        initializeScheduler();
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "GPS Foreground Service Started");
        
        if (intent != null) {
            String action = intent.getStringExtra("action");
            
            if ("START_TRACKING".equals(action)) {
                vehicleNumber = intent.getStringExtra("vehicleNumber");
                courseId = intent.getStringExtra("courseId");
                uit = intent.getStringExtra("uit");
                authToken = intent.getStringExtra("authToken");
                
                startLocationTracking();
                startForeground(NOTIFICATION_ID, createNotification());
                
            } else if ("STOP_TRACKING".equals(action)) {
                stopLocationTracking();
                stopForeground(true);
                stopSelf();
            }
        }
        
        return START_STICKY; // Restart service if killed by system
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
        
        String contentText = String.format("Vehicul %s - Cursă activă", 
            vehicleNumber != null ? vehicleNumber : "Unknown");
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("iTrack GPS Tracking")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build();
    }
    
    private void acquireWakeLock() {
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "iTrack::GPSTrackingWakeLock"
        );
        wakeLock.acquire(24 * 60 * 60 * 1000L); // 24 hours max
        Log.d(TAG, "Wake lock acquired");
    }
    
    private void initializeLocationManager() {
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
    }
    
    private void initializeTelephonyManager() {
        telephonyManager = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
    }
    
    private void initializeHttpClient() {
        httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build();
    }
    
    private void initializeScheduler() {
        scheduler = Executors.newSingleThreadScheduledExecutor();
    }
    
    private void startLocationTracking() {
        Log.d(TAG, "Starting native GPS location tracking");
        
        try {
            // Request location updates from GPS and Network providers
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    LOCATION_INTERVAL,
                    LOCATION_DISTANCE,
                    this,
                    Looper.getMainLooper()
                );
                Log.d(TAG, "GPS provider enabled and tracking started");
            }
            
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    LOCATION_INTERVAL,
                    LOCATION_DISTANCE,
                    this,
                    Looper.getMainLooper()
                );
                Log.d(TAG, "Network provider enabled and tracking started");
            }
            
            // Schedule regular GPS data transmission every 60 seconds
            scheduler.scheduleAtFixedRate(this::sendGPSDataToServer, 10, 60, TimeUnit.SECONDS);
            
        } catch (SecurityException e) {
            Log.e(TAG, "Location permission not granted", e);
        }
    }
    
    private void stopLocationTracking() {
        Log.d(TAG, "Stopping GPS location tracking");
        
        if (locationManager != null) {
            locationManager.removeUpdates(this);
        }
        
        if (scheduler != null && !scheduler.isShutdown()) {
            scheduler.shutdown();
        }
    }
    
    @Override
    public void onLocationChanged(Location location) {
        lastLocation = location;
        Log.d(TAG, String.format("Location updated: %.6f, %.6f, speed: %.1f km/h", 
            location.getLatitude(), location.getLongitude(), 
            location.getSpeed() * 3.6)); // Convert m/s to km/h
    }
    
    private void sendGPSDataToServer() {
        if (lastLocation == null || authToken == null) {
            Log.w(TAG, "No location data or auth token available");
            return;
        }
        
        try {
            // Get battery level
            int batteryLevel = getBatteryLevel();
            
            // Prepare GPS data
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
            String timestamp = sdf.format(new Date());
            
            JSONObject gpsData = new JSONObject();
            gpsData.put("lat", lastLocation.getLatitude());
            gpsData.put("lng", lastLocation.getLongitude());
            gpsData.put("timestamp", timestamp);
            gpsData.put("viteza", Math.round(lastLocation.getSpeed() * 3.6)); // km/h
            gpsData.put("directie", Math.round(lastLocation.getBearing()));
            gpsData.put("altitudine", Math.round(lastLocation.getAltitude()));
            gpsData.put("baterie", batteryLevel);
            gpsData.put("numar_inmatriculare", vehicleNumber);
            gpsData.put("uit", uit);
            gpsData.put("status", "2"); // Active status
            gpsData.put("hdop", Math.round(lastLocation.getAccuracy()));
            gpsData.put("gsm_signal", getGSMSignalStrength());
            
            // Send to server
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
                    Log.e(TAG, "Failed to send GPS data", e);
                }
                
                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    if (response.isSuccessful()) {
                        Log.d(TAG, "GPS data sent successfully");
                    } else {
                        Log.w(TAG, "GPS data send failed with code: " + response.code());
                    }
                    response.close();
                }
            });
            
            Log.d(TAG, "GPS data sent for course: " + courseId);
            
        } catch (Exception e) {
            Log.e(TAG, "Error sending GPS data", e);
        }
    }
    
    private int getBatteryLevel() {
        try {
            android.content.IntentFilter ifilter = new android.content.IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = registerReceiver(null, ifilter);
            
            if (batteryStatus != null) {
                int level = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_LEVEL, -1);
                int scale = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_SCALE, -1);
                return Math.round((level / (float) scale) * 100);
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not get battery level", e);
        }
        return 100; // Default value
    }
    
    private String getGSMSignalStrength() {
        try {
            if (telephonyManager != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    // Android 9+ (API 28+)
                    SignalStrength signalStrength = telephonyManager.getSignalStrength();
                    if (signalStrength != null) {
                        int level = signalStrength.getLevel(); // 0-4 scale
                        return String.valueOf((level * 25)); // Convert to 0-100 scale
                    }
                } else {
                    // For older Android versions, use network type as fallback
                    int networkType = telephonyManager.getNetworkType();
                    switch (networkType) {
                        case TelephonyManager.NETWORK_TYPE_LTE:
                        case TelephonyManager.NETWORK_TYPE_HSPAP:
                        case TelephonyManager.NETWORK_TYPE_HSPA:
                            return "85"; // Good signal for 4G/3G+
                        case TelephonyManager.NETWORK_TYPE_UMTS:
                        case TelephonyManager.NETWORK_TYPE_EDGE:
                            return "65"; // Moderate signal for 3G/2G
                        case TelephonyManager.NETWORK_TYPE_GPRS:
                            return "45"; // Weak signal for 2G
                        default:
                            return "25"; // Unknown/poor signal
                    }
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not get GSM signal strength", e);
        }
        return "50"; // Default moderate signal
    }
    
    @Override
    public void onDestroy() {
        Log.d(TAG, "GPS Foreground Service Destroyed");
        
        stopLocationTracking();
        
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        
        if (httpClient != null) {
            httpClient.dispatcher().executorService().shutdown();
        }
        
        super.onDestroy();
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null; // We don't provide binding
    }
    
    // LocationListener methods
    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {}
    
    @Override
    public void onProviderEnabled(String provider) {
        Log.d(TAG, "Location provider enabled: " + provider);
    }
    
    @Override
    public void onProviderDisabled(String provider) {
        Log.d(TAG, "Location provider disabled: " + provider);
    }
}