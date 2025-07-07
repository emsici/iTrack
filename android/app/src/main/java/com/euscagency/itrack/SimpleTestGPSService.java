package com.euscagency.itrack;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.util.Log;

/**
 * MINIMAL GPS Service for testing Intent delivery
 */
public class SimpleTestGPSService extends Service {
    private static final String TAG = "SimpleTestGPS";
    
    public SimpleTestGPSService() {
        super();
        android.util.Log.e(TAG, "🚨🚨🚨 CONSTRUCTOR CALLED 🚨🚨🚨");
    }
    
    @Override
    public void onCreate() {
        super.onCreate();
        android.util.Log.e(TAG, "🚨🚨🚨 onCreate() CALLED 🚨🚨🚨");
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        android.util.Log.e(TAG, "🚨🚨🚨 onStartCommand() CALLED 🚨🚨🚨");
        
        if (intent != null) {
            android.util.Log.e(TAG, "Intent action: " + intent.getAction());
            String courseId = intent.getStringExtra("courseId");
            android.util.Log.e(TAG, "CourseId received: " + courseId);
        }
        
        return START_STICKY;
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}