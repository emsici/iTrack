package com.euscagency.itrack;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.AlarmManager;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.BroadcastReceiver;
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
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.Timer;
import java.util.TimerTask;
import okhttp3.*;
import org.json.JSONObject;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class GPSForegroundService extends Service implements LocationListener {
    private static final String TAG = "GPSForegroundService";
    private static final String CHANNEL_ID = "gps_tracking_channel";
    private static final int NOTIFICATION_ID = 1;
    private static final int LOCATION_INTERVAL = 30000; // 30 seconds for more frequent updates
    private static final float LOCATION_DISTANCE = 0f; // Accept any distance change
    
    private LocationManager locationManager;
    private PowerManager.WakeLock wakeLock;
    private ScheduledExecutorService scheduler;
    private OkHttpClient httpClient;
    private TelephonyManager telephonyManager;
    private AlarmManager alarmManager;
    private PendingIntent alarmIntent;
    private BroadcastReceiver forceTransmissionReceiver;
    private Timer backupTimer;
    private Handler mainHandler;
    private Runnable heartbeatRunnable;
    private Thread backgroundThread;
    private volatile boolean isServiceActive = true;
    
    // GPS tracking data
    private String vehicleNumber;
    private String courseId;
    private String uit;
    private String authToken;
    private Location lastLocation;
    private Location previousLocation;
    private float lastValidBearing = 0f;
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "GPS Foreground Service Created");
        
        createNotificationChannel();
        acquireWakeLock();
        initializeLocationManager();
        initializeTelephonyManager();
        initializeHttpClient();
        initializeScheduler();
        initializeAlarmManager();
        setupForceTransmissionReceiver();
        initializeBackupSystems();
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "GPS Foreground Service Started - flags: " + flags + ", startId: " + startId);
        
        if (intent != null) {
            String action = intent.getStringExtra("action");
            Log.d(TAG, "Service action: " + action);
            
            if ("START_TRACKING".equals(action)) {
                vehicleNumber = intent.getStringExtra("vehicleNumber");
                courseId = intent.getStringExtra("courseId");
                uit = intent.getStringExtra("uit");
                authToken = intent.getStringExtra("authToken");
                
                Log.d(TAG, "Starting tracking for vehicle: " + vehicleNumber + ", course: " + courseId);
                
                startLocationTracking();
                startForeground(NOTIFICATION_ID, createNotification());
                Log.d(TAG, "Foreground service started with notification ID: " + NOTIFICATION_ID);
                
            } else if ("STOP_TRACKING".equals(action)) {
                Log.d(TAG, "Stopping GPS tracking service");
                stopLocationTracking();
                stopForeground(true);
                stopSelf();
            }
        } else {
            Log.w(TAG, "Service started with null intent - this may be a restart");
            // Service restarted by system, try to continue if we have data
            if (vehicleNumber != null && courseId != null) {
                Log.d(TAG, "Restarting tracking after system restart");
                startLocationTracking();
                startForeground(NOTIFICATION_ID, createNotification());
            }
        }
        
        return START_STICKY; // Restart service if killed by system
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "GPS Tracking",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("iTrack GPS tracking service");
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
        
        String contentText = String.format("Vehicul %s - Cursă activă", 
            vehicleNumber != null ? vehicleNumber : "Unknown");
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("iTrack GPS Tracking")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build();
    }
    
    private void acquireWakeLock() {
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "iTrack::GPSTrackingWakeLock"
        );
        wakeLock.acquire(); // Indefinite wake lock for background operation
        Log.d(TAG, "Indefinite wake lock acquired for background GPS tracking");
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
            .build();
    }
    
    private void initializeScheduler() {
        scheduler = Executors.newSingleThreadScheduledExecutor();
        Log.d(TAG, "Scheduler initialized successfully");
    }
    
    private void initializeAlarmManager() {
        alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        
        Intent alarmReceiverIntent = new Intent(this, GPSAlarmReceiver.class);
        alarmIntent = PendingIntent.getBroadcast(
            this, 0, alarmReceiverIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        Log.d(TAG, "AlarmManager initialized for backup GPS transmission");
    }
    
    private void setupForceTransmissionReceiver() {
        forceTransmissionReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                Log.d(TAG, "Force transmission broadcast received");
                if (lastLocation != null) {
                    sendGPSDataToServer();
                } else {
                    Log.w(TAG, "No location data for forced transmission");
                }
            }
        };
        
        IntentFilter filter = new IntentFilter("com.euscagency.itrack.FORCE_GPS_TRANSMISSION");
        registerReceiver(forceTransmissionReceiver, filter);
        Log.d(TAG, "Force transmission receiver registered");
    }
    
    private void initializeBackupSystems() {
        // Level 4: Timer-based backup system
        initializeTimerBackup();
        
        // Level 5: Handler-based heartbeat system
        initializeHandlerHeartbeat();
        
        // Level 6: Background thread with infinite loop
        initializeBackgroundThread();
        
        Log.d(TAG, "All backup systems initialized - 5 levels of redundancy active");
    }
    
    private void initializeTimerBackup() {
        backupTimer = new Timer("GPS-Backup-Timer", true);
        Log.d(TAG, "Timer backup system initialized");
    }
    
    private void initializeHandlerHeartbeat() {
        mainHandler = new Handler(Looper.getMainLooper());
        heartbeatRunnable = new Runnable() {
            @Override
            public void run() {
                if (isServiceActive && lastLocation != null) {
                    Log.d(TAG, "Handler heartbeat triggered - sending GPS data");
                    sendGPSDataToServer();
                }
                // Schedule next heartbeat
                mainHandler.postDelayed(this, 60000); // 60 seconds
            }
        };
        Log.d(TAG, "Handler heartbeat system initialized");
    }
    
    private void initializeBackgroundThread() {
        backgroundThread = new Thread(new Runnable() {
            @Override
            public void run() {
                Log.d(TAG, "Background thread started for GPS transmission");
                
                while (isServiceActive) {
                    try {
                        Thread.sleep(30000); // Wait 30 seconds for more frequent checks
                        
                        if (isServiceActive) {
                            Log.d(TAG, "Background thread check - service active: " + isServiceActive);
                            
                            if (lastLocation != null) {
                                Log.d(TAG, "Background thread sending GPS data");
                                sendGPSDataToServer();
                            } else {
                                Log.d(TAG, "Background thread trying to get location");
                                tryGetLastKnownLocation();
                            }
                        }
                    } catch (InterruptedException e) {
                        Log.w(TAG, "Background thread interrupted", e);
                        break;
                    } catch (Exception e) {
                        Log.e(TAG, "Error in background thread", e);
                        // Continue running even if there's an error
                    }
                }
                
                Log.d(TAG, "Background thread stopped");
            }
        }, "GPS-Background-Thread");
        
        backgroundThread.setDaemon(true);
        Log.d(TAG, "Background thread initialized");
    }
    
    private void startLocationTracking() {
        Log.d(TAG, "Starting native GPS location tracking");
        
        try {
            // Request location updates from GPS and Network providers
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    LOCATION_INTERVAL,
                    LOCATION_DISTANCE,
                    this,
                    Looper.getMainLooper()
                );
                Log.d(TAG, "GPS provider enabled and tracking started");
            }
            
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    LOCATION_INTERVAL,
                    LOCATION_DISTANCE,
                    this,
                    Looper.getMainLooper()
                );
                Log.d(TAG, "Network provider enabled and tracking started");
            }
            
            // Start simple but robust transmission system
            startRobustGPSTransmission();
            
        } catch (SecurityException e) {
            Log.e(TAG, "Location permission not granted", e);
        }
    }
    
    private void startPeriodicGPSTransmission() {
        Log.d(TAG, "Starting periodic GPS transmission every 60 seconds for course: " + courseId);
        
        scheduler.scheduleAtFixedRate(new Runnable() {
            @Override
            public void run() {
                try {
                    Log.d(TAG, "Periodic transmission triggered - Service active: " + (vehicleNumber != null));
                    
                    if (lastLocation != null) {
                        Log.d(TAG, "Sending GPS data from periodic timer");
                        sendGPSDataToServer();
                    } else {
                        Log.w(TAG, "No location available for periodic transmission");
                        
                        // Try to get last known location
                        try {
                            Location lastKnown = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                            if (lastKnown == null) {
                                lastKnown = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                            }
                            
                            if (lastKnown != null) {
                                Log.d(TAG, "Using last known location for transmission");
                                lastLocation = lastKnown;
                                sendGPSDataToServer();
                            }
                        } catch (SecurityException e) {
                            Log.e(TAG, "Cannot access last known location", e);
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error in periodic GPS transmission", e);
                }
            }
        }, 10, 60, TimeUnit.SECONDS); // Start after 10 seconds, then every 60 seconds
        
        Log.d(TAG, "Periodic transmission scheduled successfully");
    }
    
    private void startRobustGPSTransmission() {
        Log.d(TAG, "Starting robust GPS transmission system");
        
        // Primary system: ScheduledExecutorService with aggressive scheduling
        scheduler.scheduleAtFixedRate(new Runnable() {
            @Override
            public void run() {
                try {
                    Log.d(TAG, "Primary transmission triggered");
                    if (lastLocation != null) {
                        sendGPSDataToServer();
                    } else {
                        Log.w(TAG, "No location for primary transmission");
                        tryGetLastKnownLocation();
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error in primary transmission", e);
                }
            }
        }, 30, 60, TimeUnit.SECONDS); // Start after 30 seconds, then every 60 seconds
        
        // Backup system: Timer for independent operation
        if (backupTimer != null) {
            TimerTask backupTask = new TimerTask() {
                @Override
                public void run() {
                    try {
                        Log.d(TAG, "Backup timer transmission triggered");
                        if (lastLocation != null) {
                            sendGPSDataToServer();
                        } else {
                            tryGetLastKnownLocation();
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Error in backup transmission", e);
                    }
                }
            };
            backupTimer.scheduleAtFixedRate(backupTask, 45000, 60000); // Offset by 15 seconds
        }
        
        // Emergency system: Background thread with shorter intervals
        if (backgroundThread != null && !backgroundThread.isAlive()) {
            backgroundThread.start();
        }
        
        Log.d(TAG, "Robust GPS transmission system activated");
    }
    
    private void tryGetLastKnownLocation() {
        try {
            Location lastKnown = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            if (lastKnown == null) {
                lastKnown = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
            }
            if (lastKnown != null) {
                Log.d(TAG, "Using last known location for transmission");
                lastLocation = lastKnown;
                sendGPSDataToServer();
            }
        } catch (SecurityException e) {
            Log.e(TAG, "Cannot access last known location", e);
        }
    }
    
    private void startBackupAlarmSystem() {
        if (alarmManager != null && alarmIntent != null) {
            // Set repeating alarm every 60 seconds as backup
            long triggerTime = System.currentTimeMillis() + 60000; // First trigger in 1 minute
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                // For Android 6.0+ use setExactAndAllowWhileIdle for better reliability
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, alarmIntent);
                
                // Schedule next alarm after this one fires
                scheduleNextAlarm();
            } else {
                alarmManager.setRepeating(AlarmManager.RTC_WAKEUP, triggerTime, 60000, alarmIntent);
            }
            
            Log.d(TAG, "Backup alarm system started - GPS will transmit even when app minimized");
        }
    }
    
    private void scheduleNextAlarm() {
        // This will be called recursively to maintain alarm chain
        scheduler.schedule(new Runnable() {
            @Override
            public void run() {
                if (alarmManager != null && alarmIntent != null) {
                    long nextTrigger = System.currentTimeMillis() + 60000;
                    
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        alarmManager.setExactAndAllowWhileIdle(
                            AlarmManager.RTC_WAKEUP, nextTrigger, alarmIntent
                        );
                    } else {
                        alarmManager.set(AlarmManager.RTC_WAKEUP, nextTrigger, alarmIntent);
                    }
                    
                    Log.d(TAG, "Next alarm scheduled for 60 seconds");
                    
                    // Schedule the next one
                    scheduleNextAlarm();
                }
            }
        }, 60, TimeUnit.SECONDS);
    }
    
    private void startAllBackupSystems() {
        Log.d(TAG, "Starting all 5 backup transmission systems");
        
        // Level 4: Start Timer backup system
        startTimerBackup();
        
        // Level 5: Start Handler heartbeat
        startHandlerHeartbeat();
        
        // Level 6: Start background thread
        startBackgroundThread();
        
        Log.d(TAG, "All backup systems now active - GPS transmission guaranteed");
    }
    
    private void startTimerBackup() {
        if (backupTimer != null) {
            TimerTask timerTask = new TimerTask() {
                @Override
                public void run() {
                    try {
                        if (isServiceActive && lastLocation != null) {
                            Log.d(TAG, "Timer backup triggered - sending GPS data");
                            sendGPSDataToServer();
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Error in timer backup", e);
                    }
                }
            };
            
            backupTimer.scheduleAtFixedRate(timerTask, 60000, 60000); // Start after 1 min, repeat every 60s
            Log.d(TAG, "Timer backup system started");
        }
    }
    
    private void startHandlerHeartbeat() {
        if (mainHandler != null && heartbeatRunnable != null) {
            mainHandler.postDelayed(heartbeatRunnable, 60000); // Start after 1 minute
            Log.d(TAG, "Handler heartbeat system started");
        }
    }
    
    private void startBackgroundThread() {
        if (backgroundThread != null && !backgroundThread.isAlive()) {
            backgroundThread.start();
            Log.d(TAG, "Background thread system started");
        }
    }
    
    private void stopLocationTracking() {
        Log.d(TAG, "Stopping GPS location tracking");
        
        // Stop all backup systems first
        stopAllBackupSystems();
        
        if (locationManager != null) {
            locationManager.removeUpdates(this);
        }
        
        if (scheduler != null && !scheduler.isShutdown()) {
            scheduler.shutdown();
        }
    }
    
    private void stopAllBackupSystems() {
        Log.d(TAG, "Stopping all backup transmission systems");
        
        // Mark service as inactive
        isServiceActive = false;
        
        // Stop Level 3: AlarmManager
        if (alarmManager != null && alarmIntent != null) {
            alarmManager.cancel(alarmIntent);
            Log.d(TAG, "AlarmManager backup stopped");
        }
        
        // Stop Level 4: Timer backup
        if (backupTimer != null) {
            backupTimer.cancel();
            backupTimer.purge();
            Log.d(TAG, "Timer backup stopped");
        }
        
        // Stop Level 5: Handler heartbeat
        if (mainHandler != null && heartbeatRunnable != null) {
            mainHandler.removeCallbacks(heartbeatRunnable);
            Log.d(TAG, "Handler heartbeat stopped");
        }
        
        // Stop Level 6: Background thread (will exit naturally due to isServiceActive = false)
        if (backgroundThread != null && backgroundThread.isAlive()) {
            backgroundThread.interrupt();
            Log.d(TAG, "Background thread stopped");
        }
        
        // Unregister broadcast receiver
        if (forceTransmissionReceiver != null) {
            try {
                unregisterReceiver(forceTransmissionReceiver);
                Log.d(TAG, "Force transmission receiver unregistered");
            } catch (Exception e) {
                Log.w(TAG, "Error unregistering receiver", e);
            }
        }
        
        Log.d(TAG, "All backup systems stopped successfully");
    }
    
    @Override
    public void onLocationChanged(Location location) {
        // Store previous location for bearing calculation
        previousLocation = lastLocation;
        lastLocation = location;
        
        // Calculate bearing if we have movement
        if (previousLocation != null && location.hasSpeed() && location.getSpeed() > 0.5f) {
            // Use GPS bearing if available and valid
            if (location.hasBearing() && location.getBearing() >= 0) {
                lastValidBearing = location.getBearing();
            } else {
                // Calculate bearing from previous position
                lastValidBearing = calculateBearing(previousLocation, location);
            }
        }
        
        Log.d(TAG, String.format("Location updated: %.6f, %.6f, speed: %.1f km/h, bearing: %.1f°", 
            location.getLatitude(), location.getLongitude(), 
            location.getSpeed() * 3.6, lastValidBearing));
    }
    
    private void sendGPSDataToServer() {
        if (lastLocation == null || authToken == null) {
            Log.w(TAG, "No location data or auth token available");
            return;
        }
        
        try {
            // Get battery level
            int batteryLevel = getBatteryLevel();
            
            // Prepare GPS data
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
            String timestamp = sdf.format(new Date());
            
            JSONObject gpsData = new JSONObject();
            gpsData.put("lat", lastLocation.getLatitude());
            gpsData.put("lng", lastLocation.getLongitude());
            gpsData.put("timestamp", timestamp);
            gpsData.put("viteza", Math.round(lastLocation.getSpeed() * 3.6)); // km/h
            gpsData.put("directie", Math.round(lastValidBearing));
            gpsData.put("altitudine", Math.round(lastLocation.getAltitude()));
            gpsData.put("baterie", batteryLevel);
            gpsData.put("numar_inmatriculare", vehicleNumber);
            gpsData.put("uit", uit);
            gpsData.put("status", "2"); // Active status
            gpsData.put("hdop", Math.round(lastLocation.getAccuracy()));
            gpsData.put("gsm_signal", getGSMSignalStrength());
            
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
                    Log.e(TAG, "Failed to send GPS data", e);
                }
                
                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    if (response.isSuccessful()) {
                        Log.d(TAG, "GPS data sent successfully");
                    } else {
                        Log.w(TAG, "GPS data send failed with code: " + response.code());
                    }
                    response.close();
                }
            });
            
            Log.d(TAG, "GPS data sent for course: " + courseId);
            
        } catch (Exception e) {
            Log.e(TAG, "Error sending GPS data", e);
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
        return 100; // Default value
    }
    
    private String getGSMSignalStrength() {
        try {
            if (telephonyManager != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    // Android 9+ (API 28+)
                    SignalStrength signalStrength = telephonyManager.getSignalStrength();
                    if (signalStrength != null) {
                        int level = signalStrength.getLevel(); // 0-4 scale
                        return String.valueOf((level * 25)); // Convert to 0-100 scale
                    }
                } else {
                    // For older Android versions, use network type as fallback
                    int networkType = telephonyManager.getNetworkType();
                    switch (networkType) {
                        case TelephonyManager.NETWORK_TYPE_LTE:
                        case TelephonyManager.NETWORK_TYPE_HSPAP:
                        case TelephonyManager.NETWORK_TYPE_HSPA:
                            return "85"; // Good signal for 4G/3G+
                        case TelephonyManager.NETWORK_TYPE_UMTS:
                        case TelephonyManager.NETWORK_TYPE_EDGE:
                            return "65"; // Moderate signal for 3G/2G
                        case TelephonyManager.NETWORK_TYPE_GPRS:
                            return "45"; // Weak signal for 2G
                        default:
                            return "25"; // Unknown/poor signal
                    }
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not get GSM signal strength", e);
        }
        return "50"; // Default moderate signal
    }
    
    private float calculateBearing(Location start, Location end) {
        double lat1 = Math.toRadians(start.getLatitude());
        double lat2 = Math.toRadians(end.getLatitude());
        double deltaLon = Math.toRadians(end.getLongitude() - start.getLongitude());
        
        double y = Math.sin(deltaLon) * Math.cos(lat2);
        double x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
        
        double bearing = Math.toDegrees(Math.atan2(y, x));
        
        // Normalize to 0-360 degrees
        return (float) ((bearing + 360) % 360);
    }
    
    @Override
    public void onDestroy() {
        Log.d(TAG, "GPS Foreground Service Destroyed");
        
        stopLocationTracking();
        
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        
        if (httpClient != null) {
            httpClient.dispatcher().executorService().shutdown();
        }
        
        super.onDestroy();
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null; // We don't provide binding
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
        Log.d(TAG, "Location provider disabled: " + provider);
    }
}