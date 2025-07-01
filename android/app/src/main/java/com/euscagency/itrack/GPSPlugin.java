package com.euscagency.itrack;

import android.content.Intent;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Capacitor GPS Plugin - Alternative to WebView AndroidGPS interface
 * Used when WebView addJavascriptInterface fails in APK
 */
@CapacitorPlugin(name = "GPSPlugin")
public class GPSPlugin extends Plugin {
    
    private static final String TAG = "GPSPlugin";

    @PluginMethod
    public void startGPS(PluginCall call) {
        try {
            String courseId = call.getString("courseId");
            String vehicleNumber = call.getString("vehicleNumber");
            String uit = call.getString("uit");
            String authToken = call.getString("authToken");
            Integer status = call.getInt("status");
            
            Log.d(TAG, "=== GPSPlugin.startGPS called ===");
            Log.d(TAG, "Course ID: " + courseId);
            Log.d(TAG, "Vehicle: " + vehicleNumber);
            Log.d(TAG, "UIT: " + uit);
            Log.d(TAG, "Status: " + status);
            Log.d(TAG, "Token available: " + (authToken != null && !authToken.isEmpty()));
            
            // Create intent for OptimalGPSService
            Intent intent = new Intent(getContext(), OptimalGPSService.class);
            intent.setAction("START_GPS");
            intent.putExtra("COURSE_ID", courseId);
            intent.putExtra("VEHICLE_NUMBER", vehicleNumber);
            intent.putExtra("UIT", uit);
            intent.putExtra("AUTH_TOKEN", authToken);
            intent.putExtra("STATUS", status);
            
            getContext().startService(intent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "GPS started successfully");
            call.resolve(result);
            
            Log.d(TAG, "✅ GPSPlugin.startGPS successful");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ GPSPlugin.startGPS failed: " + e.getMessage());
            call.reject("GPS start failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopGPS(PluginCall call) {
        try {
            String courseId = call.getString("courseId");
            
            Log.d(TAG, "=== GPSPlugin.stopGPS called ===");
            Log.d(TAG, "Course ID: " + courseId);
            
            Intent intent = new Intent(getContext(), OptimalGPSService.class);
            intent.setAction("STOP_GPS");
            intent.putExtra("COURSE_ID", courseId);
            
            getContext().startService(intent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "GPS stopped successfully");
            call.resolve(result);
            
            Log.d(TAG, "✅ GPSPlugin.stopGPS successful");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ GPSPlugin.stopGPS failed: " + e.getMessage());
            call.reject("GPS stop failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void updateStatus(PluginCall call) {
        try {
            String courseId = call.getString("courseId");
            Integer newStatus = call.getInt("newStatus");
            
            Log.d(TAG, "=== GPSPlugin.updateStatus called ===");
            Log.d(TAG, "Course ID: " + courseId);
            Log.d(TAG, "New Status: " + newStatus);
            
            Intent intent = new Intent(getContext(), OptimalGPSService.class);
            intent.setAction("UPDATE_STATUS");
            intent.putExtra("COURSE_ID", courseId);
            intent.putExtra("NEW_STATUS", newStatus);
            
            getContext().startService(intent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Status updated successfully");
            call.resolve(result);
            
            Log.d(TAG, "✅ GPSPlugin.updateStatus successful");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ GPSPlugin.updateStatus failed: " + e.getMessage());
            call.reject("Status update failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void clearAll(PluginCall call) {
        try {
            Log.d(TAG, "=== GPSPlugin.clearAll called ===");
            
            Intent intent = new Intent(getContext(), OptimalGPSService.class);
            intent.setAction("CLEAR_ALL");
            
            getContext().startService(intent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "All GPS data cleared");
            call.resolve(result);
            
            Log.d(TAG, "✅ GPSPlugin.clearAll successful");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ GPSPlugin.clearAll failed: " + e.getMessage());
            call.reject("Clear all failed: " + e.getMessage());
        }
    }
}