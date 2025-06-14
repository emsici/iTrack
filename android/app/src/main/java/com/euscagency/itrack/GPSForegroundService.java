package com.euscagency.itrack;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.telephony.TelephonyManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import okhttp3.*;
import org.json.JSONObject;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.Map;
import java.util.HashMap;

public class GPSForegroundService extends Service implements LocationListener {
    private static final String TAG = "GPSForegroundService";
    private static final String CHANNEL_ID = "gps_tracking_channel";
    private static final int NOTIFICATION_ID = 1;
    private static final int LOCATION_INTERVAL = 0; // Immediate location updates
    private static final float LOCATION_DISTANCE = 0f; // No minimum distance
    
    private LocationManager locationManager;
    private PowerManager.WakeLock wakeLock;
    private ScheduledExecutorService scheduler;
    private OkHttpClient httpClient;
    private TelephonyManager telephonyManager;
    
    // GPS tracking data for multiple courses
    private Map<String, CourseData> activeCourses = new HashMap<>();
    private Location lastLocation;
    private Location previousLocation;
    private float lastValidBearing = 0f;
    
    // Course data structure
    private static class CourseData {
        String vehicleNumber;
        String courseId;
        String uit;
        String authToken;
        int status; // 2=activ, 3=pauză, 4=terminat
        
