package com.euscagency.itrack;

import android.content.Intent;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SimpleGPS")
public class SimpleGPSPlugin extends Plugin {
    private static final String TAG = "SimpleGPSPlugin";
    
    @PluginMethod
    public void startGPSTracking(PluginCall call) {
        String vehicleNumber = call.getString("vehicleNumber");
        String courseId = call.getString("courseId");
        String uit = call.getString("uit");
        String authToken = call.getString("authToken");
        Integer status = call.getInt("status", 2);
        
        Log.d(TAG, "Starting GPS tracking for course: " + courseId + ", UIT: " + uit);
        
        try {
            Intent serviceIntent = new Intent(getContext(), SimpleGPSService.class);
            serviceIntent.putExtra("action", "START_TRACKING");
            serviceIntent.putExtra("vehicleNumber", vehicleNumber);
            serviceIntent.putExtra("courseId", courseId);
            serviceIntent.putExtra("uit", uit);
            serviceIntent.putExtra("authToken", authToken);
            serviceIntent.putExtra("status", status);
            
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                getContext().startForegroundService(serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "GPS tracking started for UIT: " + uit);
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error starting GPS tracking", e);
            call.reject("Failed to start GPS tracking: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void stopGPSTracking(PluginCall call) {
        String courseId = call.getString("courseId");
        
        Log.d(TAG, "Stopping GPS tracking for course: " + courseId);
        
        try {
            Intent serviceIntent = new Intent(getContext(), SimpleGPSService.class);
            serviceIntent.putExtra("action", "STOP_TRACKING");
            serviceIntent.putExtra("courseId", courseId);
            getContext().startService(serviceIntent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "GPS tracking stopped");
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error stopping GPS tracking", e);
            call.reject("Failed to stop GPS tracking: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void isGPSTrackingActive(PluginCall call) {
        JSObject result = new JSObject();
        result.put("isActive", true); // Simplified for now
        call.resolve(result);
    }
}