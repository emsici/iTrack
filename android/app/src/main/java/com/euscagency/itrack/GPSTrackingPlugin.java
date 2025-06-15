package com.euscagency.itrack;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;
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

        // Check and request background location permissions
        if (!hasBackgroundLocationPermission()) {
            Log.w(TAG, "Background location permission not granted - requesting permissions");
            requestBackgroundLocationPermissions();
            call.reject("Background location permission required for GPS tracking");
            return;
        }

        // Request battery optimization exemption for reliable background operation
        requestBatteryOptimizationExemption();

        try {
            Intent serviceIntent = new Intent(getContext(), GPSForegroundService.class);
            serviceIntent.putExtra("action", "START_TRACKING");
            serviceIntent.putExtra("vehicleNumber", vehicleNumber);
            serviceIntent.putExtra("courseId", courseId);
            serviceIntent.putExtra("uit", uit);
            serviceIntent.putExtra("authToken", authToken);
            serviceIntent.putExtra("status", call.getInt("status", 2));

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
            serviceIntent.putExtra("action", "STOP_TRACKING");
            serviceIntent.putExtra("courseId", courseId);
            
            // Send stop command to service
            getContext().startService(serviceIntent);

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

    private boolean hasBackgroundLocationPermission() {
        // Check fine location permission
        boolean hasFineLocation = ContextCompat.checkSelfPermission(getContext(), 
            Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        
        // Check coarse location permission
        boolean hasCoarseLocation = ContextCompat.checkSelfPermission(getContext(), 
            Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        
        // For Android 10+ (API 29+), check background location permission
        boolean hasBackgroundLocation = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            hasBackgroundLocation = ContextCompat.checkSelfPermission(getContext(), 
                Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED;
        }
        
        Log.d(TAG, "Location permissions - Fine: " + hasFineLocation + 
                   ", Coarse: " + hasCoarseLocation + 
                   ", Background: " + hasBackgroundLocation);
        
        return hasFineLocation && hasCoarseLocation && hasBackgroundLocation;
    }

    private void requestBackgroundLocationPermissions() {
        Log.d(TAG, "Requesting background location permissions");
        
        String[] permissions;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Android 10+ requires background location permission
            permissions = new String[] {
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION,
                Manifest.permission.ACCESS_BACKGROUND_LOCATION
            };
        } else {
            // Android 9 and below
            permissions = new String[] {
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            };
        }
        
        ActivityCompat.requestPermissions(getActivity(), permissions, 1000);
        Log.d(TAG, "Background location permission request sent");
    }

    private void requestBatteryOptimizationExemption() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PowerManager powerManager = (PowerManager) getContext().getSystemService(getContext().POWER_SERVICE);
                String packageName = getContext().getPackageName();
                
                if (powerManager != null && !powerManager.isIgnoringBatteryOptimizations(packageName)) {
                    Log.d(TAG, "Requesting battery optimization exemption for reliable background GPS");
                    
                    Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(Uri.parse("package:" + packageName));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(intent);
                } else {
                    Log.d(TAG, "Battery optimization already disabled");
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not request battery optimization exemption", e);
        }
    }
}