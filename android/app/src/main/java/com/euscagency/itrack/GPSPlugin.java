package com.euscagency.itrack;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import android.util.Log;

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

        Log.d(TAG, "Starting GPS for course: " + courseId);
        Log.d(TAG, "Vehicle: " + vehicleNumber + ", UIT: " + uit);

        try {
            GPSServiceStarter.startGPSService(
                getContext(), 
                courseId, 
                vehicleNumber, 
                uit, 
                authToken, 
                status != null ? status : 2
            );

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "GPS service started successfully");
            call.resolve(ret);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to start GPS: " + e.getMessage());
            call.reject("Failed to start GPS service: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopGPS(PluginCall call) {
        String courseId = call.getString("courseId");
        
        Log.d(TAG, "Stopping GPS for course: " + courseId);

        try {
            GPSServiceStarter.stopGPSService(getContext(), courseId);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "GPS service stopped successfully");
            call.resolve(ret);
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop GPS: " + e.getMessage());
            call.reject("Failed to stop GPS service: " + e.getMessage());
        }
    }
}