        CourseData(String vehicleNumber, String courseId, String uit, String authToken) {
            this.vehicleNumber = vehicleNumber;
            this.courseId = courseId;
            this.uit = uit;
            this.authToken = authToken;
            this.status = 2; // Start active
        }
    }
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "GPS Foreground Service Created for background tracking");
        
        createNotificationChannel();
        acquireWakeLock();
        initializeLocationManager();
        initializeTelephonyManager();
        initializeHttpClient();
        initializeScheduler();
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "GPS Foreground Service onStartCommand for multiple courses");
        
        if (intent != null) {
            String action = intent.getStringExtra("action");
            String courseId = intent.getStringExtra("courseId");
            
            if ("pause".equals(action) && courseId != null) {
                CourseData course = activeCourses.get(courseId);
                if (course != null) {
                    course.status = 3; // Pauză
                    Log.d(TAG, "Course " + courseId + " PAUSED - stops coordinate transmission");
                    sendGPSDataForCourse(course);
                }
                return START_STICKY;
                
            } else if ("resume".equals(action) && courseId != null) {
                CourseData course = activeCourses.get(courseId);
                if (course != null) {
                    course.status = 2; // Activ
                    Log.d(TAG, "Course " + courseId + " RESUMED - resumes coordinate transmission");
                }
                return START_STICKY;
                
            } else if ("stop".equals(action) && courseId != null) {
                CourseData course = activeCourses.get(courseId);
                if (course != null) {
                    course.status = 4; // Terminat
                    Log.d(TAG, "Course " + courseId + " STOPPED - sending final status");
                    sendGPSDataForCourse(course);
                    activeCourses.remove(courseId);
                    
                    // Stop service if no more active courses
                    if (activeCourses.isEmpty()) {
                        Log.d(TAG, "No more courses - stopping service");
                        stopSelf();
                    }
                }
                return START_STICKY;
            }
            
            // New course start
            String vehicleNumber = intent.getStringExtra("vehicleNumber");
            String uit = intent.getStringExtra("uit");
            String authToken = intent.getStringExtra("authToken");
            
            if (courseId != null && vehicleNumber != null && uit != null && authToken != null) {
                CourseData newCourse = new CourseData(vehicleNumber, courseId, uit, authToken);
                activeCourses.put(courseId, newCourse);
                
                Log.d(TAG, "Added course " + courseId + " for vehicle " + vehicleNumber + ". Total courses: " + activeCourses.size());
                
                // Start location tracking and periodic transmission if first course
                if (activeCourses.size() == 1) {
                    startLocationTracking();
                    startForeground(NOTIFICATION_ID, createNotification());
                    startPeriodicGPSTransmission();
                }
            }
        }
        
        return START_STICKY;
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    @Override
    public void onDestroy() {
        Log.d(TAG, "GPS Foreground Service Destroyed");
        stopLocationTracking();
        releaseWakeLock();
        super.onDestroy();
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "iTrack GPS Background",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("GPS tracking continues in background");
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
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("iTrack GPS Active")
            .setContentText("Tracking " + activeCourses.size() + " courses in background")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setSilent(true)
            .build();
    }
    
    private void acquireWakeLock() {
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "iTrack::BackgroundGPS"
            );
            wakeLock.acquire(24 * 60 * 60 * 1000L); // 24 hours
            Log.d(TAG, "Wake lock acquired for background GPS");
        }
    }
    
    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            Log.d(TAG, "Wake lock released");
        }
    }
    
    private void initializeLocationManager() {
        locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
    }
    
    private void initializeTelephonyManager() {
        telephonyManager = (TelephonyManager) getSystemService(TELEPHONY_SERVICE);
    }
    
    private void initializeHttpClient() {
        httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build();
    }
    
    private void initializeScheduler() {
        scheduler = Executors.newSingleThreadScheduledExecutor();
    }
    
    private void startLocationTracking() {
        Log.d(TAG, "Starting GPS location tracking for background operation");
        
        try {
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    LOCATION_INTERVAL,
                    LOCATION_DISTANCE,
                    this
                );
                Log.d(TAG, "GPS provider enabled for background tracking");
            }
            
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    LOCATION_INTERVAL,
                    LOCATION_DISTANCE,
                    this
                );
                Log.d(TAG, "Network provider enabled for background tracking");
            }
            
        } catch (SecurityException e) {
            Log.e(TAG, "Location permission not granted for background", e);
        }
    }
    
    private void startPeriodicGPSTransmission() {
        Log.d(TAG, "URGENT: Starting GPS transmission - will force send coordinates");
        
        // Test immediate transmission
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Thread.sleep(5000); // Wait 5 seconds for location
                    Log.d(TAG, "FORCE SENDING GPS DATA NOW");
                    
                    // Force get location
                    tryGetLastKnownLocation();
                    
                    if (lastLocation != null) {
                        // Send for all courses immediately
                        for (Map.Entry<String, CourseData> entry : activeCourses.entrySet()) {
                            CourseData course = entry.getValue();
                            Log.d(TAG, "URGENT: Sending GPS for course " + course.courseId + " status " + course.status);
                            sendGPSDataForCourse(course);
                        }
                    } else {
                        Log.e(TAG, "CRITICAL: No location available - GPS permissions may be missing");
                    }
                } catch (Exception e) {
                    Log.e(TAG, "CRITICAL: Error in immediate GPS test", e);
                }
            }
        }).start();
        
        // Schedule regular transmission
        scheduler.scheduleWithFixedDelay(new Runnable() {
            @Override
            public void run() {
                try {
                    Log.d(TAG, "PERIODIC GPS CHECK - every 60 seconds");
                    
                    if (lastLocation == null) {
                        Log.w(TAG, "No location - trying to get last known");
                        tryGetLastKnownLocation();
                    }
                    
                    if (lastLocation == null) {
                        Log.e(TAG, "CRITICAL: Still no location - check permissions");
                        return;
                    }
                    
                    // Send GPS data for all active courses (status 2)
                    int sentCount = 0;
                    for (Map.Entry<String, CourseData> entry : activeCourses.entrySet()) {
                        CourseData course = entry.getValue();
                        if (course.status == 2) {
                            Log.d(TAG, "Sending GPS for active course: " + course.courseId);
                            sendGPSDataForCourse(course);
                            sentCount++;
                        } else {
                            Log.d(TAG, "Course " + course.courseId + " not active (status " + course.status + ")");
                        }
                    }
                    
                    Log.d(TAG, "GPS transmission complete: " + sentCount + " courses, " + activeCourses.size() + " total");
                    
                } catch (Exception e) {
                    Log.e(TAG, "CRITICAL: Error in periodic GPS transmission", e);
                }
            }
        }, 10, 60, TimeUnit.SECONDS);
        
        Log.d(TAG, "GPS transmission scheduled - immediate test + 60s periodic");
    }
    
    private void tryGetLastKnownLocation() {
        try {
            Location lastKnown = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            if (lastKnown == null) {
                lastKnown = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
            }
            if (lastKnown != null) {
                Log.d(TAG, "Using last known location for background transmission");
                lastLocation = lastKnown;
                
                // Send GPS data for all active courses
                for (Map.Entry<String, CourseData> entry : activeCourses.entrySet()) {
                    CourseData course = entry.getValue();
                    if (course.status == 2) {
                        sendGPSDataForCourse(course);
                    }
                }
            }
        } catch (SecurityException e) {
            Log.e(TAG, "Cannot access last known location", e);
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
        Log.d(TAG, "Background location changed: " + location.getLatitude() + ", " + location.getLongitude());
        
        previousLocation = lastLocation;
        lastLocation = location;
        
        if (location.hasBearing() && location.getBearing() >= 0) {
            lastValidBearing = location.getBearing();
        } else if (previousLocation != null) {
            lastValidBearing = calculateBearing(previousLocation, location);
        }
        
        Log.d(TAG, String.format("Background GPS updated: %.6f, %.6f, speed: %.1f km/h, bearing: %.1f°", 
            location.getLatitude(), location.getLongitude(), 
            location.getSpeed() * 3.6, lastValidBearing));
    }
    
    private void sendGPSDataForCourse(CourseData course) {
        if (lastLocation == null || course.authToken == null) {
            Log.w(TAG, "No location data or auth token for course " + course.courseId);
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
            gpsData.put("viteza", Math.round(lastLocation.getSpeed() * 3.6));
            gpsData.put("directie", Math.round(lastValidBearing));
            gpsData.put("altitudine", Math.round(lastLocation.getAltitude()));
            gpsData.put("baterie", batteryLevel);
            gpsData.put("numar_inmatriculare", course.vehicleNumber);
            gpsData.put("uit", course.uit);
            gpsData.put("status", course.status); // 2=activ, 3=pauză, 4=terminat
            gpsData.put("hdop", Math.round(lastLocation.getAccuracy()));
            gpsData.put("gsm_signal", getGSMSignalStrength());
            
            Log.d(TAG, "Sending GPS data for course " + course.courseId + " with status " + course.status);
            
            RequestBody body = RequestBody.create(
                gpsData.toString(),
                MediaType.get("application/json; charset=utf-8")
            );
            
            Request request = new Request.Builder()
                .url("https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php")
                .addHeader("Authorization", "Bearer " + course.authToken)
                .addHeader("Content-Type", "application/json")
                .post(body)
                .build();
            
            httpClient.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    Log.e(TAG, "Failed to send GPS data for course " + course.courseId, e);
                }
                
                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    if (response.isSuccessful()) {
                        Log.d(TAG, "GPS data sent successfully for course " + course.courseId + " (status " + course.status + ")");
                    } else {
                        Log.w(TAG, "GPS data send failed for course " + course.courseId + " with code: " + response.code());
                    }
                    response.close();
                }
            });
            
        } catch (Exception e) {
            Log.e(TAG, "Error sending GPS data for course " + course.courseId, e);
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
    
    private String getGSMSignalStrength() {
        try {
            if (telephonyManager != null) {
                return "100";
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not get GSM signal strength", e);
        }
        return "50";
    }
    
    private float calculateBearing(Location start, Location end) {
        double lat1 = Math.toRadians(start.getLatitude());
        double lat2 = Math.toRadians(end.getLatitude());
        double deltaLng = Math.toRadians(end.getLongitude() - start.getLongitude());
        
        double y = Math.sin(deltaLng) * Math.cos(lat2);
        double x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
        
        double bearing = Math.toDegrees(Math.atan2(y, x));
        return (float) ((bearing + 360) % 360);
    }
}