package com.euscagency.itrack;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import androidx.core.content.ContextCompat;

@CapacitorPlugin(name = "DirectGPS")
public class DirectGPSPlugin extends Plugin {
    private static final String TAG = "DirectGPS";

    @PluginMethod
    public void startTracking(PluginCall call) {
        String courseId = call.getString("courseId");
        String vehicleNumber = call.getString("vehicleNumber");
        String uit = call.getString("uit");
        String authToken = call.getString("authToken");
        Integer status = call.getInt("status");

        Log.d(TAG, "Starting GPS tracking for course: " + courseId);

        try {
            Intent serviceIntent = new Intent(getContext(), EnhancedGPSService.class);
            serviceIntent.putExtra("action", "START_TRACKING");
            serviceIntent.putExtra("courseId", courseId);
            serviceIntent.putExtra("vehicleNumber", vehicleNumber);
            serviceIntent.putExtra("uit", uit);
            serviceIntent.putExtra("authToken", authToken);
            serviceIntent.putExtra("status", status != null ? status : 2);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ContextCompat.startForegroundService(getContext(), serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "GPS tracking started successfully");
            call.resolve(ret);

        } catch (Exception e) {
            Log.e(TAG, "Failed to start GPS tracking: " + e.getMessage());
            call.reject("Failed to start GPS tracking: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopTracking(PluginCall call) {
        String courseId = call.getString("courseId");

        Log.d(TAG, "Stopping GPS tracking for course: " + courseId);

        try {
            Intent serviceIntent = new Intent(getContext(), EnhancedGPSService.class);
            serviceIntent.putExtra("action", "STOP_TRACKING");
            serviceIntent.putExtra("courseId", courseId);
            
            getContext().startService(serviceIntent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "GPS tracking stopped successfully");
            call.resolve(ret);

        } catch (Exception e) {
            Log.e(TAG, "Failed to stop GPS tracking: " + e.getMessage());
            call.reject("Failed to stop GPS tracking: " + e.getMessage());
        }
    }
}