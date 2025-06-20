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

@CapacitorPlugin(name = "GPSPlugin")
public class GPSPlugin extends Plugin {
    private static final String TAG = "GPSPlugin";

    @PluginMethod
    public void startGPS(PluginCall call) {
        String courseId = call.getString("courseId");
        String vehicleNumber = call.getString("vehicleNumber");
        String uit = call.getString("uit");
        String authToken = call.getString("authToken");
        Integer status = call.getInt("status");

        Log.d(TAG, "🚀 Starting GPS for course: " + courseId);
        Log.d(TAG, "Vehicle: " + vehicleNumber + ", UIT: " + uit);

        try {
            Intent serviceIntent = new Intent(getContext(), EnhancedGPSService.class);
            serviceIntent.setAction("START_TRACKING");
            serviceIntent.putExtra("courseId", courseId);
            serviceIntent.putExtra("vehicleNumber", vehicleNumber);
            serviceIntent.putExtra("uit", uit);
            serviceIntent.putExtra("authToken", authToken);
            serviceIntent.putExtra("status", status != null ? status : 2);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Log.d(TAG, "Starting foreground service for Android 8.0+");
                ContextCompat.startForegroundService(getContext(), serviceIntent);
            } else {
                Log.d(TAG, "Starting regular service for Android 7.1-");
                getContext().startService(serviceIntent);
            }

            Log.d(TAG, "✅ EnhancedGPSService started successfully");

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "GPS service started - transmitting every 60 seconds");
            call.resolve(ret);
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to start GPS: " + e.getMessage());
            call.reject("Failed to start GPS service: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopGPS(PluginCall call) {
        String courseId = call.getString("courseId");
        
        Log.d(TAG, "🛑 Stopping GPS for course: " + courseId);

        try {
            Intent serviceIntent = new Intent(getContext(), EnhancedGPSService.class);
            serviceIntent.setAction("STOP_TRACKING");
            serviceIntent.putExtra("courseId", courseId);
            
            getContext().startService(serviceIntent);
            
            Log.d(TAG, "✅ GPS stop command sent successfully");

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "GPS service stopped successfully");
            call.resolve(ret);
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to stop GPS: " + e.getMessage());
            call.reject("Failed to stop GPS service: " + e.getMessage());
        }
    }
}