package com.itrack.gps;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.euscagency.itrack.MainActivity;

@CapacitorPlugin(name = "GpsTrackingPlugin")
public class GpsTrackingPlugin extends Plugin implements LocationListener {
    
    private static final String TAG = "GpsTrackingPlugin";
    private static final String CHANNEL_ID = "itrack_gps_channel";
    private static final int NOTIFICATION_ID = 1001;
    
    private LocationManager locationManager;
    private PowerManager.WakeLock wakeLock;
    private boolean isTracking = false;
    private long updateInterval = 60000; // 1 minute default
    
    @Override
    public void load() {
        super.load();
        Log.d(TAG, "GPS Tracking Plugin loaded");
        createNotificationChannel();
    }
    
    @PluginMethod
    public void startBackgroundTracking(PluginCall call) {
        Log.d(TAG, "Starting background GPS tracking");
        
        // Check permissions
        if (!hasLocationPermissions()) {
            call.reject("Location permissions not granted");
            return;
        }
        
        try {
            // Get options
            updateInterval = call.getLong("interval", 60000L);
            boolean enableWakeLock = call.getBoolean("enableWakeLock", true);
            String notificationTitle = call.getString("notificationTitle", "iTrack GPS activ");
            String notificationText = call.getString("notificationText", "Urmărire transport în curs...");
            
            // Initialize LocationManager
            locationManager = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
            
            // Start foreground service with notification
            startForegroundService(notificationTitle, notificationText);
            
            // Acquire wake lock if requested
            if (enableWakeLock) {
                PowerManager powerManager = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
                wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "iTrack::GpsWakeLock");
                wakeLock.acquire();
                Log.d(TAG, "Wake lock acquired");
            }
            
            // Request location updates
            if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    updateInterval,
                    0, // minimum distance
                    this
                );
                
                // Also use network provider as backup
                if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    locationManager.requestLocationUpdates(
                        LocationManager.NETWORK_PROVIDER,
                        updateInterval,
                        0,
                        this
                    );
                }
                
                isTracking = true;
                Log.d(TAG, "GPS tracking started successfully");
                call.resolve();
            } else {
                call.reject("Fine location permission not granted");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error starting GPS tracking", e);
            call.reject("Failed to start GPS tracking: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void stopBackgroundTracking(PluginCall call) {
        Log.d(TAG, "Stopping background GPS tracking");
        
        try {
            // Stop location updates
            if (locationManager != null) {
                locationManager.removeUpdates(this);
                locationManager = null;
            }
            
            // Release wake lock
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
                wakeLock = null;
                Log.d(TAG, "Wake lock released");
            }
            
            // Stop foreground service
            stopForegroundService();
            
            isTracking = false;
            Log.d(TAG, "GPS tracking stopped successfully");
            call.resolve();
            
        } catch (Exception e) {
            Log.e(TAG, "Error stopping GPS tracking", e);
            call.reject("Failed to stop GPS tracking: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void getCurrentLocation(PluginCall call) {
        if (!hasLocationPermissions()) {
            call.reject("Location permissions not granted");
            return;
        }
        
        try {
            LocationManager lm = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
            Location location = null;
            
            if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                // Try GPS first
                if (lm.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                    location = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                }
                
                // Fallback to network
                if (location == null && lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    location = lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                }
            }
            
            if (location != null) {
                JSObject result = new JSObject();
                result.put("latitude", location.getLatitude());
                result.put("longitude", location.getLongitude());
                call.resolve(result);
            } else {
                call.reject("Unable to get current location");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error getting current location", e);
            call.reject("Failed to get location: " + e.getMessage());
        }
    }
    
    // LocationListener implementation
    @Override
    public void onLocationChanged(Location location) {
        Log.d(TAG, "Location updated: " + location.getLatitude() + ", " + location.getLongitude());
        
        // Send location data to JavaScript
        JSObject locationData = new JSObject();
        locationData.put("latitude", location.getLatitude());
        locationData.put("longitude", location.getLongitude());
        locationData.put("accuracy", location.getAccuracy());
        locationData.put("timestamp", location.getTime());
        
        notifyListeners("locationUpdate", locationData);
    }
    
    @Override
    public void onProviderEnabled(String provider) {
        Log.d(TAG, "Provider enabled: " + provider);
    }
    
    @Override
    public void onProviderDisabled(String provider) {
        Log.d(TAG, "Provider disabled: " + provider);
    }
    
    private boolean hasLocationPermissions() {
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED &&
               ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "iTrack GPS Service";
            String description = "Serviciu GPS pentru urmărirea transporturilor";
            int importance = NotificationManager.IMPORTANCE_LOW;
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);
            
            NotificationManager notificationManager = getContext().getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
            Log.d(TAG, "Notification channel created");
        }
    }
    
    private void startForegroundService(String title, String text) {
        Intent notificationIntent = new Intent(getContext(), MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            getContext(), 
            0, 
            notificationIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        Notification notification = new NotificationCompat.Builder(getContext(), CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
        
        NotificationManager notificationManager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        notificationManager.notify(NOTIFICATION_ID, notification);
        
        Log.d(TAG, "Foreground notification started");
    }
    
    private void stopForegroundService() {
        NotificationManager notificationManager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        notificationManager.cancel(NOTIFICATION_ID);
        Log.d(TAG, "Foreground notification stopped");
    }
}