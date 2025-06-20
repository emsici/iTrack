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
import android.telephony.CellInfo;
import android.telephony.CellInfoGsm;
import android.telephony.CellInfoLte;
import android.telephony.CellSignalStrengthGsm;
import android.telephony.CellSignalStrengthLte;
import java.util.List;
import android.content.BroadcastReceiver;
import android.content.IntentFilter;

import okhttp3.*;
import org.json.JSONObject;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.TimeUnit;
import java.util.HashMap;
import java.util.Map;

public class EnhancedGPSService extends Service implements LocationListener {
    private static final String TAG = "EnhancedGPSService";
    private static final String CHANNEL_ID = "enhanced_gps_channel";
    private static final int NOTIFICATION_ID = 2;
    private static final long TRANSMISSION_INTERVAL = 5000; // 5 seconds
    private static final float MIN_DISTANCE = 0.5f; // Minimum 0.5m movement
    
    private LocationManager locationManager;
    private PowerManager.WakeLock wakeLock;
    private OkHttpClient httpClient;
    private TelephonyManager telephonyManager;
    private Handler transmissionHandler;
    private Runnable transmissionRunnable;
    
    // Course tracking data
    private Map<String, CourseData> activeCourses = new HashMap<>();
    private Location lastKnownLocation;
    private int transmissionCounter = 0;
    private long serviceStartTime;
    
    private static class CourseData {
        String vehicleNumber;
        String courseId;
        String uit;
        String authToken;
        int status;
        long startTime;
        
        CourseData(String vehicleNumber, String courseId, String uit, String authToken, int status) {
            this.vehicleNumber = vehicleNumber;
            this.courseId = courseId;
            this.uit = uit;
            this.authToken = authToken;
            this.status = status;
            this.startTime = System.currentTimeMillis();
        }
    }
    
    @Override
    public void onCreate() {
        super.onCreate();
        serviceStartTime = System.currentTimeMillis();
        Log.i(TAG, "🚀 Enhanced GPS Service starting...");
        
        createNotificationChannel();
        initializeWakeLock();
        initializeLocationManager();
        initializeTelephonyManager();
        initializeHttpClient();
        initializeTransmissionHandler();
        
        startLocationTracking();
        startForeground(NOTIFICATION_ID, createNotification());
        
        Log.i(TAG, "✅ Enhanced GPS Service fully initialized and running");
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getStringExtra("action");
            
            if ("START_TRACKING".equals(action)) {
                String vehicleNumber = intent.getStringExtra("vehicleNumber");
                String courseId = intent.getStringExtra("courseId");
                String uit = intent.getStringExtra("uit");
                String authToken = intent.getStringExtra("authToken");
                int status = intent.getIntExtra("status", 2);
                
                addCourse(vehicleNumber, courseId, uit, authToken, status);
                
            } else if ("STOP_TRACKING".equals(action)) {
                String courseId = intent.getStringExtra("courseId");
                removeCourse(courseId);
                
            } else if ("UPDATE_STATUS".equals(action)) {
                String courseId = intent.getStringExtra("courseId");
                int newStatus = intent.getIntExtra("status", 2);
                updateCourseStatus(courseId, newStatus);
            }
        }
        
