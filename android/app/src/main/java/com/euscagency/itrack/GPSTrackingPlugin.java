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
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
    name = "GPSTracking",
    permissions = {
        @Permission(
            strings = {
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION,
                Manifest.permission.ACCESS_BACKGROUND_LOCATION
            },
            alias = "location"
        )
    }
)
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

        // Check and request location permissions using Capacitor's permission system
        if (getPermissionState("location") != com.getcapacitor.PermissionState.GRANTED) {
            Log.w(TAG, "Location permissions not granted - requesting permissions");
            requestPermissionForAlias("location", call, "handlePermissionResult");
            return;
        }

        // Permissions granted, proceed with GPS tracking
        startGPSService(call);

    }

    @PluginMethod
    public void handlePermissionResult(PluginCall call) {
        if (getPermissionState("location") == com.getcapacitor.PermissionState.GRANTED) {
            Log.d(TAG, "Location permissions granted, starting GPS service");
            startGPSService(call);
        } else {
            Log.e(TAG, "Location permissions denied");
            call.reject("Location permissions are required for GPS tracking");
        }
    }

    private void startGPSService(PluginCall call) {
        String vehicleNumber = call.getString("vehicleNumber");
        String courseId = call.getString("courseId");
        String uit = call.getString("uit");
        String authToken = call.getString("authToken");

        Log.d(TAG, "Starting EnhancedGPSService for course: " + courseId);

        // Request battery optimization exemption for reliable background operation
        requestBatteryOptimizationExemption();

        try {
            Intent serviceIntent = new Intent(getContext(), EnhancedGPSService.class);
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
            result.put("message", "GPS tracking started successfully");
            call.resolve(result);

            Log.d(TAG, "EnhancedGPSService started successfully for UIT: " + uit);

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
            Intent serviceIntent = new Intent(getContext(), EnhancedGPSService.class);
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