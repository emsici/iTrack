package com.euscagency.itrack;

import android.content.Intent;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "GPSTracking")
public class GPSTrackingPlugin extends Plugin {
    private static final String TAG = "GPSTrackingPlugin";
    
    @PluginMethod
    public void startGPSTracking(PluginCall call) {
        String vehicleNumber = call.getString("vehicleNumber");
        String courseId = call.getString("courseId");
        String uit = call.getString("uit");
        String authToken = call.getString("authToken");
        
        if (vehicleNumber == null || courseId == null || uit == null || authToken == null) {
            call.reject("Missing required parameters");
            return;
        }
        
        Log.d(TAG, "Starting GPS tracking for course: " + courseId + ", vehicle: " + vehicleNumber);
        
        try {
            Intent serviceIntent = new Intent(getContext(), GPSForegroundService.class);
            serviceIntent.putExtra("action", "START_TRACKING");
            serviceIntent.putExtra("vehicleNumber", vehicleNumber);
            serviceIntent.putExtra("courseId", courseId);
            serviceIntent.putExtra("uit", uit);
            serviceIntent.putExtra("authToken", authToken);
            
            getContext().startForegroundService(serviceIntent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "GPS tracking started");
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to start GPS tracking", e);
            call.reject("Failed to start GPS tracking: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void stopGPSTracking(PluginCall call) {
        String courseId = call.getString("courseId");
        
        Log.d(TAG, "Stopping GPS tracking for course: " + courseId);
        
        try {
            Intent serviceIntent = new Intent(getContext(), GPSForegroundService.class);
            serviceIntent.putExtra("action", "STOP_TRACKING");
            
            getContext().stopService(serviceIntent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "GPS tracking stopped");
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop GPS tracking", e);
            call.reject("Failed to stop GPS tracking: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void isGPSTrackingActive(PluginCall call) {
        // Check if service is running - simplified implementation
        JSObject result = new JSObject();
        result.put("isActive", true); // Would need proper service check
        call.resolve(result);
    }
}