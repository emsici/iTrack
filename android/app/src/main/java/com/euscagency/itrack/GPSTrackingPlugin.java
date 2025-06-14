package com.euscagency.itrack;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.util.Log;
import androidx.core.app.ActivityCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(name = "GPSTracking", permissions = {
    @Permission(strings = {Manifest.permission.ACCESS_FINE_LOCATION}, alias = "location"),
    @Permission(strings = {Manifest.permission.ACCESS_COARSE_LOCATION}, alias = "coarseLocation"),
    @Permission(strings = {Manifest.permission.ACCESS_BACKGROUND_LOCATION}, alias = "backgroundLocation")
})
public class GPSTrackingPlugin extends Plugin {
    private static final String TAG = "GPSTrackingPlugin";
    
    @PluginMethod
    public void startGPSTracking(PluginCall call) {
        // Check and request permissions first
        if (!hasGPSPermissions()) {
            requestAllPermissions(call, "GPS_TRACKING_PERMS");
            return;
        }
        
        startGPSTrackingInternal(call);
    }
    
    private boolean hasGPSPermissions() {
        return ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED &&
               ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }
    
    @Override
    protected void handleRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.handleRequestPermissionsResult(requestCode, permissions, grantResults);
        
        PluginCall savedCall = getSavedCall();
        if (savedCall == null) {
            return;
        }
        
        if ("GPS_TRACKING_PERMS".equals(savedCall.getMethodName())) {
            if (hasGPSPermissions()) {
                startGPSTrackingInternal(savedCall);
            } else {
                savedCall.reject("GPS permissions are required for tracking");
            }
        }
    }
    
    private void startGPSTrackingInternal(PluginCall call) {
        String vehicleNumber = call.getString("vehicleNumber");
        String courseId = call.getString("courseId");
        String uit = call.getString("uit");
        String authToken = call.getString("authToken");
        Integer status = call.getInt("status", 2); // Default to active status
        
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
            serviceIntent.putExtra("status", status);
            
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
}