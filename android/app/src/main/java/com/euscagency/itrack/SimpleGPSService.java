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
import okhttp3.*;
import org.json.JSONObject;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.Timer;
import java.util.TimerTask;

public class SimpleGPSService extends Service implements LocationListener {
    private static final String TAG = "SimpleGPSService";
    private static final String CHANNEL_ID = "gps_service_channel";
    private static final int NOTIFICATION_ID = 1001;

    private LocationManager locationManager;
    private Location lastLocation;
    private String vehicleNumber;
    private String courseId;
    private String uit;
    private String authToken;
    private int courseStatus = 2; // Active by default
    
    private Timer transmissionTimer;
    private PowerManager.WakeLock wakeLock;
    private OkHttpClient httpClient;
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "SimpleGPSService created");
        
        // Initialize HTTP client
        httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .writeTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .build();
            
        // Acquire wake lock
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "iTrack:GPSWakeLock");
        wakeLock.acquire(10*60*1000L /*10 minutes*/);
        
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, createNotification());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "SimpleGPSService onStartCommand");
        
        if (intent != null) {
            String action = intent.getStringExtra("action");
            
            if ("START_TRACKING".equals(action)) {
                vehicleNumber = intent.getStringExtra("vehicleNumber");
                courseId = intent.getStringExtra("courseId");
                uit = intent.getStringExtra("uit");
                authToken = intent.getStringExtra("authToken");
                courseStatus = intent.getIntExtra("status", 2);
                
                Log.d(TAG, "Starting GPS tracking for course: " + courseId + ", UIT: " + uit);
                startLocationTracking();
                startTransmissionTimer();
                
            } else if ("STOP_TRACKING".equals(action)) {
                Log.d(TAG, "Stopping GPS tracking");
                stopLocationTracking();
                stopSelf();
            }
        }

        return START_STICKY; // Restart if killed
    }

    private void startLocationTracking() {
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        
        try {
            // Request location updates
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    5000, // 5 seconds
                    1.0f, // 1 meter
                    this
                );
                Log.d(TAG, "GPS provider enabled");
            }
            
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    5000, // 5 seconds  
                    1.0f, // 1 meter
                    this
                );
                Log.d(TAG, "Network provider enabled");
            }
            
            // Get last known location
            Location lastKnown = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            if (lastKnown == null) {
                lastKnown = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
            }
            if (lastKnown != null) {
                lastLocation = lastKnown;
                Log.d(TAG, "Got last known location");
            }
            
        } catch (SecurityException e) {
            Log.e(TAG, "Location permission not granted", e);
        }
    }

    private void startTransmissionTimer() {
        if (transmissionTimer != null) {
            transmissionTimer.cancel();
        }
        
        transmissionTimer = new Timer();
        transmissionTimer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                if (lastLocation != null && authToken != null) {
                    Log.d(TAG, "Sending GPS data for UIT: " + uit);
                    sendGPSDataToServer();
                } else {
                    Log.w(TAG, "No location or auth token for transmission");
                }
            }
        }, 10000, 60000); // Start after 10 seconds, repeat every 60 seconds
        
        Log.d(TAG, "Transmission timer started");
    }

    private void sendGPSDataToServer() {
        if (lastLocation == null || authToken == null) {
            Log.w(TAG, "Cannot send GPS data - missing location or token");
            return;
        }

        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
            String timestamp = sdf.format(new Date());
            
            JSONObject gpsData = new JSONObject();
            gpsData.put("lat", lastLocation.getLatitude());
            gpsData.put("lng", lastLocation.getLongitude());
            gpsData.put("timestamp", timestamp);
            gpsData.put("viteza", Math.round(lastLocation.getSpeed() * 3.6)); // km/h
            gpsData.put("directie", lastLocation.hasBearing() ? Math.round(lastLocation.getBearing()) : 0);
            gpsData.put("altitudine", Math.round(lastLocation.getAltitude()));
            gpsData.put("baterie", 100); // Simplified
            gpsData.put("numar_inmatriculare", vehicleNumber);
            gpsData.put("uit", uit);
            gpsData.put("status", courseStatus);
            gpsData.put("hdop", Math.round(lastLocation.getAccuracy()));
            gpsData.put("gsm_signal", "85"); // Simplified
            
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

    private void stopLocationTracking() {
        if (locationManager != null) {
            locationManager.removeUpdates(this);
        }
        
        if (transmissionTimer != null) {
            transmissionTimer.cancel();
            transmissionTimer = null;
        }
        
        Log.d(TAG, "Location tracking stopped");
    }

    @Override
    public void onLocationChanged(Location location) {
        lastLocation = location;
        Log.d(TAG, String.format("Location updated for UIT %s: %.6f, %.6f", 
            uit, location.getLatitude(), location.getLongitude()));
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

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "GPS Tracking Service",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Tracking GPS coordinates for active transports");
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

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("iTrack GPS Active")
            .setContentText("Tracking transport: " + (uit != null ? uit : "Unknown"))
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build();
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "SimpleGPSService destroyed");
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