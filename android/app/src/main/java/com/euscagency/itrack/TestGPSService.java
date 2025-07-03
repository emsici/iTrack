package com.euscagency.itrack;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import androidx.core.app.NotificationCompat;

/**
 * MINIMAL TEST GPS SERVICE
 * Ultra-simple service to test if services start at all
 */
public class TestGPSService extends Service {
    private static final String TAG = "TestGPS";
    private static final int NOTIFICATION_ID = 999;
    private static final String CHANNEL_ID = "TestGPSChannel";
    
    public TestGPSService() {
        super();
        Log.d(TAG, "🚨🚨🚨 TEST GPS SERVICE CONSTRUCTOR - CLASS LOADING 🚨🚨🚨");
    }
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "🚨🚨🚨 TEST GPS SERVICE onCreate() - SERVICE CREATING 🚨🚨🚨");
        
        try {
            createNotificationChannel();
            startForeground(NOTIFICATION_ID, createNotification());
            Log.d(TAG, "✅ TEST SERVICE: Foreground started successfully");
        } catch (Exception e) {
            Log.e(TAG, "❌ TEST SERVICE: onCreate failed: " + e.getMessage(), e);
        }
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "🚨🚨🚨 TEST GPS SERVICE onStartCommand - RECEIVED COMMAND 🚨🚨🚨");
        
        if (intent != null) {
            String action = intent.getAction();
            Log.d(TAG, "🔍 TEST ACTION: " + action);
            
            if ("START_GPS".equals(action)) {
                String courseId = intent.getStringExtra("courseId");
                Log.d(TAG, "✅ TEST: Received START_GPS for course: " + courseId);
                return START_STICKY;
            }
        }
        
        return START_STICKY;
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Test GPS Service",
                NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }
    
    private Notification createNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Test GPS Service")
                .setContentText("Testing service startup")
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }
}