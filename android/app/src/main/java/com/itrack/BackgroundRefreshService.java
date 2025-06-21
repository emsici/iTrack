package com.itrack;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.IBinder;
import android.os.SystemClock;
import android.util.Log;
import android.webkit.WebView;
import androidx.annotation.Nullable;

/**
 * Background Refresh Service for iTrack
 * Automatically refreshes courses every 5 minutes even when phone is locked
 */
public class BackgroundRefreshService extends Service {
    private static final String TAG = "BackgroundRefresh";
    private static final int REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
    private static final int ALARM_REQUEST_CODE = 12345;
    
    private AlarmManager alarmManager;
    private PendingIntent pendingIntent;
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "BackgroundRefreshService created");
        alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "BackgroundRefreshService started");
        
        String action = intent.getStringExtra("action");
        if ("START_REFRESH".equals(action)) {
            startBackgroundRefresh();
        } else if ("STOP_REFRESH".equals(action)) {
            stopBackgroundRefresh();
        }
        
        return START_STICKY; // Restart if killed
    }
    
    private void startBackgroundRefresh() {
        Log.d(TAG, "Starting background refresh every 5 minutes");
        
        Intent alarmIntent = new Intent(this, RefreshReceiver.class);
        pendingIntent = PendingIntent.getBroadcast(
            this, 
            ALARM_REQUEST_CODE, 
            alarmIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // Set repeating alarm every 5 minutes
        alarmManager.setRepeating(
            AlarmManager.ELAPSED_REALTIME_WAKEUP,
            SystemClock.elapsedRealtime() + REFRESH_INTERVAL,
            REFRESH_INTERVAL,
            pendingIntent
        );
        
        Log.d(TAG, "Background refresh alarm set successfully");
    }
    
    private void stopBackgroundRefresh() {
        Log.d(TAG, "Stopping background refresh");
        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent);
            pendingIntent = null;
        }
    }
    
    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        stopBackgroundRefresh();
        Log.d(TAG, "BackgroundRefreshService destroyed");
    }
    
    /**
     * BroadcastReceiver that handles the actual refresh
     */
    public static class RefreshReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            Log.d(TAG, "Background refresh triggered - phone may be locked");
            
            // Get SharedPreferences to check if app is active
            SharedPreferences prefs = context.getSharedPreferences("itrack_prefs", Context.MODE_PRIVATE);
            boolean coursesLoaded = prefs.getBoolean("courses_loaded", false);
            String vehicleNumber = prefs.getString("vehicle_number", "");
            String token = prefs.getString("auth_token", "");
            
            if (coursesLoaded && !vehicleNumber.isEmpty() && !token.isEmpty()) {
                Log.d(TAG, "Triggering course refresh for vehicle: " + vehicleNumber);
                
                // Send broadcast to WebView to trigger refresh
                Intent refreshIntent = new Intent("com.itrack.BACKGROUND_REFRESH");
                refreshIntent.putExtra("vehicleNumber", vehicleNumber);
                refreshIntent.putExtra("token", token);
                context.sendBroadcast(refreshIntent);
                
                Log.d(TAG, "Background refresh broadcast sent");
            } else {
                Log.d(TAG, "Skipping background refresh - app not ready");
            }
        }
    }
}