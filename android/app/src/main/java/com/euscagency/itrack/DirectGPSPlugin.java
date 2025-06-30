package com.euscagency.itrack;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import android.util.Log;

/**
 * DIRECT GPS PLUGIN: No WebView dependency - uses direct broadcast intents
 * Reliable GPS control that works even when WebView is suspended in background
 */
@CapacitorPlugin(name = "DirectGPS")
public class DirectGPSPlugin extends Plugin {
    private static final String TAG = "DirectGPSPlugin";

    @PluginMethod
    public void startGPS(PluginCall call) {
        String courseId = call.getString("courseId");
        String vehicleNumber = call.getString("vehicleNumber");
        String uit = call.getString("uit");
        String authToken = call.getString("authToken");
        int status = call.getInt("status", 2);

        Log.d(TAG, "🚀 DIRECT GPS startGPS called for course: " + courseId);

        try {
            // Send broadcast to GPSBroadcastReceiver (no WebView dependency)
            Intent broadcastIntent = new Intent(GPSBroadcastReceiver.ACTION_START_GPS);
            broadcastIntent.putExtra("COURSE_ID", courseId);
            broadcastIntent.putExtra("VEHICLE_NUMBER", vehicleNumber);
            broadcastIntent.putExtra("UIT", uit);
            broadcastIntent.putExtra("AUTH_TOKEN", authToken);
            broadcastIntent.putExtra("STATUS", status);
            broadcastIntent.setPackage(getContext().getPackageName());

            getContext().sendBroadcast(broadcastIntent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "GPS started successfully");
            call.resolve(ret);

            Log.d(TAG, "✅ GPS broadcast sent successfully for course: " + courseId);

        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to start GPS for course: " + courseId, e);

            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("message", "Failed to start GPS: " + e.getMessage());
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void stopGPS(PluginCall call) {
        String courseId = call.getString("courseId");
        Log.d(TAG, "🛑 DIRECT GPS stopGPS called for course: " + courseId);

        try {
            Intent broadcastIntent = new Intent(GPSBroadcastReceiver.ACTION_STOP_GPS);
            broadcastIntent.putExtra("COURSE_ID", courseId);
            broadcastIntent.setPackage(getContext().getPackageName());

            getContext().sendBroadcast(broadcastIntent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "GPS stopped successfully");
            call.resolve(ret);

            Log.d(TAG, "✅ GPS stop broadcast sent for course: " + courseId);

        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to stop GPS for course: " + courseId, e);

            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("message", "Failed to stop GPS: " + e.getMessage());
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void updateGPS(PluginCall call) {
        String courseId = call.getString("courseId");
        int status = call.getInt("status", 2);
        Log.d(TAG, "📊 DIRECT GPS updateGPS called for course: " + courseId + " status: " + status);

        try {
            Intent broadcastIntent = new Intent(GPSBroadcastReceiver.ACTION_UPDATE_GPS);
            broadcastIntent.putExtra("COURSE_ID", courseId);
            broadcastIntent.putExtra("STATUS", status);
            broadcastIntent.setPackage(getContext().getPackageName());

            getContext().sendBroadcast(broadcastIntent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "GPS updated successfully");
            call.resolve(ret);

            Log.d(TAG, "✅ GPS update broadcast sent for course: " + courseId);

        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to update GPS for course: " + courseId, e);

            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("message", "Failed to update GPS: " + e.getMessage());
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void clearAllGPS(PluginCall call) {
        Log.d(TAG, "🧹 DIRECT GPS clearAllGPS called");

        try {
            Intent broadcastIntent = new Intent(GPSBroadcastReceiver.ACTION_CLEAR_ALL_GPS);
            broadcastIntent.setPackage(getContext().getPackageName());

            getContext().sendBroadcast(broadcastIntent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "All GPS cleared successfully");
            call.resolve(ret);

            Log.d(TAG, "✅ GPS clear all broadcast sent");

        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to clear all GPS", e);

            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("message", "Failed to clear GPS: " + e.getMessage());
            call.resolve(ret);
        }
    }
}