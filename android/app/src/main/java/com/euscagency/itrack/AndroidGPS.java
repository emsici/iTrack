package com.euscagency.itrack;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import android.webkit.JavascriptInterface;

/**
 * AndroidGPS WebView Interface - OPTIMAL GPS SERVICE
 * All GPS operations now use OptimalGPSService for maximum efficiency
 */
public class AndroidGPS {
    private static final String TAG = "AndroidGPS";

    /**
     * Start OPTIMAL GPS tracking for a course
     */
    @JavascriptInterface
    public String startGPS(String courseId, String vehicleNumber, String authToken, String uit, int status) {
        Log.d(TAG, "🚀 AndroidGPS.startGPS called: " + courseId + " with status: " + status);
        
        try {
            Context context = MainActivity.getInstance();
            Intent intent = new Intent(context, OptimalGPSService.class);
            intent.setAction("START_GPS");
            intent.putExtra("courseId", courseId);
            intent.putExtra("vehicleNumber", vehicleNumber);
            intent.putExtra("authToken", authToken);
            intent.putExtra("uit", uit);
            intent.putExtra("status", status);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent);
            } else {
                context.startService(intent);
            }
            
            Log.d(TAG, "✅ OptimalGPSService START_GPS intent sent");
            return "SUCCESS";
        } catch (Exception e) {
            Log.e(TAG, "❌ Error starting OptimalGPSService: " + e.getMessage(), e);
            return "ERROR: " + e.getMessage();
        }
    }

    /**
     * Stop OPTIMAL GPS tracking for a course
     */
    @JavascriptInterface
    public String stopGPS(String courseId) {
        Log.d(TAG, "🛑 AndroidGPS.stopGPS called: " + courseId);
        
        try {
            Context context = MainActivity.getInstance();
            Intent intent = new Intent(context, OptimalGPSService.class);
            intent.setAction("STOP_GPS");
            intent.putExtra("courseId", courseId);
            context.startService(intent);
            
            Log.d(TAG, "✅ OptimalGPSService STOP_GPS intent sent for: " + courseId);
            return "SUCCESS";
        } catch (Exception e) {
            Log.e(TAG, "❌ Error stopping OptimalGPSService: " + e.getMessage(), e);
            return "ERROR: " + e.getMessage();
        }
    }

    /**
     * Update OPTIMAL GPS course status
     */
    @JavascriptInterface
    public String updateStatus(String courseId, int newStatus) {
        Log.d(TAG, "📊 AndroidGPS.updateStatus called: " + courseId + " -> " + newStatus);
        
        try {
            Context context = MainActivity.getInstance();
            Intent intent = new Intent(context, OptimalGPSService.class);
            intent.setAction("UPDATE_STATUS");
            intent.putExtra("courseId", courseId);
            intent.putExtra("newStatus", newStatus);
            context.startService(intent);
            
            Log.d(TAG, "✅ OptimalGPSService UPDATE_STATUS intent sent");
            return "SUCCESS";
        } catch (Exception e) {
            Log.e(TAG, "❌ Error updating OptimalGPSService status: " + e.getMessage(), e);
            return "ERROR: " + e.getMessage();
        }
    }

    /**
     * Clear all OPTIMAL GPS tracking on logout
     */
    @JavascriptInterface
    public String clearAllOnLogout() {
        Log.d(TAG, "🧹 AndroidGPS.clearAllOnLogout called");
        
        try {
            Context context = MainActivity.getInstance();
            Intent intent = new Intent(context, OptimalGPSService.class);
            intent.setAction("CLEAR_ALL");
            context.startService(intent);
            
            Log.d(TAG, "✅ OptimalGPSService CLEAR_ALL intent sent");
            return "SUCCESS";
        } catch (Exception e) {
            Log.e(TAG, "❌ Error clearing OptimalGPSService: " + e.getMessage(), e);
            return "ERROR: " + e.getMessage();
        }
    }
}