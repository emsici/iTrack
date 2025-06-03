package com.itrack.gps;

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
import android.os.IBinder;
import android.os.PowerManager;
import android.os.Bundle;
import android.util.Log;
import androidx.core.app.NotificationCompat;

import java.util.Timer;
import java.util.TimerTask;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

import org.json.JSONObject;

public class GpsBackgroundService extends Service implements LocationListener {
    private static final String TAG = "GpsBackgroundService";
    private static final int NOTIFICATION_ID = 1001;
    private static final String CHANNEL_ID = "GPS_TRACKING_CHANNEL";
    
    private LocationManager locationManager;
    private PowerManager.WakeLock wakeLock;
    private Timer gpsTransmissionTimer;
    
    private String vehicleNumber;
    private String uit;
    private String authToken;
    private Location lastKnownLocation;
    
    private static final String GPS_API_URL = "https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php";
    private OkHttpClient httpClient;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Serviciul GPS background nativ creat");
        
        httpClient = new OkHttpClient();
        createNotificationChannel();
        acquireWakeLock();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Serviciul GPS background nativ pornit");
        
        if (intent != null) {
            vehicleNumber = intent.getStringExtra("vehicleNumber");
            uit = intent.getStringExtra("uit");
            authToken = intent.getStringExtra("authToken");
            
            Log.d(TAG, "Date primite: vehicle=" + vehicleNumber + ", uit=" + uit);
        }
        
        startForeground(NOTIFICATION_ID, createNotification());
        startLocationTracking();
        startGpsTransmissionTimer();
        
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "Serviciul GPS background nativ oprit");
        
        stopLocationTracking();
        stopGpsTransmissionTimer();
        releaseWakeLock();
        
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "GPS Tracking iTrack",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Serviciu GPS pentru tracking transport activ");
            channel.setShowBadge(false);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, com.getcapacitor.MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("iTrack - Transport activ")
            .setContentText("GPS tracking pentru UIT: " + (uit != null ? uit : "N/A"))
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build();
    }

    private void acquireWakeLock() {
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "iTrack:GpsWakeLock"
        );
        wakeLock.acquire(60 * 60 * 1000L); // 1 oră maximum
        Log.d(TAG, "WakeLock achiziționat pentru menținerea activă");
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            Log.d(TAG, "WakeLock eliberat");
        }
    }

    private void startLocationTracking() {
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        
        try {
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    10000, // 10 secunde
                    0,     // orice distanță
                    this
                );
                Log.d(TAG, "GPS tracking nativ pornit");
            }
            
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    15000, // 15 secunde
                    0,
                    this
                );
                Log.d(TAG, "Network location tracking pornit");
            }
            
        } catch (SecurityException e) {
            Log.e(TAG, "Permisiuni GPS lipsă", e);
        }
    }

    private void stopLocationTracking() {
        if (locationManager != null) {
            locationManager.removeUpdates(this);
            Log.d(TAG, "Location tracking oprit");
        }
    }

    private void startGpsTransmissionTimer() {
        gpsTransmissionTimer = new Timer("GpsTransmissionTimer");
        gpsTransmissionTimer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                transmitGpsData();
            }
        }, 5000, 60000); // Prima după 5 secunde, apoi la 60 secunde
        
        Log.d(TAG, "Timer GPS nativ pornit - transmisie la 60 secunde");
    }

    private void stopGpsTransmissionTimer() {
        if (gpsTransmissionTimer != null) {
            gpsTransmissionTimer.cancel();
            gpsTransmissionTimer = null;
            Log.d(TAG, "Timer GPS nativ oprit");
        }
    }

    private void transmitGpsData() {
        if (lastKnownLocation == null) {
            Log.w(TAG, "Nu avem coordonate GPS pentru transmisie");
            return;
        }
        
        if (vehicleNumber == null || uit == null || authToken == null) {
            Log.e(TAG, "Date lipsă pentru transmisie GPS");
            return;
        }

        try {
            JSONObject payload = new JSONObject();
            payload.put("lat", lastKnownLocation.getLatitude());
            payload.put("lng", lastKnownLocation.getLongitude());
            
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
            payload.put("timestamp", sdf.format(new Date()));
            
            float speedKmh = 0;
            if (lastKnownLocation.hasSpeed()) {
                speedKmh = lastKnownLocation.getSpeed() * 3.6f;
            }
            payload.put("viteza", Math.round(speedKmh));
            
            float bearing = 0;
            if (lastKnownLocation.hasBearing()) {
                bearing = lastKnownLocation.getBearing();
            }
            payload.put("directie", Math.round(bearing));
            
            payload.put("altitudine", Math.round(lastKnownLocation.getAltitude()));
            payload.put("baterie", getBatteryLevel());
            payload.put("numar_inmatriculare", vehicleNumber);
            payload.put("uit", uit);
            payload.put("status", 2); // transport activ
            
            float accuracy = lastKnownLocation.getAccuracy();
            int hdop = Math.min(Math.round(accuracy / 5), 10);
            payload.put("hdop", hdop);
            payload.put("gsm_signal", 85);

            Log.d(TAG, "Transmit GPS nativ: lat=" + lastKnownLocation.getLatitude() + 
                      ", lng=" + lastKnownLocation.getLongitude() + 
                      ", speed=" + speedKmh + " km/h");

            transmitToServer(payload.toString());
            
        } catch (Exception e) {
            Log.e(TAG, "Eroare la transmisia GPS nativă", e);
        }
    }

    private void transmitToServer(String jsonPayload) {
        new Thread(() -> {
            try {
                MediaType JSON = MediaType.get("application/json; charset=utf-8");
                RequestBody body = RequestBody.create(jsonPayload, JSON);
                
                Request request = new Request.Builder()
                    .url(GPS_API_URL)
                    .post(body)
                    .addHeader("Content-Type", "application/json")
                    .addHeader("Authorization", "Bearer " + authToken)
                    .build();

                Response response = httpClient.newCall(request).execute();
                
                if (response.isSuccessful()) {
                    Log.d(TAG, "✅ GPS nativ transmis cu succes: " + response.code());
                } else {
                    Log.e(TAG, "❌ Eroare transmisie GPS nativ: " + response.code());
                }
                
                response.close();
                
            } catch (Exception e) {
                Log.e(TAG, "Eroare HTTP transmisie GPS nativ", e);
            }
        }).start();
    }

    private int getBatteryLevel() {
        try {
            android.content.IntentFilter ifilter = new android.content.IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = registerReceiver(null, ifilter);
            
            int level = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_LEVEL, -1);
            int scale = batteryStatus.getIntExtra(android.os.BatteryManager.EXTRA_SCALE, -1);
            
            return Math.round((level / (float) scale) * 100);
        } catch (Exception e) {
            Log.w(TAG, "Nu s-a putut citi bateria", e);
            return 100;
        }
    }

    @Override
    public void onLocationChanged(Location location) {
        lastKnownLocation = location;
        Log.d(TAG, "Locație GPS nouă: " + location.getLatitude() + ", " + location.getLongitude());
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {
        Log.d(TAG, "Status GPS schimbat: " + provider + " -> " + status);
    }

    @Override
    public void onProviderEnabled(String provider) {
        Log.d(TAG, "GPS provider activat: " + provider);
    }

    @Override
    public void onProviderDisabled(String provider) {
        Log.w(TAG, "GPS provider dezactivat: " + provider);
    }
}