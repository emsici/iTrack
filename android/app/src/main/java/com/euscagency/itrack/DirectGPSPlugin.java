package com.euscagency.itrack;

import android.content.ComponentName;
import android.content.Intent;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DirectGPS")
public class DirectGPSPlugin extends Plugin {
    private static final String TAG = "DirectGPSPlugin";

    @PluginMethod
    public void startGPS(PluginCall call) {
        Log.d(TAG, "=== DirectGPSPlugin.startGPS called ===");
        
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
            
            JSObject response = new JSObject();
            if (result != null) {
                Log.d(TAG, "✅ OptimalGPSService started successfully via DirectGPSPlugin");
                response.put("success", true);
                response.put("message", "GPS started successfully");
            } else {
                Log.e(TAG, "❌ Failed to start OptimalGPSService via DirectGPSPlugin");
                response.put("success", false);
                response.put("message", "Failed to start GPS service");
            }
            
            call.resolve(response);
            
        } catch (Exception e) {
            Log.e(TAG, "❌ DirectGPSPlugin error: " + e.getMessage());
            e.printStackTrace();
            
            JSObject response = new JSObject();
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            call.resolve(response);
        }
    }

    @PluginMethod
    public void stopGPS(PluginCall call) {
        Log.d(TAG, "=== DirectGPSPlugin.stopGPS called ===");
        
        String courseId = call.getString("courseId");
        
        try {
            Intent intent = new Intent(getContext(), OptimalGPSService.class);
            intent.setAction("STOP_GPS");
            intent.putExtra("COURSE_ID", courseId);
            
            ComponentName result = getContext().startForegroundService(intent);
            
            JSObject response = new JSObject();
            if (result != null) {
                Log.d(TAG, "✅ GPS stopped successfully via DirectGPSPlugin");
                response.put("success", true);
                response.put("message", "GPS stopped successfully");
            } else {
                Log.e(TAG, "❌ Failed to stop GPS via DirectGPSPlugin");
                response.put("success", false);
                response.put("message", "Failed to stop GPS");
            }
            
            call.resolve(response);
            
        } catch (Exception e) {
            Log.e(TAG, "❌ DirectGPSPlugin stop error: " + e.getMessage());
            e.printStackTrace();
            
            JSObject response = new JSObject();
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            call.resolve(response);
        }
    }

    @PluginMethod
    public void updateGPS(PluginCall call) {
        Log.d(TAG, "=== DirectGPSPlugin.updateGPS called ===");
        
        String courseId = call.getString("courseId");
        Integer status = call.getInt("status");
        
        try {
            Intent intent = new Intent(getContext(), OptimalGPSService.class);
            intent.setAction("UPDATE_STATUS");
            intent.putExtra("COURSE_ID", courseId);
            intent.putExtra("STATUS", status);
            
            ComponentName result = getContext().startForegroundService(intent);
            
            JSObject response = new JSObject();
            if (result != null) {
                Log.d(TAG, "✅ GPS status updated successfully via DirectGPSPlugin");
                response.put("success", true);
                response.put("message", "GPS status updated successfully");
            } else {
                Log.e(TAG, "❌ Failed to update GPS status via DirectGPSPlugin");
                response.put("success", false);
                response.put("message", "Failed to update GPS status");
            }
            
            call.resolve(response);
            
        } catch (Exception e) {
            Log.e(TAG, "❌ DirectGPSPlugin update error: " + e.getMessage());
            e.printStackTrace();
            
            JSObject response = new JSObject();
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            call.resolve(response);
        }
    }

    @PluginMethod
    public void clearAllGPS(PluginCall call) {
        Log.d(TAG, "=== DirectGPSPlugin.clearAllGPS called ===");
        
        try {
            Intent intent = new Intent(getContext(), OptimalGPSService.class);
            intent.setAction("CLEAR_ALL");
            
            ComponentName result = getContext().startForegroundService(intent);
            
            JSObject response = new JSObject();
            if (result != null) {
                Log.d(TAG, "✅ GPS cleared successfully via DirectGPSPlugin");
                response.put("success", true);
                response.put("message", "All GPS cleared successfully");
            } else {
                Log.e(TAG, "❌ Failed to clear GPS via DirectGPSPlugin");
                response.put("success", false);
                response.put("message", "Failed to clear GPS");
            }
            
            call.resolve(response);
            
        } catch (Exception e) {
            Log.e(TAG, "❌ DirectGPSPlugin clear error: " + e.getMessage());
            e.printStackTrace();
            
            JSObject response = new JSObject();
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            call.resolve(response);
        }
    }
}