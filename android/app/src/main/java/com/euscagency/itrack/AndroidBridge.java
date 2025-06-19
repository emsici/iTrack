package com.euscagency.itrack;

import android.content.Intent;
import android.content.Context;
import android.webkit.JavascriptInterface;
import android.util.Log;

public class AndroidBridge {
    private static final String TAG = "AndroidBridge";
    private Context context;
    
    public AndroidBridge(Context context) {
        this.context = context;
    }
    
    @JavascriptInterface
    public void startGPSService(String courseId, String vehicleNumber, String uit, String authToken, int status) {
        Log.d(TAG, "Starting GPS service for course: " + courseId + ", UIT: " + uit);
        
        try {
            Intent serviceIntent = new Intent(context, EnhancedGPSService.class);
            serviceIntent.putExtra("action", "START_TRACKING");
            serviceIntent.putExtra("courseId", courseId);
            serviceIntent.putExtra("vehicleNumber", vehicleNumber);
            serviceIntent.putExtra("uit", uit);
            serviceIntent.putExtra("authToken", authToken);
            serviceIntent.putExtra("status", status);
            
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
            
            Log.d(TAG, "EnhancedGPSService started successfully");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to start GPS service", e);
        }
    }
    
    @JavascriptInterface
    public void stopGPSService(String courseId) {
        Log.d(TAG, "Stopping GPS service for course: " + courseId);
        
        try {
            Intent serviceIntent = new Intent(context, EnhancedGPSService.class);
            serviceIntent.putExtra("action", "STOP_TRACKING");
            serviceIntent.putExtra("courseId", courseId);
            
            context.startService(serviceIntent);
            
            Log.d(TAG, "GPS service stop command sent");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop GPS service", e);
        }
    }
}