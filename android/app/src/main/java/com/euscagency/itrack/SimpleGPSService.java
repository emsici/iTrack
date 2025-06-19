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
import java.util.Map;
import java.util.HashMap;

public class SimpleGPSService extends Service implements LocationListener {
    private static final String TAG = "SimpleGPSService";
    private static final String CHANNEL_ID = "simple_gps_channel";
    private static final int NOTIFICATION_ID = 2;
    
    private LocationManager locationManager;
    private PowerManager.WakeLock wakeLock;
    private ScheduledExecutorService scheduler;
    private OkHttpClient httpClient;
    private TelephonyManager telephonyManager;
    
    // GPS tracking data
    private Location lastLocation;
    private String authToken;
    private boolean isServiceActive = false;
    
    // Multiple course tracking
    private Map<String, CourseData> activeCourses = new HashMap<>();
    
    // Course data structure
    private static class CourseData {
        String vehicleNumber;
        String courseId;
        String uit;
        int status;
        
        CourseData(String vehicleNumber, String courseId, String uit, int status) {
            this.vehicleNumber = vehicleNumber;
            this.courseId = courseId;
            this.uit = uit;
            this.status = status;
        }
    }
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "SimpleGPSService created");
        
        createNotificationChannel();
        initializeComponents();
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getStringExtra("action");
            
            if ("start".equals(action)) {
                String vehicleNumber = intent.getStringExtra("vehicleNumber");
                String courseId = intent.getStringExtra("courseId");
                String uit = intent.getStringExtra("uit");
                authToken = intent.getStringExtra("authToken");
                int courseStatus = intent.getIntExtra("status", 2);
                
                // Add course to active tracking
                CourseData courseData = new CourseData(vehicleNumber, courseId, uit, courseStatus);
                activeCourses.put(courseId, courseData);
                
                Log.d(TAG, "Added course " + courseId + " with UIT " + uit + " to active tracking");
                
                // Start GPS tracking if not already active
                if (!isServiceActive) {
                    startGPSTracking();
                } else {
                    // Update notification to show current course count
                    updateNotification();
                }
                
            } else if ("stop".equals(action)) {
                String courseId = intent.getStringExtra("courseId");
                
                // Remove course from active tracking
                activeCourses.remove(courseId);
                Log.d(TAG, "Removed course " + courseId + " from active tracking");
                
                // Stop GPS tracking if no more active courses
                if (activeCourses.isEmpty()) {
                    stopGPSTracking();
                } else {
                    // Update notification to show current course count
                    updateNotification();
                }
            }
        }
        
        return START_STICKY; // Restart if killed
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "iTrack GPS Simple",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("GPS tracking pentru curse active");
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
    
    private void initializeComponents() {
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        telephonyManager = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
        
        httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build();
            
        scheduler = Executors.newSingleThreadScheduledExecutor();
        
        // Acquire wake lock
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "iTrack::SimpleGPSWakeLock"
        );
        wakeLock.acquire();
        
        Log.d(TAG, "Components initialized");
    }
    
    private void startGPSTracking() {
        Log.d(TAG, "Starting simple GPS tracking for course: " + courseId);
        
        isServiceActive = true;
        
        // Start foreground service
        startForeground(NOTIFICATION_ID, createNotification());
        
        // Start location tracking
        startLocationUpdates();
        
        // Start GPS transmission timer
        startGPSTransmission();
        
        Log.d(TAG, "Simple GPS tracking started successfully");
    }
    
    private void stopGPSTracking() {
        Log.d(TAG, "Stopping simple GPS tracking");
        
        isServiceActive = false;
        
        // Stop location updates
        if (locationManager != null) {
            locationManager.removeUpdates(this);
        }
        
        // Stop scheduler
        if (scheduler != null && !scheduler.isShutdown()) {
            scheduler.shutdown();
        }
        
        // Release wake lock
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        
        // Stop foreground service
        stopForeground(true);
        stopSelf();
        
        Log.d(TAG, "Simple GPS tracking stopped");
    }
    
    private void startLocationUpdates() {
        try {
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    5000, // 5 seconds
                    0.5f, // 0.5 meters
                    this
                );
                Log.d(TAG, "GPS location updates started");
            }
            
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    5000, // 5 seconds
                    0.5f, // 0.5 meters
                    this
                );
                Log.d(TAG, "Network location updates started");
            }
        } catch (SecurityException e) {
            Log.e(TAG, "Location permission not granted", e);
        }
    }
    
    private void startGPSTransmission() {
        Log.d(TAG, "Starting GPS transmission every 60 seconds");
        
        scheduler.scheduleAtFixedRate(new Runnable() {
            @Override
            public void run() {
                if (isServiceActive && lastLocation != null && !activeCourses.isEmpty()) {
                    Log.d(TAG, "Transmitting GPS data for " + activeCourses.size() + " active courses");
                    sendGPSToAllCourses();
                } else if (isServiceActive) {
                    Log.w(TAG, "No location for transmission");
                    getLastKnownLocation();
                }
            }
        }, 10, 60, TimeUnit.SECONDS); // Start after 10 seconds, repeat every 60 seconds
    }
    
    private void getLastKnownLocation() {
        try {
            Location lastKnown = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            if (lastKnown == null) {
                lastKnown = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
            }
            if (lastKnown != null) {
                lastLocation = lastKnown;
                Log.d(TAG, "Using last known location");
            }
        } catch (SecurityException e) {
            Log.e(TAG, "Cannot access last known location", e);
        }
    }
    
    @Override
    public void onLocationChanged(Location location) {
        lastLocation = location;
        Log.d(TAG, String.format("Location: %.6f, %.6f, speed: %.1f km/h", 
            location.getLatitude(), location.getLongitude(), location.getSpeed() * 3.6));
    }
    
    private void sendGPSToAllCourses() {
        if (lastLocation == null || authToken == null) {
            Log.w(TAG, "No location or auth token");
            return;
        }
        
        // Send GPS data for each active course separately
        for (Map.Entry<String, CourseData> entry : activeCourses.entrySet()) {
            CourseData courseData = entry.getValue();
            sendGPSForCourse(courseData);
        }
    }
    
    private void sendGPSForCourse(CourseData courseData) {
        try {
            // Prepare GPS data for this specific course
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
            String timestamp = sdf.format(new Date());
            
            JSONObject gpsData = new JSONObject();
            gpsData.put("lat", lastLocation.getLatitude());
            gpsData.put("lng", lastLocation.getLongitude());
            gpsData.put("timestamp", timestamp);
            gpsData.put("viteza", Math.round(lastLocation.getSpeed() * 3.6)); // km/h
            gpsData.put("directie", Math.round(lastLocation.getBearing()));
            gpsData.put("altitudine", Math.round(lastLocation.getAltitude()));
            gpsData.put("baterie", getBatteryLevel());
            gpsData.put("numar_inmatriculare", courseData.vehicleNumber);
            gpsData.put("uit", courseData.uit);
            gpsData.put("status", String.valueOf(courseData.status));
            gpsData.put("hdop", Math.round(lastLocation.getAccuracy()));
            gpsData.put("gsm_signal", getGSMSignal());
            
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
                    Log.e(TAG, "GPS transmission failed for UIT " + courseData.uit, e);
                }
                
                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    if (response.isSuccessful()) {
                        Log.i(TAG, "GPS data transmitted successfully for UIT " + courseData.uit);
                    } else {
                        Log.w(TAG, "GPS transmission failed for UIT " + courseData.uit + ": " + response.code());
                    }
                    response.close();
                }
            });
            
            Log.i(TAG, String.format("GPS transmitted for course %s: %.6f,%.6f UIT=%s", 
                courseData.courseId, lastLocation.getLatitude(), lastLocation.getLongitude(), courseData.uit));
                
        } catch (Exception e) {
            Log.e(TAG, "Error sending GPS data for UIT " + courseData.uit, e);
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
        return 100;
    }
    
    private String getGSMSignal() {
        try {
            if (telephonyManager != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                SignalStrength signalStrength = telephonyManager.getSignalStrength();
                if (signalStrength != null) {
                    int level = signalStrength.getLevel(); // 0-4
                    return String.valueOf(level * 25); // Convert to 0-100
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not get GSM signal", e);
        }
        return "100";
    }
    
    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE
        );
        
        String contentText;
        if (activeCourses.isEmpty()) {
            contentText = "GPS ready";
        } else if (activeCourses.size() == 1) {
            CourseData course = activeCourses.values().iterator().next();
            contentText = "Vehicul " + course.vehicleNumber + " - 1 cursă activă";
        } else {
            contentText = activeCourses.size() + " curse active - GPS tracking";
        }
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("iTrack GPS Active")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }
    
    private void updateNotification() {
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.notify(NOTIFICATION_ID, createNotification());
        }
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        stopGPSTracking();
    }
    
    // Required LocationListener methods
    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {}
    
    @Override
    public void onProviderEnabled(String provider) {}
    
    @Override
    public void onProviderDisabled(String provider) {}
}