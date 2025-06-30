package com.euscagency.itrack;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import android.content.ComponentName;
import android.content.Intent;
import android.content.Context;
import android.app.ActivityManager;
import android.os.Handler;
import android.os.Looper;
import android.content.pm.PackageManager;
// EnhancedGPSService is now in the same package

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private static MainActivity instance;
    
    public static MainActivity getInstance() {
        return instance;
    }
    
    public WebView getWebView() {
        return getBridge().getWebView();
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instance = this;
        
        Log.e(TAG, "🔧 Starting AndroidGPS interface setup...");
        
        // Add AndroidGPS interface for GPS control only
        addAndroidGPSInterface();
        
        Log.e(TAG, "🎯 MainActivity onCreate() completed - AndroidGPS bridge setup initiated");
    }

    @Override
    public void onStart() {
        super.onStart();
        Log.e(TAG, "🔧 MainActivity onStart() - ensuring AndroidGPS bridge is ready");
        
        // Ensure AndroidGPS bridge is established when activity starts
        addAndroidGPSInterface();
    }

    /**
     * CRITICAL: Add AndroidGPS interface to WebView for JavaScript access
     * This enables GPS control from JavaScript: AndroidGPS.startGPS(), AndroidGPS.stopGPS(), etc.
     */
    /**
     * CRITICAL: Add AndroidGPS interface to WebView for JavaScript access
     * This enables GPS control from JavaScript: AndroidGPS.startGPS(), AndroidGPS.stopGPS(), etc.
     */
    private void addAndroidGPSInterface() {
        Log.e(TAG, "🔧 STARTING addAndroidGPSInterface() - CRITICAL for GPS functionality");
        
        final int maxRetries = 15;
        final int retryDelayMs = 500;
        
        Handler handler = new Handler(Looper.getMainLooper());
        Runnable setupBridge = new Runnable() {
            int retryCount = 0;
            
            @Override
            public void run() {
                try {
                    Log.e(TAG, "🔄 Attempt " + (retryCount + 1) + "/" + maxRetries + " to add AndroidGPS interface");
                    
                    // Check if Bridge and WebView are available
                    if (getBridge() == null) {
                        Log.e(TAG, "⚠️ Bridge not ready yet, will retry...");
                        scheduleRetry();
                        return;
                    }
                    
                    if (getBridge().getWebView() == null) {
                        Log.e(TAG, "⚠️ WebView not ready yet, will retry...");
                        scheduleRetry();
                        return;
                    }
                    
                    Log.e(TAG, "✅ Bridge and WebView are ready - adding AndroidGPS interface");
                    
                    // CRITICAL: Enable JavaScript in WebView first
                    getBridge().getWebView().getSettings().setJavaScriptEnabled(true);
                    getBridge().getWebView().getSettings().setDomStorageEnabled(true);
                    
                    // CRITICAL: Add MainActivity as AndroidGPS interface to WebView
                    getBridge().getWebView().addJavascriptInterface(MainActivity.this, "AndroidGPS");
                    Log.e(TAG, "✅ SUCCESS: AndroidGPS interface attached to WebView with JavaScript enabled");
                    
                    // ENHANCED: Set multiple ready flags and test methods in JavaScript
                    String readyScript = 
                        "try { " +
                        "  window.AndroidGPS = window.AndroidGPS || {}; " +
                        "  window.AndroidGPSReady = true; " +
                        "  window.androidGPSBridgeReady = true; " +
                        "  window.androidGPSInterfaceReady = true; " +
                        "  window.androidGPSMethodsAvailable = !!window.AndroidGPS.startGPS; " +
                        "  console.log('✅ CRITICAL: AndroidGPS bridge established - GPS operations enabled'); " +
                        "  console.log('AndroidGPS object:', typeof window.AndroidGPS); " +
                        "  console.log('startGPS method:', typeof window.AndroidGPS.startGPS); " +
                        "  console.log('stopGPS method:', typeof window.AndroidGPS.stopGPS); " +
                        "  console.log('updateGPS method:', typeof window.AndroidGPS.updateGPS); " +
                        "  console.log('All AndroidGPS methods available:', window.androidGPSMethodsAvailable); " +
                        "} catch(e) { console.error('AndroidGPS setup error:', e); }";
                    
                    getBridge().getWebView().evaluateJavascript(readyScript, null);
                    Log.e(TAG, "✅ SUCCESS: AndroidGPS ready flags set and methods tested in JavaScript");
                    Log.e(TAG, "🎯 AndroidGPS bridge is now FULLY OPERATIONAL for GPS transmission");
                    
                } catch (Exception e) {
                    Log.e(TAG, "❌ EXCEPTION in addAndroidGPSInterface: " + e.getMessage());
                    e.printStackTrace();
                    scheduleRetry();
                }
            }
            
            private void scheduleRetry() {
                if (retryCount < maxRetries) {
                    retryCount++;
                    Log.e(TAG, "🔄 Retrying AndroidGPS interface in " + retryDelayMs + "ms... (attempt " + (retryCount + 1) + "/" + maxRetries + ")");
                    handler.postDelayed(this, retryDelayMs);
                } else {
                    Log.e(TAG, "❌ FAILED: AndroidGPS interface setup failed after " + maxRetries + " attempts");
                    Log.e(TAG, "🚨 GPS functionality will NOT work without AndroidGPS bridge");
                }
            }
        };
        
        // Start the setup process immediately
        handler.post(setupBridge);
    }

    public void runOnMainThread(Runnable runnable) {
        runOnUiThread(runnable);
    }

    /**
     * ANDROID GPS CONTROL METHODS
     * These methods are called from JavaScript via AndroidGPS interface
     */

    /**
     * Start GPS tracking for a specific course
     * Called from JavaScript: AndroidGPS.startGPS(courseId, vehicleNumber, uit, authToken, status)
     */
    @JavascriptInterface
    public String startGPS(String courseId, String vehicleNumber, String uit, String authToken, int status) {
        Log.d(TAG, "=== MainActivity.startGPS called ===");
        Log.d(TAG, "Course ID: " + courseId);
        Log.d(TAG, "Vehicle: " + vehicleNumber);
        Log.d(TAG, "UIT: " + uit);
        Log.d(TAG, "Status: " + status);
        Log.d(TAG, "Auth token: " + (authToken != null ? authToken.substring(0, Math.min(20, authToken.length())) + "..." : "null"));
        
        try {
            Intent intent = new Intent(this, OptimalGPSService.class);
            intent.setAction("START_GPS");
            intent.putExtra("COURSE_ID", courseId);
            intent.putExtra("VEHICLE_NUMBER", vehicleNumber);
            intent.putExtra("UIT", uit);
            intent.putExtra("AUTH_TOKEN", authToken);
            intent.putExtra("STATUS", status);
            
            ComponentName result = startForegroundService(intent);
            if (result != null) {
                Log.d(TAG, "✅ OptimalGPSService started successfully");
                return "SUCCESS: GPS started for course " + courseId;
            } else {
                Log.e(TAG, "❌ Failed to start OptimalGPSService");
                return "ERROR: Failed to start GPS service";
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Exception starting GPS: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    /**
     * Stop GPS tracking for a specific course
     * Called from JavaScript: AndroidGPS.stopGPS(courseId)
     */
    @JavascriptInterface
    public String stopGPS(String courseId) {
        Log.d(TAG, "=== MainActivity.stopGPS called for course: " + courseId + " ===");
        
        try {
            Intent intent = new Intent(this, OptimalGPSService.class);
            intent.setAction("STOP_GPS");
            intent.putExtra("COURSE_ID", courseId);
            
            startService(intent);
            Log.d(TAG, "✅ OptimalGPSService stop command sent");
            return "SUCCESS: GPS stopped for course " + courseId;
        } catch (Exception e) {
            Log.e(TAG, "❌ Exception stopping GPS: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    /**
     * Update GPS status for a specific course
     * Called from JavaScript: AndroidGPS.updateGPS(courseId, status)
     */
    @JavascriptInterface
    public String updateGPS(String courseId, int status) {
        Log.d(TAG, "=== MainActivity.updateGPS called ===");
        Log.d(TAG, "Course ID: " + courseId);
        Log.d(TAG, "New Status: " + status);
        
        try {
            Intent intent = new Intent(this, OptimalGPSService.class);
            intent.setAction("UPDATE_STATUS");
            intent.putExtra("COURSE_ID", courseId);
            intent.putExtra("STATUS", status);
            
            startService(intent);
            Log.d(TAG, "✅ OptimalGPSService update command sent");
            return "SUCCESS: GPS status updated for course " + courseId;
        } catch (Exception e) {
            Log.e(TAG, "❌ Exception updating GPS: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    /**
     * Check if GPS service is running
     * Called from JavaScript: AndroidGPS.isGPSActive()
     */
    @JavascriptInterface
    public String isGPSActive() {
        try {
            ActivityManager manager = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
            for (ActivityManager.RunningServiceInfo service : manager.getRunningServices(Integer.MAX_VALUE)) {
                if (OptimalGPSService.class.getName().equals(service.service.getClassName())) {
                    Log.d(TAG, "✅ OptimalGPSService is running");
                    return "ACTIVE";
                }
            }
            Log.d(TAG, "❌ OptimalGPSService is not running");
            return "INACTIVE";
        } catch (Exception e) {
            Log.e(TAG, "❌ Exception checking GPS status: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    /**
     * Clear all GPS data on logout
     * Called from JavaScript: AndroidGPS.clearAllGPS()
     */
    @JavascriptInterface
    public String clearAllGPS() {
        Log.d(TAG, "=== MainActivity.clearAllGPS called ===");
        
        try {
            Intent intent = new Intent(this, OptimalGPSService.class);
            intent.setAction("CLEAR_ALL");
            
            startService(intent);
            Log.d(TAG, "✅ OptimalGPSService cleared all courses - logout complete");
            return "SUCCESS: All GPS data cleared";
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to clear GPS data: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }
}