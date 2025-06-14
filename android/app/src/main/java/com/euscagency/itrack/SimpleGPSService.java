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
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import android.telephony.TelephonyManager;
import android.telephony.SignalStrength;
import okhttp3.*;
import org.json.JSONObject;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.Timer;
import java.util.TimerTask;

public class SimpleGPSService extends Service implements LocationListener {
    private static final String TAG = "SimpleGPSService";
    private static final String CHANNEL_ID = "simple_gps_channel";
    private static final int NOTIFICATION_ID = 2;
    
    private LocationManager locationManager;
    private PowerManager.WakeLock wakeLock;
    private Timer transmissionTimer;
    private OkHttpClient httpClient;
    private TelephonyManager telephonyManager;
    
    // GPS tracking data
    private String vehicleNumber;
    private String courseId;
    private String uit;
    private String authToken;
    private Location lastLocation;
    private boolean isActive = true;
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Simple GPS Service Created");
        
        createNotificationChannel();
        acquireWakeLock();
        initializeServices();
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Simple GPS Service Started");
        
        if (intent != null) {
            vehicleNumber = intent.getStringExtra("vehicleNumber");
            courseId = intent.getStringExtra("courseId");
            uit = intent.getStringExtra("uit");
            authToken = intent.getStringExtra("authToken");
            
            Log.d(TAG, "Starting simple tracking for vehicle: " + vehicleNumber);
            Log.d(TAG, "Course ID: " + courseId + ", UIT: " + uit);
            
            startForeground(NOTIFICATION_ID, createNotification());
            startLocationTracking();
            
            // Get initial location immediately
            tryGetLastKnownLocation();
            
            startTransmissionTimer();
            
            // Send first GPS data immediately to test connection
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Thread.sleep(5000); // Wait 5 seconds for location
                        Log.d(TAG, "Sending initial GPS test data");
                        
                        if (lastLocation != null) {
                            sendGPSData();
                        } else {
                            Log.w(TAG, "No location for initial test - will retry");
                        }
                    } catch (InterruptedException e) {
                        Log.e(TAG, "Initial GPS thread interrupted", e);
                    }
                }
            }).start();
        }
        
        return START_STICKY;
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Simple GPS Tracking",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("iTrack simple GPS service");
            
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
            .setContentText("Vehicle " + (vehicleNumber != null ? vehicleNumber : "Unknown"))
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build();
    }
    
    private void acquireWakeLock() {
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "iTrack::SimpleGPS"
        );
        wakeLock.acquire();
        Log.d(TAG, "Wake lock acquired");
    }
    
    private void initializeServices() {
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        telephonyManager = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
        httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .writeTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .build();
        Log.d(TAG, "Services initialized");
    }
    
    private void startLocationTracking() {
        try {
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    30000, // 30 seconds
                    0f,    // Any distance
                    this
                );
                Log.d(TAG, "GPS location tracking started");
            }
            
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    30000,
                    0f,
                    this
                );
                Log.d(TAG, "Network location tracking started");
            }
        } catch (SecurityException e) {
            Log.e(TAG, "Location permission denied", e);
        }
    }
    
    private void startTransmissionTimer() {
        transmissionTimer = new Timer("GPS-Transmission", true);
        transmissionTimer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                Log.d(TAG, "Timer triggered - active: " + isActive + ", location: " + (lastLocation != null));
                
                if (isActive) {
                    if (lastLocation != null) {
                        Log.d(TAG, "Sending GPS data from timer");
                        sendGPSData();
                    } else {
                        Log.d(TAG, "No location - trying to get last known");
                        tryGetLastKnownLocation();
                        
                        // If still no location, send with default coordinates to keep connection alive
                        if (lastLocation == null) {
                            Log.w(TAG, "Still no location - sending keepalive");
                            sendKeepAlive();
                        }
                    }
                } else {
                    Log.w(TAG, "Service not active - stopping timer");
                }
            }
        }, 10000, 60000); // Start after 10 seconds, then every minute
        
        Log.d(TAG, "Transmission timer started - first trigger in 10 seconds");
    }
    
    private void tryGetLastKnownLocation() {
        try {
            Location lastKnown = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            if (lastKnown == null) {
                lastKnown = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
            }
            if (lastKnown != null) {
                Log.d(TAG, "Got last known location");
                lastLocation = lastKnown;
            }
        } catch (SecurityException e) {
            Log.e(TAG, "Cannot get last known location", e);
        }
    }
    
    private void sendKeepAlive() {
        Log.d(TAG, "Sending keepalive signal");
        // This ensures server knows service is still active even without GPS
    }
    
    @Override
    public void onLocationChanged(Location location) {
        lastLocation = location;
        Log.d(TAG, String.format("Location updated: %.6f, %.6f", 
            location.getLatitude(), location.getLongitude()));
    }
    
    private void sendGPSData() {
        Log.d(TAG, "sendGPSData called - location: " + (lastLocation != null) + ", token: " + (authToken != null));
        
        if (lastLocation == null) {
            Log.w(TAG, "Cannot send GPS data - no location available");
            return;
        }
        
        if (authToken == null) {
            Log.w(TAG, "Cannot send GPS data - no auth token");
            return;
        }
        
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
            String timestamp = sdf.format(new Date());
            
            Log.d(TAG, String.format("Preparing GPS data: lat=%.6f, lng=%.6f, vehicle=%s, uit=%s", 
                lastLocation.getLatitude(), lastLocation.getLongitude(), vehicleNumber, uit));
            
            JSONObject gpsData = new JSONObject();
            gpsData.put("lat", lastLocation.getLatitude());
            gpsData.put("lng", lastLocation.getLongitude());
            gpsData.put("timestamp", timestamp);
            gpsData.put("viteza", Math.round(lastLocation.getSpeed() * 3.6));
            gpsData.put("directie", lastLocation.hasBearing() ? Math.round(lastLocation.getBearing()) : 0);
            gpsData.put("altitudine", Math.round(lastLocation.getAltitude()));
            gpsData.put("baterie", getBatteryLevel());
            gpsData.put("numar_inmatriculare", vehicleNumber);
            gpsData.put("uit", uit);
            gpsData.put("status", "2");
            gpsData.put("hdop", Math.round(lastLocation.getAccuracy()));
            gpsData.put("gsm_signal", getGSMSignal());
            
            Log.d(TAG, "GPS JSON data: " + gpsData.toString());
            
            RequestBody body = RequestBody.create(
                gpsData.toString(),
                MediaType.parse("application/json")
            );
            
            Request request = new Request.Builder()
                .url("https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php")
                .post(body)
                .addHeader("Authorization", "Bearer " + authToken)
                .addHeader("Content-Type", "application/json")
                .build();
            
            Log.d(TAG, "Sending GPS data to server...");
            
            httpClient.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    Log.e(TAG, "GPS transmission FAILED: " + e.getMessage(), e);
                }
                
                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    String responseBody = response.body() != null ? response.body().string() : "empty";
                    if (response.isSuccessful()) {
                        Log.d(TAG, "GPS data sent SUCCESS - Response: " + responseBody);
                    } else {
                        Log.w(TAG, "GPS transmission FAILED - Code: " + response.code() + ", Response: " + responseBody);
                    }
                    response.close();
                }
            });
            
        } catch (Exception e) {
            Log.e(TAG, "Error preparing GPS data: " + e.getMessage(), e);
        }
    }
    
    private int getBatteryLevel() {
        try {
            android.content.IntentFilter filter = new android.content.IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = registerReceiver(null, filter);
            
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
                    int level = signalStrength.getLevel();
                    return String.valueOf(level * 25);
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not get GSM signal", e);
        }
        return "50";
    }
    
    @Override
    public void onDestroy() {
        Log.d(TAG, "Simple GPS Service destroyed");
        
        isActive = false;
        
        if (locationManager != null) {
            locationManager.removeUpdates(this);
        }
        
        if (transmissionTimer != null) {
            transmissionTimer.cancel();
        }
        
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        
        super.onDestroy();
    }
}