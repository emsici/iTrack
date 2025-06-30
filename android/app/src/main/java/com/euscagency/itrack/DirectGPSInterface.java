package com.euscagency.itrack;

import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.webkit.JavascriptInterface;

/**
 * SIMPLE WebView JavaScript Interface for GPS Control
 * Fallback when Capacitor Plugin fails
 */
public class DirectGPSInterface {
    private static final String TAG = "DirectGPSInterface";
    private Context context;

    public DirectGPSInterface(Context context) {
        this.context = context;
    }

    @JavascriptInterface
    public String startGPS(String courseId, String vehicleNumber, String uit, String authToken, int status) {
        Log.d(TAG, "=== DirectGPSInterface.startGPS called ===");
        Log.d(TAG, "Course ID: " + courseId);
        Log.d(TAG, "Vehicle: " + vehicleNumber);
        Log.d(TAG, "UIT: " + uit);
        Log.d(TAG, "Status: " + status);
        
        try {
            Intent intent = new Intent(context, OptimalGPSService.class);
            intent.setAction("START_GPS");
            intent.putExtra("COURSE_ID", courseId);
            intent.putExtra("VEHICLE_NUMBER", vehicleNumber);
            intent.putExtra("UIT", uit);
            intent.putExtra("AUTH_TOKEN", authToken);
            intent.putExtra("STATUS", status);
            
            context.startForegroundService(intent);
            
            Log.d(TAG, "✅ OptimalGPSService started successfully via DirectGPSInterface");
            return "SUCCESS: GPS started for course " + courseId;
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to start OptimalGPSService: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    @JavascriptInterface
    public String updateGPS(String courseId, int status) {
        Log.d(TAG, "=== DirectGPSInterface.updateGPS called ===");
        Log.d(TAG, "Course ID: " + courseId);
        Log.d(TAG, "New Status: " + status);
        
        try {
            Intent intent = new Intent(context, OptimalGPSService.class);
            intent.setAction("UPDATE_STATUS");
            intent.putExtra("COURSE_ID", courseId);
            intent.putExtra("STATUS", status);
            
            context.startService(intent);
            
            Log.d(TAG, "✅ GPS status updated successfully via DirectGPSInterface");
            return "SUCCESS: Status updated for course " + courseId;
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to update GPS status: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    @JavascriptInterface
    public String stopGPS(String courseId) {
        Log.d(TAG, "=== DirectGPSInterface.stopGPS called ===");
        Log.d(TAG, "Course ID: " + courseId);
        
        try {
            Intent intent = new Intent(context, OptimalGPSService.class);
            intent.setAction("STOP_GPS");
            intent.putExtra("COURSE_ID", courseId);
            
            context.startService(intent);
            
            Log.d(TAG, "✅ GPS stopped successfully via DirectGPSInterface");
            return "SUCCESS: GPS stopped for course " + courseId;
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to stop GPS: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    @JavascriptInterface
    public String clearAllGPS() {
        Log.d(TAG, "=== DirectGPSInterface.clearAllGPS called ===");
        
        try {
            Intent intent = new Intent(context, OptimalGPSService.class);
            intent.setAction("CLEAR_ALL");
            
            context.startService(intent);
            
            Log.d(TAG, "✅ All GPS cleared successfully via DirectGPSInterface");
            return "SUCCESS: All GPS cleared";
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to clear GPS: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }
}