package com.euscagency.itrack;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.PowerManager;
import android.telephony.TelephonyManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.json.JSONObject;

public class SimpleGPSService extends Service implements LocationListener {
    private static final String TAG = "SimpleGPSService";
    private static final String CHANNEL_ID = "gps_channel";
    private static final int NOTIFICATION_ID = 1;
    private static final String GPS_API_URL = "https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php";
    
    private static boolean isRunning = false;
    private LocationManager locationManager;
    private PowerManager.WakeLock wakeLock;
    private OkHttpClient httpClient;
    private Timer transmissionTimer;
    private Location lastKnownLocation;
    
    // Course tracking data
    private Map<String, CourseData> activeCourses = new HashMap<>();
    
    private static class CourseData {
        String vehicleNumber;
        String courseId;
        String uit;
        String authToken;
        int status;
        
        CourseData(String vehicleNumber, String courseId, String uit, String authToken, int status) {
            this.vehicleNumber = vehicleNumber;
            this.courseId = courseId;
            this.uit = uit;
            this.authToken = authToken;
            this.status = status;
        }
    }

    public static boolean isServiceRunning() {
        return isRunning;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "SimpleGPSService created");
        
        isRunning = true;
        httpClient = new OkHttpClient();
        
        createNotificationChannel();
        acquireWakeLock();
        initializeLocationManager();
        startTransmissionTimer();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_STICKY;
        
        String action = intent.getAction();
        if (action == null) action = intent.getStringExtra("action");
        
        Log.d(TAG, "SimpleGPSService command: " + action);
        
        if ("START_TRACKING".equals(action)) {
            handleStartTracking(intent);
        } else if ("STOP_TRACKING".equals(action)) {
            handleStopTracking(intent);
        }
        
        updateNotification();
        return START_STICKY;
    }

    private void handleStartTracking(Intent intent) {
        String vehicleNumber = intent.getStringExtra("vehicleNumber");
        String courseId = intent.getStringExtra("courseId");
        String uit = intent.getStringExtra("uit");
        String authToken = intent.getStringExtra("authToken");
        int status = intent.getIntExtra("status", 2);
        
        Log.d(TAG, "Starting tracking for course: " + courseId + ", UIT: " + uit);
        
        CourseData courseData = new CourseData(vehicleNumber, courseId, uit, authToken, status);
        activeCourses.put(courseId, courseData);
        
        Log.d(TAG, "Active courses count: " + activeCourses.size());
    }

    private void handleStopTracking(Intent intent) {
        String courseId = intent.getStringExtra("courseId");
        if (courseId != null) {
            activeCourses.remove(courseId);
            Log.d(TAG, "Stopped tracking course: " + courseId);
            Log.d(TAG, "Remaining active courses: " + activeCourses.size());
            
            if (activeCourses.isEmpty()) {
                Log.d(TAG, "No more active courses - stopping service");
                stopSelf();
            }
        }
    }

    private void initializeLocationManager() {
        try {
            locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
            
            if (locationManager != null) {
                // Request location updates every 30 seconds, minimum 5 meters
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER, 
                    30000, // 30 seconds
                    5.0f,  // 5 meters
                    this
                );
                
                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER, 
                    30000, 
                    5.0f, 
                    this
                );
                
                Log.d(TAG, "Location manager initialized");
            }
        } catch (SecurityException e) {
            Log.e(TAG, "Location permission denied", e);
        }
    }

    private void startTransmissionTimer() {
        transmissionTimer = new Timer();
        transmissionTimer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                if (lastKnownLocation != null && !activeCourses.isEmpty()) {
                    transmitGPSData();
                }
            }
        }, 0, 60000); // Every 60 seconds
        
        Log.d(TAG, "GPS transmission timer started (60 second intervals)");
    }

    @Override
    public void onLocationChanged(Location location) {
        lastKnownLocation = location;
        Log.d(TAG, "Location updated: " + location.getLatitude() + ", " + location.getLongitude());
    }

    private void transmitGPSData() {
        if (lastKnownLocation == null || activeCourses.isEmpty()) {
            return;
        }
        
        Log.d(TAG, "Transmitting GPS data for " + activeCourses.size() + " active courses");
        
        for (CourseData courseData : activeCourses.values()) {
            sendGPSToServer(courseData, lastKnownLocation);
        }
    }

    private void sendGPSToServer(CourseData courseData, Location location) {
        try {
            JSONObject gpsData = new JSONObject();
            gpsData.put("lat", location.getLatitude());
            gpsData.put("lng", location.getLongitude());
            gpsData.put("timestamp", new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(new Date()));
            gpsData.put("viteza", Math.round(location.getSpeed() * 3.6)); // m/s to km/h
            gpsData.put("directie", location.getBearing());
            gpsData.put("altitudine", Math.round(location.getAltitude()));
            gpsData.put("baterie", getBatteryLevel());
            gpsData.put("numar_inmatriculare", courseData.vehicleNumber);
            gpsData.put("uit", courseData.uit);
            gpsData.put("status", String.valueOf(courseData.status));
            gpsData.put("hdop", String.valueOf(location.getAccuracy()));
            gpsData.put("gsm_signal", getGSMSignalStrength());

            RequestBody body = RequestBody.create(
                gpsData.toString(),
                MediaType.get("application/json; charset=utf-8")
            );

            Request request = new Request.Builder()
                .url(GPS_API_URL)
                .post(body)
                .addHeader("Authorization", "Bearer " + courseData.authToken)
                .addHeader("Content-Type", "application/json")
                .build();

            httpClient.newCall(request).enqueue(new Callback() {
                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    Log.d(TAG, "GPS data sent successfully for UIT: " + courseData.uit + " - Response: " + response.code());
                    response.close();
                }

                @Override
                public void onFailure(Call call, IOException e) {
                    Log.e(TAG, "Failed to send GPS data for UIT: " + courseData.uit, e);
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "Error preparing GPS data", e);
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "GPS Tracking Service",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Tracks GPS coordinates for active transport courses");
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void updateNotification() {
        String contentText = activeCourses.size() + " cursuri active - GPS tracking";
        
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("iTrack GPS Tracking")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();

        startForeground(NOTIFICATION_ID, notification);
    }

    private void acquireWakeLock() {
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "iTrack:SimpleGPSWakeLock"
            );
            wakeLock.acquire();
            Log.d(TAG, "WakeLock acquired for reliable GPS tracking");
        }
    }

    private int getBatteryLevel() {
        // Simplified battery level - could be enhanced
        return 85;
    }

    private String getGSMSignalStrength() {
        try {
            TelephonyManager telephonyManager = (TelephonyManager) getSystemService(TELEPHONY_SERVICE);
            if (telephonyManager != null) {
                // Return a reasonable signal strength value
                return "75";
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not get GSM signal strength", e);
        }
        return "50";
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "SimpleGPSService destroyed");
        
        isRunning = false;
        
        if (transmissionTimer != null) {
            transmissionTimer.cancel();
        }
        
        if (locationManager != null) {
            try {
                locationManager.removeUpdates(this);
            } catch (SecurityException e) {
                Log.w(TAG, "Error removing location updates", e);
            }
        }
        
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        
        activeCourses.clear();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
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
        Log.w(TAG, "Location provider disabled: " + provider);
    }
}