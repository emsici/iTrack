package com.euscagency.itrack;

import android.content.Intent;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Alternative Capacitor Plugin approach for AndroidGPS
 * This guarantees interface availability without WebView bridge issues
 */
@CapacitorPlugin(name = "AndroidGPSPlugin")
public class AndroidGPSPlugin extends Plugin {
    private static final String TAG = "AndroidGPSPlugin";

    @PluginMethod
    public void startGPS(PluginCall call) {
        String courseId = call.getString("courseId");
        String vehicleNumber = call.getString("vehicleNumber");
        String uit = call.getString("uit");
        String authToken = call.getString("authToken");
        Integer status = call.getInt("status");
        
        Log.d(TAG, "🚀 Plugin startGPS called: " + courseId);
        
        try {
            Intent intent = new Intent(getContext(), OptimalGPSService.class);
            intent.setAction("START_GPS");
            intent.putExtra("courseId", courseId);
            intent.putExtra("vehicleNumber", vehicleNumber);
            intent.putExtra("uit", uit);
            intent.putExtra("authToken", authToken);
            intent.putExtra("status", status);
            
            getContext().startForegroundService(intent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "GPS started for " + courseId);
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Plugin GPS error: " + e.getMessage());
            call.reject("GPS start failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopGPS(PluginCall call) {
        String courseId = call.getString("courseId");
        Log.d(TAG, "🛑 Plugin stopGPS called: " + courseId);
        
        try {
            Intent intent = new Intent(getContext(), OptimalGPSService.class);
            intent.setAction("STOP_GPS");
            intent.putExtra("courseId", courseId);
            
            getContext().startService(intent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "GPS stopped for " + courseId);
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("GPS stop failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void updateStatus(PluginCall call) {
        String courseId = call.getString("courseId");
        Integer newStatus = call.getInt("newStatus");
        Log.d(TAG, "🔄 Plugin updateStatus called: " + courseId + " → " + newStatus);
        
        try {
            Intent intent = new Intent(getContext(), OptimalGPSService.class);
            intent.setAction("UPDATE_STATUS");
            intent.putExtra("courseId", courseId);
            intent.putExtra("newStatus", newStatus);
            
            getContext().startService(intent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Status updated for " + courseId);
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("Status update failed: " + e.getMessage());
        }
    }
}