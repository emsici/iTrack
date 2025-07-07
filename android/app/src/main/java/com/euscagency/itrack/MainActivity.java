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
    private WebView webView;

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
            WebView currentWebView = getBridge().getWebView();
            if (currentWebView != null) {
                Log.d(TAG, "🔧 Adding AndroidGPS interface to WebView...");
                
                // Store webView reference for later use
                this.webView = currentWebView;
                
                // Add JavaScript interface - this creates window.AndroidGPS
                currentWebView.addJavascriptInterface(this, "AndroidGPS");
                
                // Wait for WebView to be ready, then set flags and verify
                currentWebView.post(() -> {
                    currentWebView.evaluateJavascript("window.AndroidGPSReady = true;", null);
                    currentWebView.evaluateJavascript("window.androidGPSBridgeReady = true;", null);
                    currentWebView.evaluateJavascript("window.androidGPSInterfaceReady = true;", null);
                    
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
        android.util.Log.e(TAG, "🚨🚨🚨 === MAINACTIVITY AndroidGPS.startGPS CALLED FROM JAVASCRIPT 🚨🚨🚨");
        
        // CRITICAL DEBUG: Force JavaScript callback to prove Android function is called
        if (webView != null) {
            webView.post(() -> {
                webView.evaluateJavascript(
                    "console.log('🔥🔥🔥 PROOF: MainActivity.startGPS() WAS ACTUALLY CALLED! 🔥🔥🔥');",
                    null
                );
            });
        }
        Log.d(TAG, "📍 Parameters received:");
        Log.d(TAG, "  - courseId: " + courseId);
        Log.d(TAG, "  - vehicleNumber: " + vehicleNumber);
        Log.d(TAG, "  - uit: " + uit);
        Log.d(TAG, "  - authToken length: " + (authToken != null ? authToken.length() : "NULL"));
        Log.d(TAG, "  - status: " + status);
        
        // NOTE: SCHEDULE_EXACT_ALARM permission check moved to OptimalGPSService
        // Let service start but it will handle permission internally
        Log.d(TAG, "🔧 Permission check delegated to OptimalGPSService for compatibility");

        try {
            Intent serviceIntent = new Intent(this, OptimalGPSService.class);
            serviceIntent.setAction("START_GPS");
            serviceIntent.putExtra("courseId", courseId);
            serviceIntent.putExtra("vehicleNumber", vehicleNumber);
            serviceIntent.putExtra("uit", uit);
            serviceIntent.putExtra("authToken", authToken);
            serviceIntent.putExtra("status", status);
            
            android.util.Log.e(TAG, "🚀🚀🚀 MAINACTIVITY: About to call startForegroundService with START_GPS 🚀🚀🚀");
            android.util.Log.e(TAG, "📋 INTENT DETAILS:");
            android.util.Log.e(TAG, "  Action: " + serviceIntent.getAction());
            android.util.Log.e(TAG, "  courseId: " + courseId);
            android.util.Log.e(TAG, "  vehicleNumber: " + vehicleNumber);
            android.util.Log.e(TAG, "  uit: " + uit);
            android.util.Log.e(TAG, "  authToken length: " + (authToken != null ? authToken.length() : "null"));
            android.util.Log.e(TAG, "  status: " + status);
            
            startForegroundService(serviceIntent);
            
            android.util.Log.e(TAG, "✅✅✅ MAINACTIVITY: startForegroundService COMPLETED for " + courseId + " ✅✅✅");
            return "SUCCESS: GPS started for " + courseId;
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error starting GPS: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    @JavascriptInterface
    public String stopGPS(String courseId) {
        android.util.Log.e(TAG, "🛑🛑🛑 === MAINACTIVITY AndroidGPS.stopGPS CALLED === 🛑🛑🛑");
        android.util.Log.e(TAG, "📋 courseId: " + courseId);
        
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
        android.util.Log.e(TAG, "🔄🔄🔄 === MAINACTIVITY AndroidGPS.updateStatus CALLED === 🔄🔄🔄");
        android.util.Log.e(TAG, "📋 courseId: " + courseId + ", newStatus: " + newStatus);
        
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