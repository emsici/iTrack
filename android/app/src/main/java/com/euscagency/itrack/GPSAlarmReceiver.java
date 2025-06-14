package com.euscagency.itrack;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class GPSAlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "GPSAlarmReceiver";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "AlarmManager backup GPS transmission triggered");
        
        // Start GPS service if not running (backup mechanism)
        try {
            Intent serviceIntent = new Intent(context, GPSForegroundService.class);
            serviceIntent.putExtra("alarmTrigger", true);
            
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
            
            Log.d(TAG, "GPS service restarted via AlarmManager backup");
        } catch (Exception e) {
            Log.e(TAG, "Failed to restart GPS service from alarm", e);
        }
    }
}