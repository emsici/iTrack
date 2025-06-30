package com.euscagency.itrack;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * GPS DIRECT: Broadcast receiver for GPS operations without WebView dependency
 * Provides reliable GPS control that works even when WebView is suspended
 */
public class GPSBroadcastReceiver extends BroadcastReceiver {
    private static final String TAG = "GPSBroadcastReceiver";
    
    public static final String ACTION_START_GPS = "com.euscagency.itrack.START_GPS";
    public static final String ACTION_STOP_GPS = "com.euscagency.itrack.STOP_GPS";
    public static final String ACTION_UPDATE_GPS = "com.euscagency.itrack.UPDATE_GPS";
    public static final String ACTION_CLEAR_ALL_GPS = "com.euscagency.itrack.CLEAR_ALL_GPS";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Log.d(TAG, "🎯 GPS Broadcast received: " + action);

        if (ACTION_START_GPS.equals(action)) {
            // Extract GPS parameters from broadcast
            String courseId = intent.getStringExtra("COURSE_ID");
            String vehicleNumber = intent.getStringExtra("VEHICLE_NUMBER");
            String uit = intent.getStringExtra("UIT");
            String authToken = intent.getStringExtra("AUTH_TOKEN");
            int status = intent.getIntExtra("STATUS", 2);

            Log.d(TAG, "📡 Starting GPS via broadcast for course: " + courseId);

            // Create service intent
            Intent serviceIntent = new Intent(context, OptimalGPSService.class);
            serviceIntent.setAction("START_GPS");
            serviceIntent.putExtra("COURSE_ID", courseId);
            serviceIntent.putExtra("VEHICLE_NUMBER", vehicleNumber);
            serviceIntent.putExtra("UIT", uit);
            serviceIntent.putExtra("AUTH_TOKEN", authToken);
            serviceIntent.putExtra("STATUS", status);

            // Start foreground service directly
            context.startForegroundService(serviceIntent);
            Log.d(TAG, "✅ GPS service started via broadcast");

        } else if (ACTION_STOP_GPS.equals(action)) {
            String courseId = intent.getStringExtra("COURSE_ID");
            Log.d(TAG, "🛑 Stopping GPS via broadcast for course: " + courseId);

            Intent serviceIntent = new Intent(context, OptimalGPSService.class);
            serviceIntent.setAction("STOP_GPS");
            serviceIntent.putExtra("COURSE_ID", courseId);
            context.startForegroundService(serviceIntent);

        } else if (ACTION_UPDATE_GPS.equals(action)) {
            String courseId = intent.getStringExtra("COURSE_ID");
            int status = intent.getIntExtra("STATUS", 2);
            Log.d(TAG, "📊 Updating GPS via broadcast for course: " + courseId + " to status: " + status);

            Intent serviceIntent = new Intent(context, OptimalGPSService.class);
            serviceIntent.setAction("UPDATE_STATUS");
            serviceIntent.putExtra("COURSE_ID", courseId);
            serviceIntent.putExtra("STATUS", status);
            context.startForegroundService(serviceIntent);

        } else if (ACTION_CLEAR_ALL_GPS.equals(action)) {
            Log.d(TAG, "🧹 Clearing all GPS via broadcast");

            Intent serviceIntent = new Intent(context, OptimalGPSService.class);
            serviceIntent.setAction("CLEAR_ALL");
            context.startForegroundService(serviceIntent);
        }
    }
}