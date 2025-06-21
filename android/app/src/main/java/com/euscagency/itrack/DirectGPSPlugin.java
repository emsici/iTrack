package com.euscagency.itrack;

import android.content.ComponentName;
import android.content.Intent;
import android.util.Log;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DirectGPS")
public class DirectGPSPlugin extends Plugin {
    private static final String TAG = "DirectGPSPlugin";

    @PluginMethod
    public void startTracking(PluginCall call) {
        Log.d(TAG, "=== DirectGPS Plugin startTracking called ===");
        
        String courseId = call.getString("courseId");
        String vehicleNumber = call.getString("vehicleNumber");
        String uit = call.getString("uit");
        String authToken = call.getString("authToken");
        Integer status = call.getInt("status", 2);
        
        Log.d(TAG, "Course ID: " + courseId);
        Log.d(TAG, "Vehicle: " + vehicleNumber);
        Log.d(TAG, "UIT: " + uit);
        Log.d(TAG, "Status: " + status);
        
        try {
            Intent intent = new Intent(getContext(), EnhancedGPSService.class);
            intent.setAction("START_TRACKING");
            intent.putExtra("courseId", courseId);
            intent.putExtra("vehicleNumber", vehicleNumber);
            intent.putExtra("uit", uit);
            intent.putExtra("authToken", authToken);
            intent.putExtra("status", status);
            
            ComponentName result = getContext().startForegroundService(intent);
            Log.d(TAG, "✅ EnhancedGPSService started via Capacitor plugin: " + result);
            
            call.resolve(new com.getcapacitor.JSObject().put("success", true).put("message", "GPS service started"));
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to start GPS service: " + e.getMessage(), e);
            call.reject("Failed to start GPS service: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopTracking(PluginCall call) {
        Log.d(TAG, "=== DirectGPS Plugin stopTracking called ===");
        
        String courseId = call.getString("courseId");
        Log.d(TAG, "Course ID: " + courseId);
        
        try {
            Intent intent = new Intent(getContext(), EnhancedGPSService.class);
            intent.setAction("STOP_TRACKING");
            intent.putExtra("courseId", courseId);
            
            getContext().startService(intent);
            Log.d(TAG, "✅ EnhancedGPSService stop requested via Capacitor plugin");
            
            call.resolve(new com.getcapacitor.JSObject().put("success", true).put("message", "GPS service stopped"));
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to stop GPS service: " + e.getMessage(), e);
            call.reject("Failed to stop GPS service: " + e.getMessage());
        }
    }

    @PluginMethod
    public void updateCourseStatus(PluginCall call) {
        Log.d(TAG, "=== DirectGPS Plugin updateCourseStatus called ===");
        
        String courseId = call.getString("courseId");
        Integer status = call.getInt("status", 2);
        
        Log.d(TAG, "Course ID: " + courseId + ", New Status: " + status);
        
        try {
            Intent intent = new Intent(getContext(), EnhancedGPSService.class);
            intent.setAction("UPDATE_STATUS");
            intent.putExtra("courseId", courseId);
            intent.putExtra("status", status);
            
            getContext().startService(intent);
            Log.d(TAG, "✅ EnhancedGPSService status update via Capacitor plugin");
            
            call.resolve(new com.getcapacitor.JSObject().put("success", true).put("message", "Status updated"));
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to update status: " + e.getMessage(), e);
            call.reject("Failed to update status: " + e.getMessage());
        }
    }
}