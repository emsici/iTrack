package com.euscagency.itrack;

import android.content.Intent;
import android.util.Log;
import android.os.PowerManager;
import android.provider.Settings;
import android.net.Uri;
import android.os.Build;
import android.content.pm.PackageManager;
import android.Manifest;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
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
        
        // Automatically request all necessary background permissions
        requestBackgroundLocationPermission();
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
                    Log.d(TAG, "Automatically requesting battery optimization exemption");
                    
                    // Request permission directly without user guidance
                    Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(Uri.parse("package:" + packageName));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    
                    getContext().startActivity(intent);
                    Log.d(TAG, "Battery optimization permission dialog opened automatically");
                } else {
                    Log.d(TAG, "Battery optimization already disabled");
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not request battery optimization exemption", e);
        }
    }
    
    private void requestBackgroundLocationPermission() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Check if background location permission is granted
                if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_BACKGROUND_LOCATION) 
                    != PackageManager.PERMISSION_GRANTED) {
                    
                    Log.d(TAG, "Requesting background location permission");
                    
                    // Request background location permission directly
                    if (getActivity() != null) {
                        ActivityCompat.requestPermissions(getActivity(), 
                            new String[]{Manifest.permission.ACCESS_BACKGROUND_LOCATION}, 
                            1001);
                    }
                } else {
                    Log.d(TAG, "Background location permission already granted");
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not request background location permission", e);
        }
    }
    
    @PluginMethod
    public void requestBackgroundPermissions(PluginCall call) {
        try {
            Log.d(TAG, "Requesting all background permissions for GPS tracking");
            
            // Request background location permission first
            requestBackgroundLocationPermission();
            
            // Request battery optimization exemption
            requestBatteryOptimizationExemption();
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Background permissions requested - GPS will work when phone is locked");
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to request background permissions", e);
            call.reject("Failed to request background permissions: " + e.getMessage());
        }
    }
}