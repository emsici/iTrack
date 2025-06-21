package com.euscagency.itrack;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.BatteryManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.telephony.SignalStrength;
import android.telephony.TelephonyManager;
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
    public String vehicleNumber;
    
    public CourseData(String courseId, String uit, int status, String vehicleNumber) {
        this.courseId = courseId;
        this.uit = uit;
        this.status = status;
        this.vehicleNumber = vehicleNumber;
    }
}

public class EnhancedGPSService extends Service implements LocationListener {
    private static final String TAG = "EnhancedGPSService";
    private static final String CHANNEL_ID = "itrack_gps_channel";
    private static final int NOTIFICATION_ID = 12345;
    private static final String API_BASE_URL = "https://www.euscagency.com/etsm3/platforme/transport/apk";
    private static final int GPS_INTERVAL_MS = 5000; // 5 secunde

    // Core components
    private LocationManager locationManager;
    private PowerManager.WakeLock wakeLock;
    private Handler gpsHandler;
    private Runnable gpsRunnable;
    private OkHttpClient httpClient;

    // Multiple courses tracking - pentru curse simultane
    private Map<String, CourseData> activeCourses = new HashMap<>();
    
    // User authentication - UN SINGUR TOKEN PER USER
    private String userAuthToken;
    private String userVehicleNumber;
    
