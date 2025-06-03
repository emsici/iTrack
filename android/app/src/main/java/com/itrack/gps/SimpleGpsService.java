package com.itrack.gps;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.IBinder;
import android.os.Bundle;
import android.util.Log;
import androidx.core.app.NotificationCompat;

import java.util.Timer;
import java.util.TimerTask;

public class SimpleGpsService extends Service implements LocationListener {
    private static final String TAG = "SimpleGpsService";
    private static final int NOTIFICATION_ID = 1001;
    private static final String CHANNEL_ID = "GPS_CHANNEL";
    
    private LocationManager locationManager;
    private Timer gpsTimer;
    private Location lastLocation;
    private String vehicleNumber;
    private String uit;
    private String authToken;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Serviciu GPS simplu creat");
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            vehicleNumber = intent.getStringExtra("vehicleNumber");
            uit = intent.getStringExtra("uit");
            authToken = intent.getStringExtra("authToken");
        }
        
        startForeground(NOTIFICATION_ID, createNotification());
        startLocationTracking();
        startGpsTimer();
        
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        stopLocationTracking();
        stopGpsTimer();
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
                "GPS Tracking",
                NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    private Notification createNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("iTrack GPS Activ")
            .setContentText("Tracking pentru UIT: " + (uit != null ? uit : "N/A"))
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }

    private void startLocationTracking() {
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        try {
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER, 10000, 0, this);
            }
        } catch (SecurityException e) {
            Log.e(TAG, "Permisiuni GPS lipsă", e);
        }
    }

    private void stopLocationTracking() {
        if (locationManager != null) {
            locationManager.removeUpdates(this);
        }
    }

    private void startGpsTimer() {
        gpsTimer = new Timer();
        gpsTimer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                transmitGps();
            }
        }, 5000, 60000);
    }

    private void stopGpsTimer() {
        if (gpsTimer != null) {
            gpsTimer.cancel();
        }
    }

    private void transmitGps() {
        if (lastLocation != null && vehicleNumber != null && uit != null) {
            Log.d(TAG, "Transmit GPS: " + lastLocation.getLatitude() + 
                      ", " + lastLocation.getLongitude());
            // Aici ar fi transmisia reală către API
        }
    }

    @Override
    public void onLocationChanged(Location location) {
        lastLocation = location;
        Log.d(TAG, "Locație nouă: " + location.getLatitude() + ", " + location.getLongitude());
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {}

    @Override
    public void onProviderEnabled(String provider) {}

    @Override
    public void onProviderDisabled(String provider) {}
}