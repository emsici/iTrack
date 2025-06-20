package com.itrack.gps;

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
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

import org.json.JSONObject;

/**
 * Enhanced GPS Service pentru iTrack
 * Serviciu foreground care transmite coordonate GPS la fiecare 5 secunde
 * Funcționează în background chiar când aplicația e minimizată sau telefonul blocat
 */
public class EnhancedGPSService extends Service implements LocationListener {
    private static final String TAG = "EnhancedGPSService";
    private static final String CHANNEL_ID = "itrack_gps_channel";
    private static final int NOTIFICATION_ID = 1001;
    private static final int GPS_INTERVAL = 5000; // 5 secunde
    private static final String API_BASE_URL = "https://www.euscagency.com/etsm3/platforme/transport/apk";

    private LocationManager locationManager;
    private PowerManager.WakeLock wakeLock;
    private Handler gpsHandler;
    private Runnable gpsRunnable;
    private OkHttpClient httpClient;

    // Course data
    private String courseId;
    private String vehicleNumber;
    private String uit;
    private String authToken;
    private int status;

    // GPS tracking state
    private boolean isTracking = false;
    private Location lastLocation;
    private long transmissionCount = 0;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "EnhancedGPSService created");

        createNotificationChannel();
        initializeWakeLock();
        initializeHttpClient();
        initializeLocationManager();
        initializeGPSHandler();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "EnhancedGPSService started");

        if (intent != null) {
            String action = intent.getAction();
            
            if ("START_TRACKING".equals(action)) {
                startGPSTracking(intent);
            } else if ("STOP_TRACKING".equals(action)) {
                stopGPSTracking();
            } else if ("UPDATE_STATUS".equals(action)) {
                updateCourseStatus(intent);
            }
        }

        return START_STICKY; // Restart service if killed
    }

    private void startGPSTracking(Intent intent) {
        courseId = intent.getStringExtra("courseId");
        vehicleNumber = intent.getStringExtra("vehicleNumber");
        uit = intent.getStringExtra("uit");
        authToken = intent.getStringExtra("authToken");
        status = intent.getIntExtra("status", 2);

        Log.d(TAG, String.format("Starting GPS tracking - Course: %s, UIT: %s, Status: %d", 
            courseId, uit, status));

        startForeground(NOTIFICATION_ID, createNotification());
        
        // Only start continuous GPS for status 2 (ACTIVE)
        if (status == 2) {
            startLocationUpdates();
            startGPSTransmissionLoop();
            isTracking = true;
        } else {
            Log.d(TAG, "Status " + status + " - no continuous GPS needed");
        }
    }

    private void stopGPSTracking() {
        Log.d(TAG, "Stopping GPS tracking");
        
        isTracking = false;
        stopLocationUpdates();
        stopGPSTransmissionLoop();
        releaseWakeLock();
        stopForeground(true);
        stopSelf();
    }

    private void updateCourseStatus(Intent intent) {
        int newStatus = intent.getIntExtra("status", status);
        Log.d(TAG, String.format("Updating status from %d to %d", status, newStatus));
        
        status = newStatus;
        
        if (status == 2) {
            // Resume continuous GPS tracking
            if (!isTracking) {
                startLocationUpdates();
                startGPSTransmissionLoop();
                isTracking = true;
            }
        } else {
            // Stop continuous GPS, send one final status update
            if (isTracking) {
                sendSingleStatusUpdate();
                isTracking = false;
                stopLocationUpdates();
                stopGPSTransmissionLoop();
            }
        }
        
        // Update notification
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        manager.notify(NOTIFICATION_ID, createNotification());
    }

    private void startLocationUpdates() {
        if (locationManager != null) {
            try {
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    1000, // 1 second
                    1,    // 1 meter
                    this
                );
                
                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    1000,
                    1,
                    this
                );
                
                Log.d(TAG, "Location updates started");
            } catch (SecurityException e) {
                Log.e(TAG, "GPS permission denied", e);
            }
        }
    }

    private void stopLocationUpdates() {
        if (locationManager != null) {
            locationManager.removeUpdates(this);
            Log.d(TAG, "Location updates stopped");
        }
    }

    private void startGPSTransmissionLoop() {
        gpsHandler.post(gpsRunnable);
        Log.d(TAG, "GPS transmission loop started - every 5 seconds");
    }

    private void stopGPSTransmissionLoop() {
        gpsHandler.removeCallbacks(gpsRunnable);
        Log.d(TAG, "GPS transmission loop stopped");
    }

    private void sendGPSCoordinates() {
        if (!isTracking || lastLocation == null) {
            return;
        }

        try {
            JSONObject gpsData = new JSONObject();
            gpsData.put("lat", lastLocation.getLatitude());
            gpsData.put("lng", lastLocation.getLongitude());
            gpsData.put("timestamp", getCurrentTimestamp());
            gpsData.put("viteza", Math.max(0, (int) (lastLocation.getSpeed() * 3.6))); // m/s to km/h
            gpsData.put("directie", (int) lastLocation.getBearing());
            gpsData.put("altitudine", (int) lastLocation.getAltitude());
            gpsData.put("baterie", getBatteryLevel());
            gpsData.put("numar_inmatriculare", vehicleNumber);
            gpsData.put("uit", uit);
            gpsData.put("status", String.valueOf(status));
            gpsData.put("hdop", String.format("%.1f", lastLocation.getAccuracy()));
            gpsData.put("gsm_signal", "4");

            transmitGPSData(gpsData);
            transmissionCount++;
            
            Log.d(TAG, String.format("GPS transmitted #%d: %.6f, %.6f (UIT: %s)", 
                transmissionCount, lastLocation.getLatitude(), lastLocation.getLongitude(), uit));
                
        } catch (Exception e) {
            Log.e(TAG, "Error preparing GPS data", e);
        }
    }

    private void sendSingleStatusUpdate() {
        try {
            JSONObject statusData = new JSONObject();
            statusData.put("lat", 0);
            statusData.put("lng", 0);
            statusData.put("timestamp", getCurrentTimestamp());
            statusData.put("viteza", 0);
            statusData.put("directie", 0);
            statusData.put("altitudine", 0);
            statusData.put("baterie", getBatteryLevel());
            statusData.put("numar_inmatriculare", vehicleNumber);
            statusData.put("uit", uit);
            statusData.put("status", String.valueOf(status));
            statusData.put("hdop", "1.0");
            statusData.put("gsm_signal", "4");

            transmitGPSData(statusData);
            Log.d(TAG, String.format("Status update sent: %d for UIT: %s", status, uit));
            
        } catch (Exception e) {
            Log.e(TAG, "Error sending status update", e);
        }
    }

    private void transmitGPSData(JSONObject gpsData) {
        MediaType JSON = MediaType.get("application/json; charset=utf-8");
        RequestBody body = RequestBody.create(gpsData.toString(), JSON);
        
        Request request = new Request.Builder()
            .url(API_BASE_URL + "/gps.php")
            .addHeader("Authorization", "Bearer " + authToken)
            .addHeader("Content-Type", "application/json")
            .addHeader("User-Agent", "iTrack/2.0 Android")
            .post(body)
            .build();

        httpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "GPS transmission failed", e);
                // TODO: Save to offline storage
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    Log.d(TAG, "GPS transmission successful");
                } else {
                    Log.w(TAG, "GPS transmission failed: " + response.code());
                }
                response.close();
            }
        });
    }

    @Override
    public void onLocationChanged(Location location) {
        if (location != null && isTracking) {
            lastLocation = location;
            Log.d(TAG, String.format("Location updated: %.6f, %.6f (accuracy: %.1fm)", 
                location.getLatitude(), location.getLongitude(), location.getAccuracy()));
        }
    }

    // LocationListener methods
    @Override public void onStatusChanged(String provider, int status, Bundle extras) {}
    @Override public void onProviderEnabled(String provider) {
        Log.d(TAG, "GPS provider enabled: " + provider);
    }
    @Override public void onProviderDisabled(String provider) {
        Log.w(TAG, "GPS provider disabled: " + provider);
    }

    private void createNotificationChannel() {
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "iTrack GPS Tracking",
            NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("GPS tracking pentru curse active");
        channel.setShowBadge(false);
        
        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.createNotificationChannel(channel);
    }

    private Notification createNotification() {
        Intent intent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        String statusText = getStatusText();
        String contentText = isTracking ? 
            String.format("UIT: %s • Status: %s • Transmisii: %d", uit, statusText, transmissionCount) :
            String.format("UIT: %s • Status: %s", uit, statusText);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("iTrack GPS Activ")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build();
    }

    private String getStatusText() {
        switch (status) {
            case 2: return "Activ";
            case 3: return "Pauză";
            case 4: return "Finalizat";
            default: return "Necunoscut";
        }
    }

    private void initializeWakeLock() {
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "iTrack::GPSWakeLock");
        wakeLock.acquire(2 * 60 * 60 * 1000L); // 2 hours max
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
    }

    private void initializeHttpClient() {
        httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build();
    }

    private void initializeLocationManager() {
        locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
    }

    private void initializeGPSHandler() {
        gpsHandler = new Handler(Looper.getMainLooper());
        gpsRunnable = new Runnable() {
            @Override
            public void run() {
                if (isTracking && status == 2) {
                    sendGPSCoordinates();
                    gpsHandler.postDelayed(this, GPS_INTERVAL);
                }
            }
        };
    }

    private String getCurrentTimestamp() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
        return sdf.format(new Date());
    }

    private int getBatteryLevel() {
        // Simplified battery level - in real implementation use BatteryManager
        return 90;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "EnhancedGPSService destroyed");
        
        stopGPSTracking();
        releaseWakeLock();
        
        if (httpClient != null) {
            httpClient.dispatcher().executorService().shutdown();
        }
    }
}