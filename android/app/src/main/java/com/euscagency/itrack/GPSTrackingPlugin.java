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
    public void pauseGPSTracking(PluginCall call) {
        String courseId = call.getString("courseId");
        
        Log.d(TAG, "Pausing GPS tracking for course: " + courseId + " - stops coordinate transmission");
        
        try {
            // Send pause status to service
            Intent statusIntent = new Intent(getContext(), GPSForegroundService.class);
            statusIntent.putExtra("action", "pause");
            statusIntent.putExtra("courseId", courseId);
            getContext().startService(statusIntent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "GPS paused - coordinates stopped");
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to pause GPS tracking", e);
            call.reject("Failed to pause GPS tracking: " + e.getMessage());
        }
    }

    @PluginMethod
    public void resumeGPSTracking(PluginCall call) {
        String courseId = call.getString("courseId");
        
        Log.d(TAG, "Resuming GPS tracking for course: " + courseId + " - resumes coordinate transmission");
        
        try {
            // Send resume status to service
            Intent statusIntent = new Intent(getContext(), GPSForegroundService.class);
            statusIntent.putExtra("action", "resume");
            statusIntent.putExtra("courseId", courseId);
            getContext().startService(statusIntent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "GPS resumed - coordinates sending");
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to resume GPS tracking", e);
            call.reject("Failed to resume GPS tracking: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopGPSTracking(PluginCall call) {
        String courseId = call.getString("courseId");
        
        Log.d(TAG, "Stopping GPS tracking for course: " + courseId + " - sends final status and stops");
        
        try {
            // Send stop status to service
            Intent statusIntent = new Intent(getContext(), GPSForegroundService.class);
            statusIntent.putExtra("action", "stop");
            statusIntent.putExtra("courseId", courseId);
            getContext().startService(statusIntent);
            
            // Stop service after brief delay to send final status
            new android.os.Handler().postDelayed(() -> {
                Intent serviceIntent = new Intent(getContext(), GPSForegroundService.class);
                getContext().stopService(serviceIntent);
            }, 3000); // 3 second delay
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "GPS tracking stopped completely");
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
            Log.d(TAG, "Requesting background location permission for GPS tracking when phone is locked");
            
            // Check and request fine location first
            if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) 
                != PackageManager.PERMISSION_GRANTED) {
                Log.d(TAG, "Requesting fine location permission first");
                if (getActivity() != null) {
                    ActivityCompat.requestPermissions(getActivity(), 
                        new String[]{
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                        }, 1000);
                }
            }
            
            // For Android 10+ (API 29+), request background location
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_BACKGROUND_LOCATION) 
                    != PackageManager.PERMISSION_GRANTED) {
                    
                    Log.d(TAG, "Requesting ACCESS_BACKGROUND_LOCATION for tracking when phone is locked");
                    
                    // Open location settings to manually enable "Allow all the time"
                    Intent intent = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                    intent.setData(android.net.Uri.parse("package:" + getContext().getPackageName()));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    
                    getContext().startActivity(intent);
                    
                    Log.d(TAG, "Opened app settings - user must select 'Allow all the time' for location");
                } else {
                    Log.d(TAG, "Background location permission already granted - GPS will work when phone is locked");
                }
            } else {
                Log.d(TAG, "Android version < 10 - background location not required");
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not request background location permission", e);
        }
    }
    
    @PluginMethod
    public void requestBackgroundPermissions(PluginCall call) {
        try {
            Log.d(TAG, "ALWAYS requesting background location permission for GPS tracking when phone is locked");
            
            // Always request background location permission
            requestBackgroundLocationPermission();
            
            // Always request battery optimization exemption
            requestBatteryOptimizationExemption();
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "CRITICAL: Select 'Allow all the time' for location access. This enables GPS tracking when phone is locked.");
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to request background permissions", e);
            call.reject("Failed to request background permissions: " + e.getMessage());
        }
    }
}