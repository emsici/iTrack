package com.euscagency.itrack;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.util.Log;

/**
 * MINIMAL DIAGNOSTIC SERVICE - Tests if services work at all
 */
public class DiagnosticGPSService extends Service {
    private static final String TAG = "DiagnosticGPS";

    @Override
    public void onCreate() {
        super.onCreate();
        android.util.Log.e(TAG, "🚨🚨🚨 DIAGNOSTIC SERVICE CREATED SUCCESSFULLY 🚨🚨🚨");
        Log.d(TAG, "🚨🚨🚨 DIAGNOSTIC SERVICE CREATED SUCCESSFULLY 🚨🚨🚨");
        System.out.println("🚨🚨🚨 DIAGNOSTIC SERVICE CREATED SUCCESSFULLY 🚨🚨🚨");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        android.util.Log.e(TAG, "🔥🔥🔥 DIAGNOSTIC SERVICE STARTED - ACTION: " + (intent != null ? intent.getAction() : "NULL"));
        Log.d(TAG, "🔥🔥🔥 DIAGNOSTIC SERVICE STARTED - ACTION: " + (intent != null ? intent.getAction() : "NULL"));
        System.out.println("🔥🔥🔥 DIAGNOSTIC SERVICE STARTED - ACTION: " + (intent != null ? intent.getAction() : "NULL"));
        
        if (intent != null && "START_GPS".equals(intent.getAction())) {
            String courseId = intent.getStringExtra("courseId");
            android.util.Log.e(TAG, "✅ DIAGNOSTIC GPS START RECEIVED FOR COURSE: " + courseId);
            Log.d(TAG, "✅ DIAGNOSTIC GPS START RECEIVED FOR COURSE: " + courseId);
            System.out.println("✅ DIAGNOSTIC GPS START RECEIVED FOR COURSE: " + courseId);
        }
        
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}