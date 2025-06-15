package com.euscagency.itrack;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * AlarmManager backup receiver for GPS transmission redundancy
 * Triggered by AlarmManager to ensure GPS data is sent even if primary timer fails
 */
public class GPSAlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "GPSAlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "GPS Alarm received - triggering backup transmission");
        
        try {
            // Send broadcast to force GPS transmission from the running service
            Intent forceTransmissionIntent = new Intent("com.euscagency.itrack.FORCE_GPS_TRANSMISSION");
            context.sendBroadcast(forceTransmissionIntent);
            
            Log.d(TAG, "Force GPS transmission broadcast sent from alarm receiver");
            
        } catch (Exception e) {
            Log.e(TAG, "Error in GPS alarm receiver", e);
        }
    }
}