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
import java.util.Set;
import java.util.HashSet;
import java.util.ArrayList;
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
    private Set<String> singleTransmissionSent = new HashSet<>(); // Track single transmissions sent
    
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
            int oldStatus = course.status;
            course.status = newStatus;
            Log.i(TAG, "🔄 Course status updated: " + courseId + " → Status: " + oldStatus + " → " + newStatus);
            
            // Clear single transmission tracking for this status change
            String oldStatusKey = course.uit + "_" + oldStatus;
            String newStatusKey = course.uit + "_" + newStatus;
            singleTransmissionSent.remove(oldStatusKey);
            singleTransmissionSent.remove(newStatusKey);
            
            // Send immediate GPS update for status change
            if (lastKnownLocation != null) {
                sendGPSDataForCourse(course, lastKnownLocation);
                Log.i(TAG, "📤 Immediate status change transmission sent: UIT " + course.uit + " | Status: " + newStatus);
                
                // Mark as sent for single transmission tracking
                if (newStatus == 3 || newStatus == 4) {
                    singleTransmissionSent.add(newStatusKey);
                }
                
                // Remove course if stopped
                if (newStatus == 4) {
                    activeCourses.remove(courseId);
                    Log.i(TAG, "🛑 Course removed after stop: " + course.uit);
                }
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
            // GPS provider optimized for 5-second transmission intervals
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    3000, // 3 seconds - slightly faster than transmission for fresh data
                    MIN_DISTANCE, // 0.5m distance filter to reduce unnecessary updates
                    this,
                    Looper.getMainLooper()
                );
                Log.d(TAG, "📡 GPS provider tracking started (3s interval, 0.5m distance filter)");
            }
            
            // Network provider as backup with reduced frequency
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    5000, // 5 seconds for network backup
                    MIN_DISTANCE, // 0.5m distance filter
                    this,
                    Looper.getMainLooper()
                );
                Log.d(TAG, "📶 Network provider backup started (5s interval)");
            }
            
            // Passive provider as emergency backup (uses other apps' location requests)
            if (locationManager.isProviderEnabled(LocationManager.PASSIVE_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.PASSIVE_PROVIDER,
                    10000, // 10 seconds for passive backup (low frequency)
                    MIN_DISTANCE, // 0.5m distance filter
                    this,
                    Looper.getMainLooper()
                );
                Log.d(TAG, "🔄 Passive provider emergency backup started (10s interval)");
            }
            
            // Try to get last known location immediately
            getLastKnownLocation();
            
        } catch (SecurityException e) {
            Log.e(TAG, "❌ Location permission denied", e);
        }
    }
    
    private void startTransmissionTimer() {
        transmissionHandler.post(transmissionRunnable);
        Log.i(TAG, "⏱️ GPS transmission timer started (5s intervals)");
    }
    
    private void getLastKnownLocation() {
        try {
            Location gpsLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            Location networkLocation = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
            Location passiveLocation = locationManager.getLastKnownLocation(LocationManager.PASSIVE_PROVIDER);
            
            // Priority: GPS > Network > Passive, but prefer recent locations
            Location bestLocation = null;
            
            if (gpsLocation != null && isFreshLocation(gpsLocation)) {
                bestLocation = gpsLocation;
                Log.d(TAG, "📍 Using fresh GPS location");
            } else if (networkLocation != null && isFreshLocation(networkLocation)) {
                bestLocation = networkLocation;
                Log.d(TAG, "📶 Using fresh network location");
            } else if (passiveLocation != null && isFreshLocation(passiveLocation)) {
                bestLocation = passiveLocation;
                Log.d(TAG, "🔄 Using fresh passive location");
            } else {
                // Use any available location if no fresh ones
                bestLocation = gpsLocation != null ? gpsLocation : 
                              networkLocation != null ? networkLocation : passiveLocation;
                if (bestLocation != null) {
                    Log.w(TAG, "⚠️ Using older location (no fresh location available)");
                }
            }
            
            if (bestLocation != null) {
                lastKnownLocation = bestLocation;
                long ageMinutes = (System.currentTimeMillis() - bestLocation.getTime()) / (1000 * 60);
                Log.i(TAG, "📍 Location acquired: " + 
                      String.format("%.6f, %.6f", bestLocation.getLatitude(), bestLocation.getLongitude()) +
                      " | Age: " + ageMinutes + " minutes" +
                      " | Provider: " + bestLocation.getProvider());
            } else {
                Log.e(TAG, "❌ No location available from any provider");
            }
        } catch (SecurityException e) {
            Log.e(TAG, "❌ Cannot access last known location", e);
        }
    }
    
    private boolean isFreshLocation(Location location) {
        if (location == null) return false;
        long locationAge = System.currentTimeMillis() - location.getTime();
        return locationAge < 5 * 60 * 1000; // 5 minutes
    }
    

    
    private void transmitGPSDataForAllCourses() {
        if (lastKnownLocation == null) {
            Log.w(TAG, "⚠️ No location available - attempting to get fresh location");
            getLastKnownLocation();
            
            // Wait briefly and try again
            try {
                Thread.sleep(2000);
                getLastKnownLocation();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            
            if (lastKnownLocation == null) {
                Log.e(TAG, "❌ Still no location available - skipping transmission cycle");
                return;
            }
        }
        
        if (activeCourses.isEmpty()) {
            Log.w(TAG, "⚠️ No active courses for GPS transmission");
            return;
        }
        
        transmissionCounter++;
        long uptime = System.currentTimeMillis() - serviceStartTime;
        
        Log.i(TAG, "📡 GPS Transmission #" + transmissionCounter + 
              " | Uptime: " + (uptime/1000) + "s | Active courses: " + activeCourses.size() +
              " | Interval: " + (TRANSMISSION_INTERVAL/1000) + "s");
        
        // Collect courses to remove after iteration
        List<String> coursesToRemove = new ArrayList<>();
        
        for (CourseData course : activeCourses.values()) {
            String courseKey = course.uit + "_" + course.status;
            
            // Only send GPS continuously for status 2 (active)
            if (course.status == 2) {
                sendGPSDataForCourse(course, lastKnownLocation);
                Log.d(TAG, "🟢 Status 2 - Continuous GPS for UIT: " + course.uit);
                // Remove from single transmission tracking when status 2 is active
                singleTransmissionSent.remove(course.uit + "_3");
                singleTransmissionSent.remove(course.uit + "_4");
            } else if ((course.status == 3 || course.status == 4) && 
                      !singleTransmissionSent.contains(courseKey)) {
                // Send single transmission for pause (3) or stop (4) status
                sendGPSDataForCourse(course, lastKnownLocation);
                singleTransmissionSent.add(courseKey);
                Log.i(TAG, "📤 Single transmission sent for UIT: " + course.uit + " | Status: " + course.status);
                
                // Mark course for removal if status is 4 (stopped) - delay removal to ensure transmission
                if (course.status == 4) {
                    // Delay removal by 3 seconds to ensure GPS transmission completes
                    transmissionHandler.postDelayed(() -> {
                        CourseData courseToRemove = activeCourses.remove(course.courseId);
                        if (courseToRemove != null) {
                            Log.i(TAG, "🛑 Course removed after status 4 transmission: " + courseToRemove.uit);
                        }
                    }, 3000);
                }
            } else {
                Log.d(TAG, "⏸️ Status " + course.status + " - No GPS transmission for UIT: " + course.uit);
            }
        }
        
        // coursesToRemove list is no longer used - removal is handled with delayed timing
    }
    
    private void sendGPSDataForCourse(CourseData course, Location location) {
        try {
            // Prepare GPS data
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
            String timestamp = sdf.format(new Date());
            
            float speed = location.hasSpeed() ? location.getSpeed() * 3.6f : 0.0f; // km/h
            float bearing = location.hasBearing() ? location.getBearing() : 0.0f;
            // Use real altitude from GPS without modification
            double rawAltitude = location.hasAltitude() ? location.getAltitude() : 0.0;
            double altitude = rawAltitude; // Keep original GPS altitude value
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
            
            String statusText = course.status == 2 ? "ACTIVE" : course.status == 3 ? "PAUSED" : course.status == 4 ? "FINISHED" : "UNKNOWN";
            Log.d(TAG, "🚗 Sending HIGH-PRECISION GPS for Vehicle: " + course.vehicleNumber + 
                       " | UIT: " + course.uit + 
                       " | Status: " + course.status + " (" + statusText + ")" +
                       " | Coordinates: " + String.format("%.8f, %.8f", lat, lng) +
                       " | Altitude: " + String.format("%.1f", rawAltitude) + "m" +
                       " | Speed: " + Math.round(speed) + "km/h" +
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
                                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                            // API 26+ method
                                            int rsrp = lteStrength.getRsrp();
                                            int percentage = calculateLteSignalPercentage(rsrp);
                                            Log.d(TAG, "📶 Real LTE Signal: " + percentage + "% (" + rsrp + " dBm)");
                                            return String.valueOf(percentage);
                                        } else {
                                            // Fallback for API < 26
                                            int dbm = lteStrength.getDbm();
                                            int percentage = calculateLteSignalPercentage(dbm);
                                            Log.d(TAG, "📶 LTE Signal (legacy): " + percentage + "% (" + dbm + " dBm)");
                                            return String.valueOf(percentage);
                                        }
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
        if (location != null) {
            // Only update location, DO NOT transmit here - transmission is timer-based only
            lastKnownLocation = location;
            
            String providerIcon = location.getProvider().equals("gps") ? "🛰️" : 
                                 location.getProvider().equals("network") ? "📶" : "🔄";
            Log.d(TAG, providerIcon + " Location updated: " + 
                  String.format("%.6f, %.6f", location.getLatitude(), location.getLongitude()) +
                  " | Provider: " + location.getProvider() +
                  " | Accuracy: " + String.format("%.1f", location.getAccuracy()) + "m" +
                  " | (Cached for 5s timer transmission)");
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