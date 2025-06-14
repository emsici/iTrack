package com.euscagency.itrack;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class GPSAlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "GPSAlarmReceiver";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "Alarm triggered - forcing GPS service to send data");
        
        // Send broadcast to GPS service to force data transmission
        Intent serviceIntent = new Intent("com.euscagency.itrack.FORCE_GPS_TRANSMISSION");
        context.sendBroadcast(serviceIntent);
    }
}