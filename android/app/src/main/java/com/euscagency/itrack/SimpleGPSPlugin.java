package com.euscagency.itrack;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.util.Log;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SimpleGPS")
public class SimpleGPSPlugin extends Plugin {
    private static final String TAG = "SimpleGPSPlugin";

    @PluginMethod
    public void startTracking(PluginCall call) {
        Log.d(TAG, "SimpleGPS startTracking called");
        
        String vehicleNumber = call.getString("vehicleNumber");
        String courseId = call.getString("courseId");
        String uit = call.getString("uit");
        String authToken = call.getString("authToken");
        Integer status = call.getInt("status", 2);

        if (vehicleNumber == null || courseId == null || uit == null || authToken == null) {
            Log.e(TAG, "Missing required parameters");
            call.reject("Missing required parameters");
            return;
        }

        Log.d(TAG, "Starting GPS for course: " + courseId + ", UIT: " + uit);

        // Check location permissions
        if (!hasLocationPermissions()) {
            Log.w(TAG, "Location permissions not granted");
            call.reject("Location permissions required");
            return;
        }

        try {
            Intent serviceIntent = new Intent(getContext(), SimpleGPSService.class);
            serviceIntent.setAction("START_TRACKING");
            serviceIntent.putExtra("vehicleNumber", vehicleNumber);
            serviceIntent.putExtra("courseId", courseId);
            serviceIntent.putExtra("uit", uit);
            serviceIntent.putExtra("authToken", authToken);
            serviceIntent.putExtra("status", status);

            Log.d(TAG, "Starting SimpleGPSService");
            
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                getContext().startForegroundService(serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "GPS tracking started successfully");
            call.resolve(result);
            
            Log.d(TAG, "GPS tracking started successfully for UIT: " + uit);

        } catch (Exception e) {
            Log.e(TAG, "Failed to start GPS tracking", e);
            call.reject("Failed to start GPS tracking: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopTracking(PluginCall call) {
        String courseId = call.getString("courseId");
        Log.d(TAG, "Stopping GPS tracking for course: " + courseId);

        try {
            Intent serviceIntent = new Intent(getContext(), SimpleGPSService.class);
            serviceIntent.setAction("STOP_TRACKING");
            serviceIntent.putExtra("courseId", courseId);
            
            getContext().startService(serviceIntent);

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "GPS tracking stopped");
            call.resolve(result);
            
            Log.d(TAG, "GPS tracking stopped for course: " + courseId);

        } catch (Exception e) {
            Log.e(TAG, "Failed to stop GPS tracking", e);
            call.reject("Failed to stop GPS tracking: " + e.getMessage());
        }
    }

    @PluginMethod
    public void isActive(PluginCall call) {
        JSObject result = new JSObject();
        result.put("isActive", SimpleGPSService.isServiceRunning());
        call.resolve(result);
    }

    private boolean hasLocationPermissions() {
        boolean hasFine = ContextCompat.checkSelfPermission(getContext(), 
            Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        
        boolean hasCoarse = ContextCompat.checkSelfPermission(getContext(), 
            Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;

        Log.d(TAG, "Location permissions - Fine: " + hasFine + ", Coarse: " + hasCoarse);
        return hasFine && hasCoarse;
    }
}