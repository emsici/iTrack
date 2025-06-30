package com.euscagency.itrack;

import android.content.ComponentName;
import android.content.Intent;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * EFFICIENT: Native Capacitor Plugin for GPS Control
 * Direct method calls without WebView bridge timing issues
 */
@CapacitorPlugin(name = "GPS")
public class GPSPlugin extends Plugin {
    private static final String TAG = "GPSPlugin";
    
    @Override
    public void load() {
        super.load();
        Log.d(TAG, "✅ GPSPlugin loaded successfully - ready for JavaScript calls");
        Log.d(TAG, "✅ GPSPlugin name: GPS");
        Log.d(TAG, "✅ GPSPlugin class: " + this.getClass().getName());
        Log.d(TAG, "✅ GPSPlugin bridge ready: " + (getBridge() != null));
    }

    @PluginMethod
    public void startGPS(PluginCall call) {
        Log.d(TAG, "=== GPSPlugin.startGPS called ===");
        
        String courseId = call.getString("courseId");
        String vehicleNumber = call.getString("vehicleNumber");
        String uit = call.getString("uit");
        String authToken = call.getString("authToken");
        Integer status = call.getInt("status");
        
        Log.d(TAG, "Course ID: " + courseId);
        Log.d(TAG, "Vehicle: " + vehicleNumber);
        Log.d(TAG, "UIT: " + uit);
        Log.d(TAG, "Status: " + status);
        
        try {
            Intent intent = new Intent(getContext(), OptimalGPSService.class);
            intent.setAction("START_GPS");
            intent.putExtra("COURSE_ID", courseId);
            intent.putExtra("VEHICLE_NUMBER", vehicleNumber);
            intent.putExtra("UIT", uit);
            intent.putExtra("AUTH_TOKEN", authToken);
            intent.putExtra("STATUS", status);
            
            ComponentName result = getContext().startForegroundService(intent);
            if (result != null) {
                Log.d(TAG, "✅ OptimalGPSService started successfully");
                
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("message", "GPS started for course " + courseId);
                call.resolve(ret);
            } else {
                Log.e(TAG, "❌ Failed to start OptimalGPSService");
                call.reject("Failed to start GPS service");
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Exception starting GPS: " + e.getMessage());
            call.reject("GPS start error: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopGPS(PluginCall call) {
        Log.d(TAG, "=== GPSPlugin.stopGPS called ===");
        
        String courseId = call.getString("courseId");
        Log.d(TAG, "Course ID: " + courseId);
        
        try {
            Intent intent = new Intent(getContext(), OptimalGPSService.class);
            intent.setAction("STOP_GPS");
            intent.putExtra("COURSE_ID", courseId);
            
            getContext().startService(intent);
            Log.d(TAG, "✅ OptimalGPSService stop command sent");
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "GPS stopped for course " + courseId);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "❌ Exception stopping GPS: " + e.getMessage());
            call.reject("GPS stop error: " + e.getMessage());
        }
    }

    @PluginMethod
    public void updateGPS(PluginCall call) {
        Log.d(TAG, "=== GPSPlugin.updateGPS called ===");
        
        String courseId = call.getString("courseId");
        Integer status = call.getInt("status");
        
        Log.d(TAG, "Course ID: " + courseId);
        Log.d(TAG, "New Status: " + status);
        
        try {
            Intent intent = new Intent(getContext(), OptimalGPSService.class);
            intent.setAction("UPDATE_STATUS");
            intent.putExtra("COURSE_ID", courseId);
            intent.putExtra("STATUS", status);
            
            getContext().startService(intent);
            Log.d(TAG, "✅ OptimalGPSService update command sent");
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "GPS status updated for course " + courseId);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "❌ Exception updating GPS: " + e.getMessage());
            call.reject("GPS update error: " + e.getMessage());
        }
    }

    @PluginMethod
    public void clearAllGPS(PluginCall call) {
        Log.d(TAG, "=== GPSPlugin.clearAllGPS called ===");
        
        try {
            Intent intent = new Intent(getContext(), OptimalGPSService.class);
            intent.setAction("CLEAR_ALL");
            
            getContext().startService(intent);
            Log.d(TAG, "✅ OptimalGPSService cleared all courses - logout complete");
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "All GPS data cleared");
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to clear GPS data: " + e.getMessage());
            call.reject("GPS clear error: " + e.getMessage());
        }
    }
}