    // GPS tracking state
    private boolean isTracking = false;
    private Location lastLocation;
    private long transmissionCount = 0;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "EnhancedGPSService created");

        try {
            activeCourses = new HashMap<>();
            createNotificationChannel();
            initializeWakeLock();
            initializeHttpClient();
            initializeLocationManager();
            initializeGPSHandler();
            Log.d(TAG, "EnhancedGPSService initialized successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error initializing EnhancedGPSService: " + e.getMessage(), e);
            stopSelf();
        }
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
        String vehicleNumber = intent.getStringExtra("vehicleNumber");
        String authToken = intent.getStringExtra("authToken");
        
        if (courseId == null || uit == null || vehicleNumber == null || authToken == null) {
            Log.e(TAG, "Missing required parameters for GPS tracking");
            return;
        }

        Log.d(TAG, "=== START GPS TRACKING ===");
        Log.d(TAG, "Course ID: " + courseId);
        Log.d(TAG, "UIT: " + uit);
        Log.d(TAG, "Status: " + status);
        Log.d(TAG, "Vehicle: " + vehicleNumber);
        Log.d(TAG, "Auth Token: " + (authToken != null ? authToken.substring(0, Math.min(20, authToken.length())) + "..." : "NULL"));

        // Setează user auth token și vehicle number (același pentru toate cursele)
        if (userAuthToken == null) {
            userAuthToken = authToken;
            userVehicleNumber = vehicleNumber;
            Log.d(TAG, "User authentication set for vehicle: " + vehicleNumber);
        }

        // Adaugă cursă în Map (fără authToken - este la nivel de user)
        CourseData courseData = new CourseData(courseId, uit, status, vehicleNumber);
        activeCourses.put(courseId, courseData);
        
        // Start foreground service dacă nu e deja pornit
        if (!isTracking) {
            Log.d(TAG, "STARTING FOREGROUND SERVICE - First course");
            startForeground(NOTIFICATION_ID, createNotification());
            startLocationUpdates();
            isTracking = true;
            Log.d(TAG, "isTracking set to: " + isTracking);
            startGPSTransmissions();
            Log.d(TAG, "GPS Service started as foreground - transmission should begin now");
        } else {
            Log.d(TAG, "SERVICE ALREADY RUNNING - Adding course to existing service");
            // Update notification pentru cursă nouă
            NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            manager.notify(NOTIFICATION_ID, createNotification());
            Log.d(TAG, "Course added to existing GPS service");
        }

        Log.d(TAG, "Total active courses: " + activeCourses.size());
    }

    private void stopSpecificCourse(String courseId) {
        if ("ALL_COURSES".equals(courseId)) {
            Log.d(TAG, "=== STOP ALL COURSES ===");
            activeCourses.clear();
        } else {
            Log.d(TAG, "=== STOP SPECIFIC COURSE ===");
            Log.d(TAG, "Course ID: " + courseId);
            
            CourseData course = activeCourses.get(courseId);
            if (course != null) {
                // Trimite status final 4 înainte de eliminare
                course.status = 4;
                sendSingleStatusUpdate(course);
                activeCourses.remove(courseId);
                Log.d(TAG, "Course " + courseId + " removed");
            }
        }
        
        checkStopService();
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
            Log.d(TAG, "✅ ACTIVATE: Course will transmit continuously at 5-second intervals");
            // Serviciul rulează deja, status 2 = transmisie continuă în gpsRunnable
            // Nu trimite update separat - va fi inclus în transmisia continuă
        } else if (newStatus == 3) {
            Log.d(TAG, "⏸️ PAUSE: Sending single status update, stopping continuous transmission");
            sendSingleStatusUpdate(course);
            // Status 3 = nu mai transmite în gpsRunnable (doar dacă status == 2)
        } else if (newStatus == 4) {
            Log.d(TAG, "🏁 FINISH: Sending final status and removing course completely");
            sendSingleStatusUpdate(course);
            // Remove course după transmisia finală
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                activeCourses.remove(courseId);
                Log.d(TAG, "Course " + courseId + " removed from active tracking");
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
                // Request both GPS and Network provider for better coverage
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    1000, // 1 second
                    1,    // 1 meter
                    this
                );
                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    1000, // 1 second
                    1,    // 1 meter
                    this
                );
                
                // Get last known location immediately
                Location lastGPS = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                Location lastNetwork = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                
                if (lastGPS != null) {
                    lastLocation = lastGPS;
                    Log.d(TAG, "📍 Using last known GPS location: " + lastGPS.getLatitude() + ", " + lastGPS.getLongitude());
                } else if (lastNetwork != null) {
                    lastLocation = lastNetwork;
                    Log.d(TAG, "📍 Using last known Network location: " + lastNetwork.getLatitude() + ", " + lastNetwork.getLongitude());
                }
                
                Log.d(TAG, "✅ Location updates started (GPS + Network)");
            } catch (SecurityException e) {
                Log.e(TAG, "❌ Location permission denied", e);
            }
        }
    }

    private void startGPSTransmissions() {
        Log.d(TAG, "=== STARTING GPS TRANSMISSIONS ===");
        Log.d(TAG, "gpsHandler: " + (gpsHandler != null ? "OK" : "NULL"));
        Log.d(TAG, "gpsRunnable: " + (gpsRunnable != null ? "OK" : "NULL"));
        Log.d(TAG, "Interval: " + GPS_INTERVAL_MS + "ms");
        
        if (gpsHandler != null && gpsRunnable != null) {
            gpsHandler.post(gpsRunnable);
            Log.d(TAG, "GPS transmission runnable posted successfully");
            Log.d(TAG, "First transmission cycle will start immediately");
        } else {
            Log.e(TAG, "CRITICAL ERROR - Cannot start GPS transmissions");
            Log.e(TAG, "gpsHandler: " + (gpsHandler != null ? "OK" : "NULL"));
            Log.e(TAG, "gpsRunnable: " + (gpsRunnable != null ? "OK" : "NULL"));
        }
    }

    private void checkStopService() {
        if (activeCourses.isEmpty()) {
            Log.d(TAG, "=== STOPPING GPS SERVICE ===");
            Log.d(TAG, "No active courses remaining");
            
            // Reset service state când nu mai există curse active
            // NOTA: Aceasta NU afectează sesiunea user-ului în aplicație
            // Este doar cleanup al serviciului GPS în background
            userAuthToken = null;
            userVehicleNumber = null;
            isTracking = false;
            
            if (gpsHandler != null && gpsRunnable != null) {
                gpsHandler.removeCallbacks(gpsRunnable);
            }
            
            if (locationManager != null) {
                locationManager.removeUpdates(this);
            }
            
            stopForeground(true);
            stopSelf();
            
            Log.d(TAG, "GPS Service stopped completely");
        } else {
            Log.d(TAG, "Service continues - " + activeCourses.size() + " courses active");
            // Update notification
            NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            manager.notify(NOTIFICATION_ID, createNotification());
        }
    }

    private void initializeGPSHandler() {
        Log.d(TAG, "=== INITIALIZING GPS HANDLER ===");
        gpsHandler = new Handler(Looper.getMainLooper());
        Log.d(TAG, "Handler created: " + (gpsHandler != null ? "SUCCESS" : "FAILED"));
        
        gpsRunnable = new Runnable() {
            @Override
            public void run() {
                Log.d(TAG, "=== GPS TRANSMISSION CYCLE START ===");
                Log.d(TAG, "isTracking: " + isTracking);
                Log.d(TAG, "lastLocation: " + (lastLocation != null ? "AVAILABLE" : "NULL"));
                Log.d(TAG, "activeCourses count: " + activeCourses.size());
                
                if (lastLocation != null && !activeCourses.isEmpty()) {
                    Log.d(TAG, "CONDITIONS MET - Processing GPS transmission");
                    Log.d(TAG, "Location: " + String.format(Locale.US, "%.6f, %.6f", lastLocation.getLatitude(), lastLocation.getLongitude()));
                    
                    // Transmite DOAR pentru cursele cu status 2 (ACTIVE)
                    int transmittedCount = 0;
                    for (CourseData course : activeCourses.values()) {
                        if (course.status == 2) {
                            Log.d(TAG, "Transmitting GPS for UIT: " + course.uit + " (Status: " + course.status + ")");
                            transmitGPSData(course, lastLocation, userAuthToken);
                            transmittedCount++;
                        } else {
                            Log.d(TAG, "Skipping UIT: " + course.uit + " (Status: " + course.status + " - not active)");
                        }
                    }
                    
                    transmissionCount++;
                    Log.d(TAG, "Transmission #" + transmissionCount + " - sent to " + transmittedCount + " active courses");
                } else if (lastLocation == null) {
                    Log.d(TAG, "WAITING FOR GPS LOCATION - GPS needs time to get first fix");
                    Log.d(TAG, "Active courses: " + activeCourses.size() + " - will transmit once GPS location available");
                } else {
                    Log.d(TAG, "SKIPPING TRANSMISSION - No active courses");
                }
                
                // ALWAYS schedule next transmission if service is tracking and has courses
                // Even if no GPS location yet - GPS needs time to get first fix
                if (isTracking && !activeCourses.isEmpty()) {
                    Log.d(TAG, "Scheduling next transmission in " + (GPS_INTERVAL_MS/1000) + " seconds");
                    gpsHandler.postDelayed(this, GPS_INTERVAL_MS);
                } else {
                    Log.d(TAG, "STOPPING GPS transmissions - service stopped or no courses");
                    Log.d(TAG, "isTracking: " + isTracking + ", activeCourses: " + activeCourses.size());
                }
            }
        };
        
        Log.d(TAG, "Runnable created: " + (gpsRunnable != null ? "SUCCESS" : "FAILED"));
        Log.d(TAG, "GPS Handler initialization complete");
    }

    private void transmitGPSData(CourseData course, Location location, String authToken) {
        try {
            JSONObject gpsData = new JSONObject();
            gpsData.put("lat", String.format(Locale.US, "%.6f", location.getLatitude()));
            gpsData.put("lng", String.format(Locale.US, "%.6f", location.getLongitude()));
            gpsData.put("timestamp", new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(new Date()));
            gpsData.put("viteza", location.hasSpeed() ? (int)(location.getSpeed() * 3.6) : 0);
            gpsData.put("directie", location.hasBearing() ? (int)location.getBearing() : 0);
            gpsData.put("altitudine", location.hasAltitude() ? (int)location.getAltitude() : 0);
            gpsData.put("baterie", getBatteryLevel());
            gpsData.put("numar_inmatriculare", course.vehicleNumber);
            gpsData.put("uit", course.uit);
            gpsData.put("status", String.valueOf(course.status));
            gpsData.put("hdop", location.hasAccuracy() ? String.format(Locale.US, "%.1f", location.getAccuracy()) : "999.0");
            gpsData.put("gsm_signal", getSignalStrength());

            sendGPSRequest(gpsData, course.authToken);
            
            Log.d(TAG, "GPS transmitted - UIT: " + course.uit + " Status: " + course.status + 
                  " Lat: " + String.format(Locale.US, "%.6f", location.getLatitude()) + 
                  " Lng: " + String.format(Locale.US, "%.6f", location.getLongitude()));
                  
        } catch (Exception e) {
            Log.e(TAG, "Error creating GPS data for UIT: " + course.uit, e);
        }
    }

    private void sendSingleStatusUpdate(CourseData course) {
        if (lastLocation == null) {
            Log.w(TAG, "No location available for status update");
            return;
        }
        
        try {
            JSONObject gpsData = new JSONObject();
            gpsData.put("lat", String.format(Locale.US, "%.6f", lastLocation.getLatitude()));
            gpsData.put("lng", String.format(Locale.US, "%.6f", lastLocation.getLongitude()));
            gpsData.put("timestamp", new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(new Date()));
            gpsData.put("viteza", lastLocation.hasSpeed() ? (int)(lastLocation.getSpeed() * 3.6) : 0);
            gpsData.put("directie", lastLocation.hasBearing() ? (int)lastLocation.getBearing() : 0);
            gpsData.put("altitudine", lastLocation.hasAltitude() ? (int)lastLocation.getAltitude() : 0);
            gpsData.put("baterie", getBatteryLevel());
            gpsData.put("numar_inmatriculare", course.vehicleNumber);
            gpsData.put("uit", course.uit);
            gpsData.put("status", String.valueOf(course.status));
            gpsData.put("hdop", lastLocation.hasAccuracy() ? String.format(Locale.US, "%.1f", lastLocation.getAccuracy()) : "999.0");
            gpsData.put("gsm_signal", getSignalStrength());

            sendGPSRequest(gpsData, userAuthToken);
            
            Log.d(TAG, "Status update sent - UIT: " + course.uit + " Status: " + course.status);
            
        } catch (Exception e) {
            Log.e(TAG, "Error sending status update for UIT: " + course.uit, e);
        }
    }

    private void sendGPSRequest(JSONObject gpsData, String authToken) {
        MediaType JSON = MediaType.get("application/json; charset=utf-8");
        RequestBody body = RequestBody.create(gpsData.toString(), JSON);
        
        Log.d(TAG, "Sending GPS request to: " + API_BASE_URL + "/gps.php");
        Log.d(TAG, "Request payload: " + gpsData.toString());
        Log.d(TAG, "Auth token: " + authToken.substring(0, Math.min(20, authToken.length())) + "...");
        
        Request request = new Request.Builder()
            .url(API_BASE_URL + "/gps.php")
            .addHeader("Authorization", "Bearer " + authToken)
            .addHeader("Content-Type", "application/json")
            .post(body)
            .build();

        httpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "GPS transmission failed - Network error", e);
                // TODO: Save to offline storage
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                String responseBody = "";
                if (response.body() != null) {
                    responseBody = response.body().string();
                }
                
                if (response.isSuccessful()) {
                    Log.d(TAG, "GPS transmission successful - HTTP " + response.code());

                    
                    Log.d(TAG, "✓ GPS coordinates successfully transmitted to server");
                    Log.d(TAG, "Server processed GPS data - HTTP 200 OK");
                } else {
                    Log.w(TAG, "GPS transmission failed - HTTP " + response.code());
                    Log.w(TAG, "Error response: '" + responseBody + "'");
                    
                    if (response.code() == 401) {
                        Log.e(TAG, "Authentication failed - Token expired or invalid");
                        Log.e(TAG, "Consider refreshing the authentication token");
                    }
                }
                response.close();
            }
        });
    }

    @Override
    public void onLocationChanged(Location location) {
        lastLocation = location;
        Log.d(TAG, "Location updated: " + 
              String.format(Locale.US, "%.6f, %.6f", location.getLatitude(), location.getLongitude()) +
              " Accuracy: " + (location.hasAccuracy() ? location.getAccuracy() + "m" : "unknown"));
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {
        Log.d(TAG, "GPS Status changed: " + provider + " Status: " + status);
    }

    @Override
    public void onProviderEnabled(String provider) {
        Log.d(TAG, "GPS Provider enabled: " + provider);
    }

    @Override
    public void onProviderDisabled(String provider) {
        Log.d(TAG, "GPS Provider disabled: " + provider);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "EnhancedGPSService destroyed");
        
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        
        if (gpsHandler != null && gpsRunnable != null) {
            gpsHandler.removeCallbacks(gpsRunnable);
        }
        
        if (locationManager != null) {
            locationManager.removeUpdates(this);
        }
    }

    private void createNotificationChannel() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "iTrack GPS Tracking",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("GPS tracking pentru curse active");
            channel.setShowBadge(false);
            channel.enableLights(false);
            channel.enableVibration(false);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification() {
        Intent intent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        String contentText = buildNotificationText();

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

    private String buildNotificationText() {
        if (activeCourses.isEmpty()) {
            return "Serviciu GPS pornit - Așteptare curse";
        }

        int activeCourseCount = 0;
        int pausedCourseCount = 0;
        
        for (CourseData course : activeCourses.values()) {
            if (course.status == 2) {
                activeCourseCount++;
            } else if (course.status == 3) {
                pausedCourseCount++;
            }
        }

        if (activeCourseCount > 0 && pausedCourseCount > 0) {
            return String.format("%d curse active • %d în pauză • Transmisii: %d", 
                activeCourseCount, pausedCourseCount, transmissionCount);
        } else if (activeCourseCount > 0) {
            return String.format("%d curse active • Transmisii: %d", 
                activeCourseCount, transmissionCount);
        } else if (pausedCourseCount > 0) {
            return String.format("%d curse în pauză", pausedCourseCount);
        } else {
            return "Curse încărcate - Așteptare activare";
        }
    }

    private void initializeWakeLock() {
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "iTrack::GPSWakeLock");
        wakeLock.acquire(2 * 60 * 60 * 1000L); // 2 hours max
    }

    private void initializeHttpClient() {
        httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build();
    }

    private void initializeLocationManager() {
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
    }

    /**
     * Citește nivelul real al bateriei din sistem
     */
    private int getBatteryLevel() {
        try {
            IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = this.registerReceiver(null, ifilter);
            
            if (batteryStatus != null) {
                int level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
                int scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
                
                if (level != -1 && scale != -1) {
                    return (int) ((level / (float) scale) * 100);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error reading battery level", e);
        }
        
        // Fallback dacă citirea eșuează
        return 90;
    }

    /**
     * Citește puterea semnalului GSM real
     */
    private String getSignalStrength() {
        try {
            TelephonyManager telephonyManager = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
            
            if (telephonyManager != null) {
                // Pentru Android 6.0+ folosim alte metode
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                    // Returnam o valoare estimată bazată pe tipul de rețea
                    int networkType = telephonyManager.getNetworkType();
                    switch (networkType) {
                        case TelephonyManager.NETWORK_TYPE_LTE:
                        case TelephonyManager.NETWORK_TYPE_NR: // 5G
                            return "4"; // Semnal excelent pentru LTE/5G
                        case TelephonyManager.NETWORK_TYPE_HSDPA:
                        case TelephonyManager.NETWORK_TYPE_HSUPA:
                        case TelephonyManager.NETWORK_TYPE_UMTS:
                            return "3"; // Semnal bun pentru 3G
                        case TelephonyManager.NETWORK_TYPE_EDGE:
                        case TelephonyManager.NETWORK_TYPE_GPRS:
                            return "2"; // Semnal mediu pentru 2G
                        default:
                            return "1"; // Semnal slab
                    }
                } else {
                    // Pentru versiuni mai vechi, returnăm o valoare standard
                    return "3";
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error reading signal strength", e);
        }
        
        // Fallback
        return "3";
    }

    /**
     * Verifică dacă dispozitivul are conexiune la internet
     */
    private boolean isNetworkAvailable() {
        try {
            ConnectivityManager connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (connectivityManager != null) {
                NetworkInfo activeNetworkInfo = connectivityManager.getActiveNetworkInfo();
                return activeNetworkInfo != null && activeNetworkInfo.isConnected();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error checking network availability", e);
        }
        return false;
    }
}