        return START_STICKY;
    }
    
    private void addCourse(String vehicleNumber, String courseId, String uit, String authToken, int status) {
        CourseData course = new CourseData(vehicleNumber, courseId, uit, authToken, status);
        activeCourses.put(courseId, course);
        
        Log.i(TAG, "➕ Course added: " + courseId + " | Vehicle: " + vehicleNumber + " | UIT: " + uit);
        updateNotification();
        
        // Start transmission timer if this is the first course
        if (activeCourses.size() == 1) {
            startTransmissionTimer();
        }
    }
    
    private void removeCourse(String courseId) {
        CourseData removed = activeCourses.remove(courseId);
        if (removed != null) {
            Log.i(TAG, "➖ Course removed: " + courseId + " | Vehicle: " + removed.vehicleNumber);
            updateNotification();
            
            // Stop service if no active courses
            if (activeCourses.isEmpty()) {
                Log.i(TAG, "🛑 No active courses - stopping service");
                stopSelf();
            }
        }
    }
    
    private void updateCourseStatus(String courseId, int newStatus) {
        CourseData course = activeCourses.get(courseId);
        if (course != null) {
            course.status = newStatus;
            Log.i(TAG, "🔄 Course status updated: " + courseId + " → Status: " + newStatus);
            
            // Send immediate GPS update for status change
            if (lastKnownLocation != null) {
                sendGPSDataForCourse(course, lastKnownLocation);
            }
        }
    }
    
    private void initializeWakeLock() {
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "iTrack::EnhancedGPSWakeLock"
        );
        wakeLock.acquire();
        Log.d(TAG, "🔒 Wake lock acquired");
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
            .retryOnConnectionFailure(true)
            .build();
    }
    
    private void initializeTransmissionHandler() {
        transmissionHandler = new Handler(Looper.getMainLooper());
        transmissionRunnable = new Runnable() {
            @Override
            public void run() {
                transmitGPSDataForAllCourses();
                // Schedule next transmission
                transmissionHandler.postDelayed(this, TRANSMISSION_INTERVAL);
            }
        };
    }
    
    private void startLocationTracking() {
        try {
            // GPS provider with high accuracy and fast updates
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    1000, // 1 second for maximum responsiveness
                    0.0f, // No distance filter for maximum precision
                    this,
                    Looper.getMainLooper()
                );
                Log.d(TAG, "📡 High-precision GPS provider tracking started (1s interval)");
            }
            
            // Network provider as backup
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    2000, // 2 seconds for network
                    0.0f, // No distance filter
                    this,
                    Looper.getMainLooper()
                );
                Log.d(TAG, "📶 Network provider tracking started (2s interval)");
            }
            
            // Passive provider for additional data
            if (locationManager.isProviderEnabled(LocationManager.PASSIVE_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.PASSIVE_PROVIDER,
                    1000,
                    0.0f,
                    this,
                    Looper.getMainLooper()
                );
                Log.d(TAG, "🔄 Passive provider tracking started");
            }
            
            // Try to get last known location immediately
            getLastKnownLocation();
            
        } catch (SecurityException e) {
            Log.e(TAG, "❌ Location permission denied", e);
        }
    }
    
    private void startTransmissionTimer() {
        transmissionHandler.post(transmissionRunnable);
        Log.i(TAG, "⏱️ GPS transmission timer started (60s intervals)");
    }
    
    private void getLastKnownLocation() {
        try {
            Location gpsLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            Location networkLocation = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
            
            if (gpsLocation != null) {
                lastKnownLocation = gpsLocation;
            } else if (networkLocation != null) {
                lastKnownLocation = networkLocation;
            }
            
            if (lastKnownLocation != null) {
                Log.d(TAG, "📍 Last known location acquired: " + 
                      lastKnownLocation.getLatitude() + ", " + lastKnownLocation.getLongitude());
            }
        } catch (SecurityException e) {
            Log.e(TAG, "❌ Cannot access last known location", e);
        }
    }
    
    @Override
    public void onLocationChanged(Location location) {
        lastKnownLocation = location;
        Log.d(TAG, "📍 Location updated: " + 
              String.format("%.6f, %.6f", location.getLatitude(), location.getLongitude()) +
              " | Accuracy: " + Math.round(location.getAccuracy()) + "m" +
              " | Speed: " + Math.round(location.getSpeed() * 3.6) + " km/h");
    }
    
    private void transmitGPSDataForAllCourses() {
        if (lastKnownLocation == null) {
            Log.w(TAG, "⚠️ No location available for transmission");
            getLastKnownLocation();
            return;
        }
        
        if (activeCourses.isEmpty()) {
            Log.w(TAG, "⚠️ No active courses for GPS transmission");
            return;
        }
        
        transmissionCounter++;
        long uptime = System.currentTimeMillis() - serviceStartTime;
        
        Log.i(TAG, "📡 GPS Transmission #" + transmissionCounter + 
              " | Uptime: " + (uptime/1000) + "s | Active courses: " + activeCourses.size() +
              " | Interval: 5s");
        
        for (CourseData course : activeCourses.values()) {
            sendGPSDataForCourse(course, lastKnownLocation);
        }
    }
    
    private void sendGPSDataForCourse(CourseData course, Location location) {
        try {
            // Prepare GPS data
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
            String timestamp = sdf.format(new Date());
            
            float speed = location.hasSpeed() ? location.getSpeed() * 3.6f : 0.0f; // km/h
            float bearing = location.hasBearing() ? location.getBearing() : 0.0f;
            double altitude = location.hasAltitude() ? location.getAltitude() : 0.0;
            float accuracy = location.hasAccuracy() ? location.getAccuracy() : 999.0f;
            
            // Coordonate precise cu 8 zecimale pentru precizie maximă
            double lat = location.getLatitude();
            double lng = location.getLongitude();
            
            JSONObject gpsData = new JSONObject();
            gpsData.put("lat", lat); // Trimite ca număr pentru precizie maximă
            gpsData.put("lng", lng); // Trimite ca număr pentru precizie maximă
            gpsData.put("timestamp", timestamp);
            gpsData.put("viteza", Math.round(speed));
            gpsData.put("directie", Math.round(bearing));
            gpsData.put("altitudine", Math.round(altitude));
            gpsData.put("baterie", getBatteryLevel());
            gpsData.put("numar_inmatriculare", course.vehicleNumber);
            gpsData.put("uit", course.uit);
            gpsData.put("status", String.valueOf(course.status));
            gpsData.put("hdop", Math.round(accuracy));
            String gsmSignal = getGSMSignalStrength();
            gpsData.put("gsm_signal", gsmSignal);
            
            Log.d(TAG, "📶 GSM Signal being sent: " + gsmSignal + "%");
            
            // Create request
            RequestBody body = RequestBody.create(
                gpsData.toString(),
                MediaType.get("application/json; charset=utf-8")
            );
            
            Request request = new Request.Builder()
                .url("https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php")
                .addHeader("Authorization", "Bearer " + course.authToken)
                .addHeader("Content-Type", "application/json; charset=utf-8")
                .addHeader("User-Agent", "iTrack/2.0 Enhanced")
                .addHeader("Accept", "application/json")
                .post(body)
                .build();
            
            Log.d(TAG, "🚗 Sending HIGH-PRECISION GPS for Vehicle: " + course.vehicleNumber + 
                       " | UIT: " + course.uit + 
                       " | Status: " + course.status +
                       " | Coordinates: " + String.format("%.8f, %.8f", lat, lng) +
                       " | Accuracy: " + String.format("%.2f", accuracy) + "m");
            
            httpClient.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    Log.e(TAG, "❌ GPS transmission failed for UIT: " + course.uit + " - " + e.getMessage());
                }
                
                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    try {
                        String responseBody = response.body() != null ? response.body().string() : "";
                        
                        if (response.isSuccessful()) {
                            Log.i(TAG, "✅ GPS sent successfully for UIT: " + course.uit + 
                                       " | Response: " + responseBody);
                        } else {
                            Log.e(TAG, "❌ Server error " + response.code() + 
                                       " for UIT: " + course.uit + 
                                       " | Response: " + responseBody);
                        }
                    } finally {
                        response.close();
                    }
                }
            });
            
        } catch (Exception e) {
            Log.e(TAG, "💥 Error sending GPS data for UIT: " + course.uit, e);
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
            Log.w(TAG, "Cannot get battery level", e);
        }
        return 100; // Default fallback
    }
    
    private String getGSMSignalStrength() {
        try {
            if (telephonyManager != null) {
                // Get signal strength using newer API
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    SignalStrength signalStrength = telephonyManager.getSignalStrength();
                    if (signalStrength != null) {
                        int level = signalStrength.getLevel(); // 0-4 scale
                        int percentage = (level * 100) / 4; // Convert to 0-100%
                        Log.d(TAG, "📶 Real GSM Signal: " + percentage + "% (Level " + level + "/4)");
                        return String.valueOf(percentage);
                    }
                } else {
                    // Fallback for older Android versions
                    try {
                        List<CellInfo> cellInfos = telephonyManager.getAllCellInfo();
                        if (cellInfos != null && !cellInfos.isEmpty()) {
                            for (CellInfo cellInfo : cellInfos) {
                                if (cellInfo.isRegistered()) {
                                    if (cellInfo instanceof CellInfoGsm) {
                                        CellSignalStrengthGsm gsmStrength = ((CellInfoGsm) cellInfo).getCellSignalStrength();
                                        int dbm = gsmStrength.getDbm();
                                        int percentage = calculateSignalPercentage(dbm);
                                        Log.d(TAG, "📶 Real GSM Signal: " + percentage + "% (" + dbm + " dBm)");
                                        return String.valueOf(percentage);
                                    } else if (cellInfo instanceof CellInfoLte) {
                                        CellSignalStrengthLte lteStrength = ((CellInfoLte) cellInfo).getCellSignalStrength();
                                        int rsrp = lteStrength.getRsrp();
                                        int percentage = calculateLteSignalPercentage(rsrp);
                                        Log.d(TAG, "📶 Real LTE Signal: " + percentage + "% (" + rsrp + " dBm)");
                                        return String.valueOf(percentage);
                                    }
                                }
                            }
                        }
                    } catch (SecurityException e) {
                        Log.w(TAG, "Permission denied for cell info access", e);
                    }
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Cannot get real GSM signal strength", e);
        }
        
        Log.w(TAG, "📶 Using fallback GSM value: 75%");
        return "75"; // Fallback when real signal unavailable
    }
    
    // Convert GSM dBm to percentage (typical range: -113 to -51 dBm)
    private int calculateSignalPercentage(int dbm) {
        if (dbm <= -113) return 0;
        if (dbm >= -51) return 100;
        return (int) (((dbm + 113) / 62.0) * 100);
    }
    
    // Convert LTE RSRP to percentage (typical range: -140 to -44 dBm)
    private int calculateLteSignalPercentage(int rsrp) {
        if (rsrp <= -140) return 0;
        if (rsrp >= -44) return 100;
        return (int) (((rsrp + 140) / 96.0) * 100);
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Enhanced GPS Tracking",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("iTrack Enhanced GPS Service");
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
        
        String contentText = activeCourses.size() + " active courses - GPS every 5s";
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("iTrack Enhanced GPS")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build();
    }
    
    private void updateNotification() {
        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.notify(NOTIFICATION_ID, createNotification());
    }
    
    @Override
    public void onDestroy() {
        Log.i(TAG, "🛑 Enhanced GPS Service stopping...");
        
        if (locationManager != null) {
            locationManager.removeUpdates(this);
        }
        
        if (transmissionHandler != null && transmissionRunnable != null) {
            transmissionHandler.removeCallbacks(transmissionRunnable);
        }
        
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        
        activeCourses.clear();
        
        Log.i(TAG, "✅ Enhanced GPS Service stopped cleanly");
        super.onDestroy();
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {}
    
    @Override
    public void onProviderEnabled(String provider) {
        Log.d(TAG, "📡 Provider enabled: " + provider);
    }
    
    @Override
    public void onProviderDisabled(String provider) {
        Log.w(TAG, "📡 Provider disabled: " + provider);
    }
    
    @Override
    public void onLocationChanged(Location location) {
        if (location != null && isBetterLocation(location, lastKnownLocation)) {
            lastKnownLocation = location;
            
            Log.i(TAG, "📍 HIGH-PRECISION GPS: " + 
                  String.format("Lat: %.8f, Lng: %.8f", location.getLatitude(), location.getLongitude()) +
                  " | Accuracy: " + String.format("%.2f", location.getAccuracy()) + "m" +
                  " | Provider: " + location.getProvider() +
                  " | Speed: " + String.format("%.2f", location.getSpeed() * 3.6f) + " km/h");
        }
    }
    
    // Algorithm to determine if new location is more accurate
    private boolean isBetterLocation(Location location, Location currentBestLocation) {
        if (currentBestLocation == null) {
            return true; // Any location is better than no location
        }

        // Check if the new location is significantly newer
        long timeDelta = location.getTime() - currentBestLocation.getTime();
        boolean isSignificantlyNewer = timeDelta > 2 * 60 * 1000; // 2 minutes
        boolean isSignificantlyOlder = timeDelta < -2 * 60 * 1000; // 2 minutes

        if (isSignificantlyNewer) {
            return true;
        } else if (isSignificantlyOlder) {
            return false;
        }

        // Check accuracy - prefer GPS over Network
        float accuracyDelta = location.getAccuracy() - currentBestLocation.getAccuracy();
        boolean isMoreAccurate = accuracyDelta < 0;
        boolean isFromGPS = LocationManager.GPS_PROVIDER.equals(location.getProvider());
        boolean currentFromGPS = LocationManager.GPS_PROVIDER.equals(currentBestLocation.getProvider());

        // Always prefer GPS provider over others
        if (isFromGPS && !currentFromGPS) {
            return true;
        } else if (!isFromGPS && currentFromGPS) {
            return false;
        }

        // If both from same type, prefer more accurate
        return isMoreAccurate || (timeDelta > 0 && accuracyDelta < 50); // Accept if newer and not much worse
    }
}