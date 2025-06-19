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
public class CapacitorGPSPlugin extends Plugin {
    private static final String TAG = "CapacitorGPSPlugin";
    
    @Override
    public void load() {
        super.load();
        android.util.Log.d(TAG, "✅ GPS Plugin wrapper loaded successfully");
    }
    
    @PluginMethod
    public void startGPSTracking(PluginCall call) {
        String vehicleNumber = call.getString("vehicleNumber");
        String courseId = call.getString("courseId");
        String uit = call.getString("uit");
        String authToken = call.getString("authToken");

        Log.d(TAG, "Starting GPS tracking for course: " + courseId + ", vehicle: " + vehicleNumber);

        if (vehicleNumber == null || courseId == null || uit == null || authToken == null) {
            call.reject("Missing required parameters");
            return;
        }

        try {
            // Check permissions
            if (!hasLocationPermissions()) {
                requestLocationPermissions();
            }

            // Start EnhancedGPSService
            Intent serviceIntent = new Intent(getContext(), EnhancedGPSService.class);
            serviceIntent.putExtra("action", "START_TRACKING");
            serviceIntent.putExtra("vehicleNumber", vehicleNumber);
            serviceIntent.putExtra("courseId", courseId);
            serviceIntent.putExtra("uit", uit);
            serviceIntent.putExtra("authToken", authToken);
            serviceIntent.putExtra("status", call.getInt("status", 2));

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
        JSObject result = new JSObject();
        result.put("isActive", true);
        call.resolve(result);
    }

    private boolean hasLocationPermissions() {
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED &&
               ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private void requestLocationPermissions() {
        String[] permissions = {
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        };
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            permissions = new String[]{
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION,
                Manifest.permission.ACCESS_BACKGROUND_LOCATION
            };
        }
        
        ActivityCompat.requestPermissions(getActivity(), permissions, 1001);
    }
}