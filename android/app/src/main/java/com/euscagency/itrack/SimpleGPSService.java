package com.euscagency.itrack;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import androidx.core.app.NotificationCompat;

import org.json.JSONObject;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class SimpleGPSService extends Service implements LocationListener {
    private static final String TAG = "SimpleGPSService";
    private static final int NOTIFICATION_ID = 1001;
    private static final String CHANNEL_ID = "gps_service_channel";
    private static final long GPS_INTERVAL_MS = 5000; // 5 seconds
    private static final String API_BASE_URL = "https://www.euscagency.com/etsm3/platforme/transport/apk";

    private LocationManager locationManager;
    private Handler gpsHandler;
    private Runnable gpsRunnable;
    private Location lastLocation;
    private boolean isTracking = false;
    private Map<String, CourseData> activeCourses = new HashMap<>();
    private String userAuthToken;
    private OkHttpClient httpClient;

    public static class CourseData {
        public String courseId;
        public String uit;
        public int status;
        public String vehicleNumber;

        public CourseData(String courseId, String uit, int status, String vehicleNumber) {
            this.courseId = courseId;
            this.uit = uit;
            this.status = status;
            this.vehicleNumber = vehicleNumber;
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "SimpleGPSService created");
        
        createNotificationChannel();
        locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
        httpClient = new OkHttpClient();
        initializeGPSHandler();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_STICKY;
        
        String action = intent.getAction();
        Log.d(TAG, "onStartCommand - Action: " + action);

        if ("START_TRACKING".equals(action)) {
            startGPSTracking(intent);
        } else if ("UPDATE_STATUS".equals(action)) {
            updateCourseStatus(intent);
        } else if ("STOP_TRACKING".equals(action)) {
            stopSpecificCourse(intent.getStringExtra("courseId"));
        }

        return START_STICKY;
    }

    private void startGPSTracking(Intent intent) {
        String courseId = intent.getStringExtra("courseId");
        String uit = intent.getStringExtra("uit");
        int status = intent.getIntExtra("status", 2);
        String vehicleNumber = intent.getStringExtra("vehicleNumber");
        String authToken = intent.getStringExtra("authToken");
        
        if (courseId == null || uit == null || vehicleNumber == null || authToken == null) {
            Log.e(TAG, "Missing required parameters");
            return;
        }

        Log.d(TAG, "Starting GPS tracking for course: " + courseId);
        
        if (userAuthToken == null) {
            userAuthToken = authToken;
        }

        CourseData courseData = new CourseData(courseId, uit, status, vehicleNumber);
        activeCourses.put(courseId, courseData);

        if (!isTracking) {
            Log.d(TAG, "Starting foreground service");
            startForeground(NOTIFICATION_ID, createNotification());
            startLocationUpdates();
            isTracking = true;
            startGPSTransmissions();
        }
    }

    private void startLocationUpdates() {
        try {
            locationManager.requestLocationUpdates(
                LocationManager.GPS_PROVIDER,
                1000,
                1,
                this
            );
            locationManager.requestLocationUpdates(
                LocationManager.NETWORK_PROVIDER,
                1000,
                1,
                this
            );
            
            Location lastGPS = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            if (lastGPS != null) {
                lastLocation = lastGPS;
                Log.d(TAG, "Using last known GPS location");
            }
            
            Log.d(TAG, "Location updates started");
        } catch (SecurityException e) {
            Log.e(TAG, "Location permission denied", e);
        }
    }

    private void initializeGPSHandler() {
        gpsHandler = new Handler(Looper.getMainLooper());
        gpsRunnable = new Runnable() {
            @Override
            public void run() {
                if (lastLocation != null && !activeCourses.isEmpty()) {
                    for (CourseData course : activeCourses.values()) {
                        if (course.status == 2) {
                            transmitGPSData(course, lastLocation);
                        }
                    }
                }
                
                if (isTracking && !activeCourses.isEmpty()) {
                    gpsHandler.postDelayed(this, GPS_INTERVAL_MS);
                }
            }
        };
    }

    private void startGPSTransmissions() {
        Log.d(TAG, "Starting GPS transmissions");
        gpsHandler.postDelayed(gpsRunnable, GPS_INTERVAL_MS);
    }

    private void transmitGPSData(CourseData course, Location location) {
        try {
            JSONObject gpsData = new JSONObject();
            gpsData.put("lat", String.format(Locale.US, "%.6f", location.getLatitude()));
            gpsData.put("lng", String.format(Locale.US, "%.6f", location.getLongitude()));
            gpsData.put("timestamp", new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(new Date()));
            gpsData.put("viteza", location.hasSpeed() ? (int)(location.getSpeed() * 3.6) : 0);
            gpsData.put("directie", location.hasBearing() ? (int)location.getBearing() : 0);
            gpsData.put("altitudine", location.hasAltitude() ? (int)location.getAltitude() : 0);
            gpsData.put("baterie", 100);
            gpsData.put("numar_inmatriculare", course.vehicleNumber);
            gpsData.put("uit", course.uit);
            gpsData.put("status", String.valueOf(course.status));
            gpsData.put("hdop", "1.0");
            gpsData.put("gsm_signal", "4G");

            sendGPSRequest(gpsData);
            Log.d(TAG, "GPS transmitted for UIT: " + course.uit);
            
        } catch (Exception e) {
            Log.e(TAG, "Error transmitting GPS", e);
        }
    }

    private void sendGPSRequest(JSONObject gpsData) {
        MediaType JSON = MediaType.get("application/json; charset=utf-8");
        RequestBody body = RequestBody.create(gpsData.toString(), JSON);
        
        Request request = new Request.Builder()
            .url(API_BASE_URL + "/gps.php")
            .addHeader("Authorization", "Bearer " + userAuthToken)
            .addHeader("Content-Type", "application/json")
            .post(body)
            .build();

        httpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "GPS transmission failed", e);
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    Log.d(TAG, "GPS transmission successful");
                } else {
                    Log.w(TAG, "GPS transmission failed - HTTP " + response.code());
                }
                response.close();
            }
        });
    }

    private void updateCourseStatus(Intent intent) {
        String courseId = intent.getStringExtra("courseId");
        int newStatus = intent.getIntExtra("status", 2);
        
        CourseData course = activeCourses.get(courseId);
        if (course != null) {
            course.status = newStatus;
            Log.d(TAG, "Course status updated: " + courseId + " -> " + newStatus);
        }
    }

    private void stopSpecificCourse(String courseId) {
        if ("ALL_COURSES".equals(courseId)) {
            activeCourses.clear();
        } else {
            activeCourses.remove(courseId);
        }
        
        if (activeCourses.isEmpty()) {
            isTracking = false;
            if (gpsHandler != null && gpsRunnable != null) {
                gpsHandler.removeCallbacks(gpsRunnable);
            }
            if (locationManager != null) {
                locationManager.removeUpdates(this);
            }
            stopForeground(true);
            stopSelf();
            Log.d(TAG, "GPS Service stopped");
        }
    }

    private void createNotificationChannel() {
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "GPS Tracking Service",
            NotificationManager.IMPORTANCE_LOW
        );
        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.createNotificationChannel(channel);
    }

    private Notification createNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("iTrack GPS Active")
            .setContentText("Tracking " + activeCourses.size() + " courses")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .build();
    }

    @Override
    public void onLocationChanged(Location location) {
        lastLocation = location;
        Log.d(TAG, "Location updated: " + location.getLatitude() + ", " + location.getLongitude());
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}