package com.euscagency.itrack;

import android.content.Intent;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SimpleGPSPlugin")
public class SimpleGPSPlugin extends Plugin {
    private static final String TAG = "SimpleGPSPlugin";

    @PluginMethod
    public void startGPSTracking(PluginCall call) {
        try {
            String vehicleNumber = call.getString("vehicleNumber");
            String courseId = call.getString("courseId");
            String uit = call.getString("uit");
            String authToken = call.getString("authToken");
            Integer status = call.getInt("status", 2);

            Log.d(TAG, "Starting GPS tracking - Course: " + courseId + ", UIT: " + uit);

            // Start SimpleGPSService
            Intent serviceIntent = new Intent(getContext(), SimpleGPSService.class);
            serviceIntent.putExtra("action", "start");
            serviceIntent.putExtra("vehicleNumber", vehicleNumber);
            serviceIntent.putExtra("courseId", courseId);
            serviceIntent.putExtra("uit", uit);
            serviceIntent.putExtra("authToken", authToken);
            serviceIntent.putExtra("status", status);

            getContext().startForegroundService(serviceIntent);

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "GPS tracking started for course " + courseId);
            call.resolve(result);

            Log.d(TAG, "GPS tracking started successfully");

        } catch (Exception e) {
            Log.e(TAG, "Error starting GPS tracking", e);
            
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("message", "Failed to start GPS tracking: " + e.getMessage());
            call.resolve(result);
        }
    }

    @PluginMethod
    public void stopGPSTracking(PluginCall call) {
        try {
            String courseId = call.getString("courseId");
            
            Log.d(TAG, "Stopping GPS tracking for course: " + courseId);

            // Stop SimpleGPSService
            Intent serviceIntent = new Intent(getContext(), SimpleGPSService.class);
            serviceIntent.putExtra("action", "stop");
            serviceIntent.putExtra("courseId", courseId);
            
            getContext().startService(serviceIntent);

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "GPS tracking stopped for course " + courseId);
            call.resolve(result);

            Log.d(TAG, "GPS tracking stopped successfully");

        } catch (Exception e) {
            Log.e(TAG, "Error stopping GPS tracking", e);
            
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("message", "Failed to stop GPS tracking: " + e.getMessage());
            call.resolve(result);
        }
    }

    @PluginMethod
    public void isGPSTrackingActive(PluginCall call) {
        // Simple check - assume active if service is running
        // In production, you could check service status more thoroughly
        JSObject result = new JSObject();
        result.put("isActive", true); // Simplified for now
        call.resolve(result);
    }
}