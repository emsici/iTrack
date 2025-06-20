package com.euscagency.itrack;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import androidx.core.content.ContextCompat;

public class GPSBroadcastReceiver extends BroadcastReceiver {
    private static final String TAG = "GPSBroadcastReceiver";
    
    public static final String ACTION_START_GPS = "com.euscagency.itrack.START_GPS";
    public static final String ACTION_STOP_GPS = "com.euscagency.itrack.STOP_GPS";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Log.d(TAG, "Received broadcast: " + action);
        
        if (ACTION_START_GPS.equals(action)) {
            startGPSService(context, intent);
        } else if (ACTION_STOP_GPS.equals(action)) {
            stopGPSService(context, intent);
        }
    }
    
    private void startGPSService(Context context, Intent broadcastIntent) {
        String courseId = broadcastIntent.getStringExtra("courseId");
        String vehicleNumber = broadcastIntent.getStringExtra("vehicleNumber");
        String uit = broadcastIntent.getStringExtra("uit");
        String authToken = broadcastIntent.getStringExtra("authToken");
        int status = broadcastIntent.getIntExtra("status", 2);
        
        Log.d(TAG, "Starting GPS service for course: " + courseId);
        
        Intent serviceIntent = new Intent(context, EnhancedGPSService.class);
        serviceIntent.setAction("START_TRACKING");
        serviceIntent.putExtra("courseId", courseId);
        serviceIntent.putExtra("vehicleNumber", vehicleNumber);
        serviceIntent.putExtra("uit", uit);
        serviceIntent.putExtra("authToken", authToken);
        serviceIntent.putExtra("status", status);
        
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ContextCompat.startForegroundService(context, serviceIntent);
                Log.d(TAG, "Foreground service started for Android 8.0+");
            } else {
                context.startService(serviceIntent);
                Log.d(TAG, "Regular service started for Android 7.1-");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to start GPS service: " + e.getMessage());
        }
    }
    
    private void stopGPSService(Context context, Intent broadcastIntent) {
        String courseId = broadcastIntent.getStringExtra("courseId");
        
        Log.d(TAG, "Stopping GPS service for course: " + courseId);
        
        Intent serviceIntent = new Intent(context, EnhancedGPSService.class);
        serviceIntent.setAction("STOP_TRACKING");
        serviceIntent.putExtra("courseId", courseId);
        
        try {
            context.startService(serviceIntent);
            Log.d(TAG, "GPS stop command sent successfully");
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop GPS service: " + e.getMessage());
        }
    }
}