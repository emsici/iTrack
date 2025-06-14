package com.euscagency.itrack;

import android.content.Intent;
import android.util.Log;
import android.os.PowerManager;
import android.provider.Settings;
import android.net.Uri;
import android.os.Build;
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
        
        // Request battery optimization exemption for background operation
        requestBatteryOptimizationExemption();
        
        try {
            Intent serviceIntent = new Intent(getContext(), GPSForegroundService.class);
            serviceIntent.putExtra("vehicleNumber", vehicleNumber);
            serviceIntent.putExtra("courseId", courseId);
            serviceIntent.putExtra("uit", uit);
            serviceIntent.putExtra("authToken", authToken);
            
            // Start foreground service
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                getContext().startForegroundService(serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }
            
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
        // Simple check - would need proper service verification in production
        JSObject result = new JSObject();
        result.put("isActive", true);
        call.resolve(result);
    }
    
    private void requestBatteryOptimizationExemption() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PowerManager powerManager = (PowerManager) getContext().getSystemService(getContext().POWER_SERVICE);
                String packageName = getContext().getPackageName();
                
                if (powerManager != null && !powerManager.isIgnoringBatteryOptimizations(packageName)) {
                    Log.d(TAG, "Requesting battery optimization exemption for background GPS");
                    
                    Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(Uri.parse("package:" + packageName));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    
                    getContext().startActivity(intent);
                    Log.d(TAG, "Battery optimization settings opened for user approval");
                } else {
                    Log.d(TAG, "Battery optimization already disabled or not supported");
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not request battery optimization exemption", e);
        }
    }
    
    @PluginMethod
    public void requestBackgroundPermissions(PluginCall call) {
        try {
            requestBatteryOptimizationExemption();
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Battery optimization settings opened - please allow iTrack to run in background");
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to request background permissions", e);
            call.reject("Failed to request background permissions: " + e.getMessage());
        }
    }
}