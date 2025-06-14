package com.euscagency.itrack;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
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
import android.telephony.TelephonyManager;
import android.telephony.SignalStrength;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class BackgroundGPSService extends Service implements LocationListener {
    
    private static final String TAG = "BackgroundGPSService";
    private static final int NOTIFICATION_ID = 12345;
    private static final String CHANNEL_ID = "GPS_TRACKING_CHANNEL";
    private static final long LOCATION_UPDATE_INTERVAL = 60000; // 60 seconds
    private static final long MIN_TIME_BETWEEN_UPDATES = 30000; // 30 seconds minimum
    private static final float MIN_DISTANCE_FOR_UPDATE = 0f; // Update on any movement
    
    private LocationManager locationManager;
    private PowerManager.WakeLock wakeLock;
    private Handler mainHandler;
    private ExecutorService executorService;
    
    // Course tracking data
    private Map<String, CourseData> activeCourses = new HashMap<>();
    private Location lastLocation;
    
    // GPS tracking variables
    private boolean isTracking = false;
    
    public static class CourseData {
        public String courseId;
        public String vehicleNumber;
        public String uit;
        public String token;
        
        public CourseData(String courseId, String vehicleNumber, String uit, String token) {
            this.courseId = courseId;
            this.vehicleNumber = vehicleNumber;
            this.uit = uit;
            this.token = token;
        }
    }
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Background GPS Service created");
        
        mainHandler = new Handler(Looper.getMainLooper());
        executorService = Executors.newFixedThreadPool(3);
        
        createNotificationChannel();
        acquireWakeLock();
        initializeLocationManager();
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Background GPS Service started");
        
        if (intent != null) {
            String action = intent.getStringExtra("action");
            
            if ("START_TRACKING".equals(action)) {
                String courseId = intent.getStringExtra("courseId");
                String vehicleNumber = intent.getStringExtra("vehicleNumber");
                String uit = intent.getStringExtra("uit");
                String token = intent.getStringExtra("token");
                
                if (courseId != null && vehicleNumber != null && uit != null && token != null) {
                    startTrackingCourse(courseId, vehicleNumber, uit, token);
                }
            } else if ("STOP_TRACKING".equals(action)) {
                String courseId = intent.getStringExtra("courseId");
                if (courseId != null) {
                    stopTrackingCourse(courseId);
                }
            }
        }
        
        startForeground(NOTIFICATION_ID, createNotification());
        
        return START_STICKY; // Restart if killed by system
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "GPS Tracking",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Urmărire GPS pentru cursele active");
            channel.setSound(null, null);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
    
    private Notification createNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("iTrack GPS Activ")
            .setContentText("Urmărire vehicul în curs - nu opri")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setColor(0xFFFF0000) // Red color
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setOngoing(true) // Cannot be dismissed
            .setAutoCancel(false)
            .build();
    }
    
    private void acquireWakeLock() {
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "iTrack::GPSWakeLock"
            );
            wakeLock.acquire(24 * 60 * 60 * 1000L); // 24 hours
            Log.d(TAG, "Wake lock acquired");
        }
    }
    
    private void initializeLocationManager() {
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        Log.d(TAG, "Location manager initialized");
    }
    
    public void startTrackingCourse(String courseId, String vehicleNumber, String uit, String token) {
        Log.d(TAG, "Starting tracking for course: " + courseId);
        
        CourseData courseData = new CourseData(courseId, vehicleNumber, uit, token);
        activeCourses.put(courseId, courseData);
        
        if (!isTracking) {
            startLocationTracking();
        }
        
        // Update notification
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, createNotification());
        }
    }
    
    public void stopTrackingCourse(String courseId) {
        Log.d(TAG, "Stopping tracking for course: " + courseId);
        
        activeCourses.remove(courseId);
        
        if (activeCourses.isEmpty()) {
            stopLocationTracking();
        }
    }
    
    private void startLocationTracking() {
        if (isTracking) return;
        
        try {
            if (locationManager != null) {
                // Request location updates from both GPS and Network providers
                if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                    locationManager.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER,
                        MIN_TIME_BETWEEN_UPDATES,
                        MIN_DISTANCE_FOR_UPDATE,
                        this
                    );
                    Log.d(TAG, "GPS provider location updates requested");
                }
                
                if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    locationManager.requestLocationUpdates(
                        LocationManager.NETWORK_PROVIDER,
                        MIN_TIME_BETWEEN_UPDATES,
                        MIN_DISTANCE_FOR_UPDATE,
                        this
                    );
                    Log.d(TAG, "Network provider location updates requested");
                }
                
                isTracking = true;
                Log.d(TAG, "Location tracking started successfully");
            }
        } catch (SecurityException e) {
            Log.e(TAG, "Location permission not granted", e);
        } catch (Exception e) {
            Log.e(TAG, "Error starting location tracking", e);
        }
    }
    
    private void stopLocationTracking() {
        if (!isTracking) return;
        
        try {
            if (locationManager != null) {
                locationManager.removeUpdates(this);
                Log.d(TAG, "Location tracking stopped");
            }
            isTracking = false;
        } catch (Exception e) {
            Log.e(TAG, "Error stopping location tracking", e);
        }
    }
    
    @Override
    public void onLocationChanged(Location location) {
        Log.d(TAG, "Location changed: " + location.getLatitude() + ", " + location.getLongitude());
        
        lastLocation = location;
        
        // Send GPS data for all active courses
        for (CourseData courseData : activeCourses.values()) {
            sendGPSDataAsync(location, courseData);
        }
    }
    
    private void sendGPSDataAsync(Location location, CourseData courseData) {
        executorService.execute(() -> {
            try {
                sendGPSData(location, courseData);
            } catch (Exception e) {
                Log.e(TAG, "Error sending GPS data for course: " + courseData.courseId, e);
            }
        });
    }
    
    private void sendGPSData(Location location, CourseData courseData) {
        try {
            // Calculate direction
            int direction = 0;
            if (location.hasBearing()) {
                direction = Math.round(location.getBearing());
            }
            
            // Get battery level
            int batteryLevel = getBatteryLevel();
            
            // Get GSM signal strength
            int gsmSignal = getGSMSignalStrength();
            
            // Prepare GPS data
            JSONObject gpsData = new JSONObject();
            gpsData.put("lat", location.getLatitude());
            gpsData.put("lng", location.getLongitude());
            gpsData.put("timestamp", new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(new Date()));
            gpsData.put("viteza", location.hasSpeed() ? Math.round(location.getSpeed() * 3.6) : 0); // Convert m/s to km/h
            gpsData.put("directie", direction);
            gpsData.put("altitudine", location.hasAltitude() ? Math.round(location.getAltitude()) : 0);
            gpsData.put("baterie", batteryLevel);
            gpsData.put("numar_inmatriculare", courseData.vehicleNumber);
            gpsData.put("uit", courseData.uit);
            gpsData.put("status", "active");
            gpsData.put("hdop", location.hasAccuracy() ? String.valueOf(Math.round(location.getAccuracy())) : "0");
            gpsData.put("gsm_signal", String.valueOf(gsmSignal));
            
            // Send to server
            boolean success = sendToServer(gpsData, courseData.token);
            
            if (success) {
                Log.d(TAG, "GPS data sent successfully for course: " + courseData.courseId + 
                          " - Lat: " + location.getLatitude() + ", Lng: " + location.getLongitude() +
                          ", Speed: " + (location.hasSpeed() ? Math.round(location.getSpeed() * 3.6) : 0) + " km/h");
            } else {
                Log.e(TAG, "Failed to send GPS data for course: " + courseData.courseId);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error preparing GPS data", e);
        }
    }
    
    private boolean sendToServer(JSONObject gpsData, String token) {
        try {
            URL url = new URL("https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Authorization", "Bearer " + token);
            connection.setDoOutput(true);
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);
            
            // Send data
            OutputStreamWriter writer = new OutputStreamWriter(connection.getOutputStream());
            writer.write(gpsData.toString());
            writer.flush();
            writer.close();
            
            // Get response
            int responseCode = connection.getResponseCode();
            
            if (responseCode == HttpURLConnection.HTTP_OK) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                reader.close();
                
                Log.d(TAG, "Server response: " + response.toString());
                return true;
            } else {
                Log.e(TAG, "Server returned error code: " + responseCode);
                return false;
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Network error sending GPS data", e);
            return false;
        }
    }
    
    private int getBatteryLevel() {
        try {
            android.content.IntentFilter ifilter = new android.content.IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = registerReceiver(null, ifilter);
            if (batteryStatus != null) {
                int level = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_LEVEL, -1);
                int scale = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_SCALE, -1);
                return Math.round(level * 100f / scale);
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not get battery level", e);
        }
        return 100;
    }
    
    private int getGSMSignalStrength() {
        try {
            TelephonyManager telephonyManager = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
            if (telephonyManager != null) {
                // Note: Getting signal strength requires additional permissions
                // For now, return a default good signal
                return 100;
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not get GSM signal strength", e);
        }
        return 100;
    }
    
    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {
        Log.d(TAG, "Location provider status changed: " + provider + " - " + status);
    }
    
    @Override
    public void onProviderEnabled(String provider) {
        Log.d(TAG, "Location provider enabled: " + provider);
    }
    
    @Override
    public void onProviderDisabled(String provider) {
        Log.d(TAG, "Location provider disabled: " + provider);
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    @Override
    public void onDestroy() {
        Log.d(TAG, "Background GPS Service destroyed");
        
        stopLocationTracking();
        
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        
        if (executorService != null) {
            executorService.shutdown();
        }
        
        super.onDestroy();
    }
}