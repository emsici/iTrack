package com.euscagency.itrack;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;
import com.getcapacitor.Plugin;
import android.content.ComponentName;
import android.content.Intent;
import android.content.Context;
import android.app.ActivityManager;
import android.os.Handler;
import android.os.Looper;
import android.content.pm.PackageManager;

/**
 * MainActivity pentru iTrack cu integrare GPS nativă
 * Oferă interfață WebView AndroidGPS pentru activarea serviciului GPS din JavaScript
 */
public class MainActivity extends BridgeActivity {
    private static final String TAG = "iTrackMainActivity";
    private static MainActivity instance;

    public static MainActivity getInstance() {
        return instance;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instance = this;
        Log.d(TAG, "✅ MainActivity initialized - preparing AndroidGPS interfaces");
        
        // AndroidGPS interface handled directly via WebView - no plugin needed
        Log.d(TAG, "🔌 AndroidGPS interface ready - direct WebView bridge active");
    }
    
    // Bridge ready handling moved to onResume for compatibility

    @Override
    public void onStart() {
        super.onStart();
        Log.d(TAG, "MainActivity onStart() - scheduling AndroidGPS interface setup");
        
        // Multiple attempts to ensure WebView is ready
        new Handler(Looper.getMainLooper()).postDelayed(() -> addAndroidGPSInterface(), 500);
        new Handler(Looper.getMainLooper()).postDelayed(() -> addAndroidGPSInterface(), 1000);
        new Handler(Looper.getMainLooper()).postDelayed(() -> addAndroidGPSInterface(), 2000);
    }

    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG, "MainActivity onResume() - ensuring AndroidGPS interface availability");
        
        // Immediate and delayed attempts
        addAndroidGPSInterface();
        new Handler(Looper.getMainLooper()).postDelayed(() -> addAndroidGPSInterface(), 1000);
    }

    // Removed onPageFinished override - not available in BridgeActivity

    private void addAndroidGPSInterface() {
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                Log.d(TAG, "🔧 Adding AndroidGPS interface to WebView...");
                
                // Add JavaScript interface - this creates window.AndroidGPS
                webView.addJavascriptInterface(this, "AndroidGPS");
                
                // Wait for WebView to be ready, then set flags and verify
                webView.post(() -> {
                    webView.evaluateJavascript("window.AndroidGPSReady = true;", null);
                    webView.evaluateJavascript("window.androidGPSBridgeReady = true;", null);
                    webView.evaluateJavascript("window.androidGPSInterfaceReady = true;", null);
                    
                    // CRITICAL: Test and report if interface is working
                    webView.evaluateJavascript(
                        "const isAvailable = (typeof window.AndroidGPS !== 'undefined' && typeof window.AndroidGPS.startGPS === 'function');" +
                        "console.log('🔧 AndroidGPS Interface Status:');" +
                        "console.log('  - typeof AndroidGPS: ' + typeof AndroidGPS);" +
                        "console.log('  - typeof AndroidGPS.startGPS: ' + typeof AndroidGPS.startGPS);" +
                        "console.log('  - AndroidGPSReady: ' + window.AndroidGPSReady);" +
                        "console.log('FORCE: AndroidGPS available = ' + isAvailable);" +
                        "if (isAvailable) { console.log('✅ AndroidGPS INTERFACE SUCCESSFUL - GPS will work'); }" +
                        "else { console.log('❌ AndroidGPS INTERFACE FAILED - retrying...'); }",
                        null
                    );
                    
                    // If interface fails, schedule periodic retry
                    scheduleInterfaceVerification();
                });
                
                Log.d(TAG, "✅ AndroidGPS interface added successfully");
                
            } else {
                Log.e(TAG, "❌ WebView is null - retrying in 1 second");
                new Handler(Looper.getMainLooper()).postDelayed(() -> addAndroidGPSInterface(), 1000);
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Error adding AndroidGPS interface: " + e.getMessage(), e);
            // Retry on error
            new Handler(Looper.getMainLooper()).postDelayed(() -> addAndroidGPSInterface(), 2000);
        }
    }
    
    private void scheduleInterfaceVerification() {
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.evaluateJavascript(
                    "if (typeof window.AndroidGPS === 'undefined' || typeof window.AndroidGPS.startGPS !== 'function') {" +
                    "console.log('🔄 AndroidGPS still not available - attempting re-add');" +
                    "} else {" +
                    "console.log('✅ AndroidGPS verification PASSED - interface is working');" +
                    "}",
                    null
                );
            }
        }, 3000);
    }

    // AndroidGPS WebView Interface Methods
    
    @JavascriptInterface
    public String startGPS(String courseId, String vehicleNumber, String uit, String authToken, int status) {
        Log.d(TAG, "🚨 === DIAGNOSTIC === AndroidGPS.startGPS CALLED FROM JAVASCRIPT");
        Log.d(TAG, "📍 Parameters received:");
        Log.d(TAG, "  - courseId: " + courseId);
        Log.d(TAG, "  - vehicleNumber: " + vehicleNumber);
        Log.d(TAG, "  - uit: " + uit);
        Log.d(TAG, "  - authToken length: " + (authToken != null ? authToken.length() : "NULL"));
        Log.d(TAG, "  - status: " + status);
        
        // CRITICAL: Check SCHEDULE_EXACT_ALARM permission before starting GPS
        if (android.os.Build.VERSION.SDK_INT >= 31) {
            android.app.AlarmManager alarmManager = (android.app.AlarmManager) getSystemService(Context.ALARM_SERVICE);
            if (!alarmManager.canScheduleExactAlarms()) {
                Log.e(TAG, "❌ CRITICAL: SCHEDULE_EXACT_ALARM permission required for background GPS");
                Log.e(TAG, "   Opening Settings for user to enable: Apps > iTrack > Special permissions > Alarms & reminders");
                
                // Direct user to exact alarm settings
                try {
                    android.content.Intent settingsIntent = new android.content.Intent();
                    settingsIntent.setAction(android.provider.Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                    settingsIntent.setData(android.net.Uri.parse("package:" + getPackageName()));
                    startActivity(settingsIntent);
                    return "PERMISSION_NEEDED: Enable 'Alarms & reminders' in Settings to start GPS";
                } catch (Exception e) {
                    Log.e(TAG, "❌ Could not open alarm permission settings: " + e.getMessage());
                    return "ERROR: Need 'Alarms & reminders' permission in Settings > Apps > iTrack";
                }
            } else {
                Log.d(TAG, "✅ SCHEDULE_EXACT_ALARM permission granted - GPS will work in background");
            }
        }

        try {
            Log.d(TAG, "🔧 DIAGNOSTIC: Creating Intent for TestGPSService (debugging)");
            Intent intent = new Intent(this, TestGPSService.class);
            intent.setAction("START_GPS");
            intent.putExtra("courseId", courseId);
            intent.putExtra("vehicleNumber", vehicleNumber);
            intent.putExtra("uit", uit);
            intent.putExtra("authToken", authToken);
            intent.putExtra("status", status);
            
            Log.d(TAG, "🚀 DIAGNOSTIC: Calling startForegroundService...");
            
            // CRITICAL DIAGNOSTIC: Add detailed logging to catch service startup issues
            try {
                ComponentName serviceComponent = startForegroundService(intent);
                Log.d(TAG, "✅ DIAGNOSTIC: startForegroundService returned component: " + serviceComponent);
                Log.d(TAG, "🔍 DIAGNOSTIC: Service should now be starting with action START_GPS");
                
                // Wait a moment to see if service starts
                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    Log.d(TAG, "🕐 DIAGNOSTIC: 2 seconds after startForegroundService - checking if service responded");
                }, 2000);
                
            } catch (SecurityException se) {
                Log.e(TAG, "❌ SECURITY ERROR starting service: " + se.getMessage());
                return "ERROR: Security exception - " + se.getMessage();
            } catch (Exception se) {
                Log.e(TAG, "❌ EXCEPTION starting service: " + se.getMessage());
                return "ERROR: Service exception - " + se.getMessage();
            }
            
            Log.d(TAG, "✅ DIAGNOSTIC: OptimalGPSService startForegroundService completed for " + courseId);
            
            String result = "SUCCESS: GPS started for " + courseId;
            Log.d(TAG, "📤 DIAGNOSTIC: Returning result to JavaScript: " + result);
            return result;
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error starting GPS: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    @JavascriptInterface
    public String stopGPS(String courseId) {
        Log.d(TAG, "🛑 AndroidGPS.stopGPS called: courseId=" + courseId);
        
        try {
            Intent intent = new Intent(this, OptimalGPSService.class);
            intent.setAction("STOP_GPS");
            intent.putExtra("courseId", courseId);
            
            startService(intent);
            Log.d(TAG, "✅ OptimalGPSService stop requested for courseId: " + courseId);
            return "SUCCESS: GPS stop requested for " + courseId;
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error stopping GPS: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    @JavascriptInterface
    public String updateStatus(String courseId, int newStatus) {
        Log.d(TAG, "🔄 AndroidGPS.updateStatus called: courseId=" + courseId + ", newStatus=" + newStatus);
        
        try {
            Intent intent = new Intent(this, OptimalGPSService.class);
            intent.setAction("UPDATE_STATUS");
            intent.putExtra("courseId", courseId);
            intent.putExtra("newStatus", newStatus);
            
            startService(intent);
            Log.d(TAG, "✅ OptimalGPSService status update requested: " + courseId + " → " + newStatus);
            return "SUCCESS: Status update requested for " + courseId;
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error updating status: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    @JavascriptInterface
    public String clearAllOnLogout() {
        Log.d(TAG, "🧹 AndroidGPS.clearAllOnLogout called");
        
        try {
            Intent intent = new Intent(this, OptimalGPSService.class);
            intent.setAction("CLEAR_ALL");
            
            startService(intent);
            Log.d(TAG, "✅ OptimalGPSService clear all requested");
            return "SUCCESS: All GPS data cleared";
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error clearing GPS data: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }
}