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
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
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
 * Suportă multiple curse active simultan - transmite pentru fiecare UIT separat
 * Funcționează în background chiar când aplicația e minimizată sau telefonul blocat
 */

// Class pentru stocarea datelor unei curse
class CourseData {
    public String courseId;
    public String uit;
    public int status;
    public long lastTransmissionTime;
    
    public CourseData(String courseId, String uit, int status) {
        this.courseId = courseId;
        this.uit = uit;
        this.status = status;
        this.lastTransmissionTime = System.currentTimeMillis();
    }
}
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

    // Multiple courses tracking - pentru curse simultane
    private Map<String, CourseData> activeCourses = new HashMap<>();
    
    // Default data for service operations
    private String vehicleNumber;
    private String authToken;

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
                String courseId = intent.getStringExtra("courseId");
                stopSpecificCourse(courseId != null ? courseId : "ALL_COURSES");
            } else if ("UPDATE_STATUS".equals(action)) {
                updateCourseStatus(intent);
            }
        }

        return START_STICKY; // Restart service if killed
    }

    private void startGPSTracking(Intent intent) {
        String courseId = intent.getStringExtra("courseId");
        String uit = intent.getStringExtra("uit");
        int status = intent.getIntExtra("status", 2);
        
        // Store vehicle and auth data (shared across courses)
        vehicleNumber = intent.getStringExtra("vehicleNumber");
        authToken = intent.getStringExtra("authToken");

        Log.d(TAG, "=== STARTING GPS TRACKING ===");
        Log.d(TAG, "Course ID: " + courseId);
        Log.d(TAG, "UIT: " + uit);
        Log.d(TAG, "Status: " + status);
        Log.d(TAG, "Vehicle: " + vehicleNumber);
        Log.d(TAG, "Active courses before: " + activeCourses.size());

        // Add course to active tracking
        CourseData courseData = new CourseData(courseId, uit, status);
        activeCourses.put(courseId, courseData);
        
        Log.d(TAG, "Active courses after: " + activeCourses.size());
        for (String key : activeCourses.keySet()) {
            CourseData cd = activeCourses.get(key);
            Log.d(TAG, "  Course: " + key + " (UIT: " + cd.uit + ", Status: " + cd.status + ")");
        }

        // Start foreground service if not already running
        if (!isTracking) {
            startForeground(NOTIFICATION_ID, createNotification());
            startLocationUpdates();
            startGPSTransmissionLoop();
            isTracking = true;
            Log.d(TAG, "✅ GPS service started with foreground and location tracking");
        } else {
            Log.d(TAG, "✅ Course added to existing GPS service");
        }
        
        // Send immediate status update for new course
        if (status == 3 || status == 4) {
            sendSingleStatusUpdate(courseData);
            if (status == 4) {
                // Remove finished course after status update
                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    activeCourses.remove(courseId);
                    Log.d(TAG, "Course " + courseId + " removed (finished)");
                    checkStopService();
                }, 2000);
            }
        }
    }

    private void stopGPSTracking() {
        String courseId = "ALL_COURSES"; // Default for stop all
        stopSpecificCourse(courseId);
    }
    
    private void stopSpecificCourse(String courseId) {
        Log.d(TAG, "=== STOPPING GPS TRACKING ===");
        Log.d(TAG, "Course ID: " + courseId);
        
        if ("ALL_COURSES".equals(courseId) || "LOGOUT_CLEAR_ALL".equals(courseId)) {
            Log.d(TAG, "Stopping ALL courses");
            activeCourses.clear();
        } else {
            activeCourses.remove(courseId);
            Log.d(TAG, "Removed course: " + courseId);
        }
        
        Log.d(TAG, "Remaining active courses: " + activeCourses.size());
        checkStopService();
    }
    
    private void checkStopService() {
        if (activeCourses.isEmpty()) {
            Log.d(TAG, "No active courses - stopping GPS service");
            isTracking = false;
            stopLocationUpdates();
            stopGPSTransmissionLoop();
            releaseWakeLock();
            stopForeground(true);
            stopSelf();
        } else {
            Log.d(TAG, "Still have " + activeCourses.size() + " active courses - keeping service running");
        }
    }

    private void updateCourseStatus(Intent intent) {
        String courseId = intent.getStringExtra("courseId");
        int newStatus = intent.getIntExtra("status", 2);
        
        CourseData course = activeCourses.get(courseId);
        if (course == null) {
            Log.w(TAG, "Course not found for status update: " + courseId);
            return;
        }
        
        int oldStatus = course.status;
        Log.d(TAG, "=== STATUS UPDATE ===");
        Log.d(TAG, "Course: " + courseId + " (UIT: " + course.uit + ")");
        Log.d(TAG, "Status: " + oldStatus + " → " + newStatus);
        
        course.status = newStatus;
        
        if (newStatus == 2) {
            Log.d(TAG, "RESUME/ACTIVATE: Course will transmit continuously");
            // Service already running, just update status
        } else if (newStatus == 3) {
            Log.d(TAG, "PAUSE: Sending status update");
            sendSingleStatusUpdate(course);
        } else if (newStatus == 4) {
            Log.d(TAG, "FINISH: Sending final status and removing course");
            sendSingleStatusUpdate(course);
            // Remove course after final transmission
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                activeCourses.remove(courseId);
                Log.d(TAG, "Course " + courseId + " removed (finished)");
                checkStopService();
            }, 2000);
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
        if (!isTracking || lastLocation == null || activeCourses.isEmpty()) {
            return;
        }

        Log.d(TAG, "=== TRANSMITTING GPS FOR ALL ACTIVE COURSES ===");
        Log.d(TAG, "Active courses: " + activeCourses.size());

        // Transmite coordonate pentru fiecare cursă activă cu status 2
        for (Map.Entry<String, CourseData> entry : activeCourses.entrySet()) {
            CourseData course = entry.getValue();
            
            if (course.status == 2) { // Doar cursele active transmit coordonate continue
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
                    gpsData.put("uit", course.uit); // UIT specific pentru această cursă
                    gpsData.put("status", String.valueOf(course.status));
                    gpsData.put("hdop", String.format("%.1f", lastLocation.getAccuracy()));
                    gpsData.put("gsm_signal", "4");

                    transmitGPSData(gpsData);
                    course.lastTransmissionTime = System.currentTimeMillis();
                    transmissionCount++;
                    
                    Log.d(TAG, String.format("📡 GPS #%d sent for UIT: %s (%.6f, %.6f)", 
                        transmissionCount, course.uit, lastLocation.getLatitude(), lastLocation.getLongitude()));
                        
                } catch (Exception e) {
                    Log.e(TAG, "Error preparing GPS data for UIT: " + course.uit, e);
                }
            } else {
                Log.d(TAG, "⏸️ Skipping UIT: " + course.uit + " (status: " + course.status + " - not active)");
            }
        }
    }

    private void sendSingleStatusUpdate(CourseData course) {
        try {
            // Pentru status update folosește coordonatele curente dacă sunt disponibile
            double lat = (lastLocation != null) ? lastLocation.getLatitude() : 0;
            double lng = (lastLocation != null) ? lastLocation.getLongitude() : 0;
            int speed = (lastLocation != null) ? Math.max(0, (int) (lastLocation.getSpeed() * 3.6)) : 0;
            int bearing = (lastLocation != null) ? (int) lastLocation.getBearing() : 0;
            int altitude = (lastLocation != null) ? (int) lastLocation.getAltitude() : 0;
            
            JSONObject statusData = new JSONObject();
            statusData.put("lat", lat);
            statusData.put("lng", lng);
            statusData.put("timestamp", getCurrentTimestamp());
            statusData.put("viteza", speed);
            statusData.put("directie", bearing);
            statusData.put("altitudine", altitude);
            statusData.put("baterie", getBatteryLevel());
            statusData.put("numar_inmatriculare", vehicleNumber);
            statusData.put("uit", course.uit); // UIT specific pentru această cursă
            statusData.put("status", String.valueOf(course.status));
            statusData.put("hdop", lastLocation != null ? String.format("%.1f", lastLocation.getAccuracy()) : "1.0");
            statusData.put("gsm_signal", "4");

            transmitGPSData(statusData);
            Log.d(TAG, String.format("📤 Status update sent: %d for UIT: %s at %.6f,%.6f", 
                course.status, course.uit, lat, lng));
            
        } catch (Exception e) {
            Log.e(TAG, "Error sending status update for UIT: " + course.uit, e);
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