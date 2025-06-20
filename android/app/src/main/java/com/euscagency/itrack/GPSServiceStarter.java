package com.euscagency.itrack;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import androidx.core.content.ContextCompat;

public class GPSServiceStarter {
    private static final String TAG = "GPSServiceStarter";
    
    public static void startGPSService(Context context, String courseId, String vehicleNumber, 
                                      String uit, String authToken, int status) {
        Log.d(TAG, "Starting EnhancedGPSService for course: " + courseId);
        
        Intent serviceIntent = new Intent(context, EnhancedGPSService.class);
        serviceIntent.setAction("START_TRACKING");
        serviceIntent.putExtra("courseId", courseId);
        serviceIntent.putExtra("vehicleNumber", vehicleNumber);
        serviceIntent.putExtra("uit", uit);
        serviceIntent.putExtra("authToken", authToken);
        serviceIntent.putExtra("status", status);
        
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // Android 8.0+ - start foreground service
                Log.d(TAG, "Starting foreground service for Android 8.0+");
                ContextCompat.startForegroundService(context, serviceIntent);
            } else {
                // Android 7.1 and below
                Log.d(TAG, "Starting regular service for Android 7.1-");
                context.startService(serviceIntent);
            }
            
            Log.d(TAG, "GPS service start command sent successfully");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to start GPS service: " + e.getMessage());
        }
    }
    
    public static void stopGPSService(Context context, String courseId) {
        Log.d(TAG, "Stopping EnhancedGPSService for course: " + courseId);
        
        Intent serviceIntent = new Intent(context, EnhancedGPSService.class);
        serviceIntent.setAction("STOP_TRACKING");
        serviceIntent.putExtra("courseId", courseId);
        
        try {
            context.startService(serviceIntent);
            Log.d(TAG, "GPS service stop command sent successfully");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop GPS service: " + e.getMessage());
        }
    }
}