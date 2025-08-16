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
        
        // Register AndroidGPS Plugin as fallback
        registerPlugin(AndroidGPSPlugin.class);
        Log.d(TAG, "🔌 AndroidGPSPlugin registered as Capacitor plugin");
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
                        "window.androidGPSVerified = isAvailable;",
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
                    "window.androidGPSVerified = (typeof window.AndroidGPS !== 'undefined' && typeof window.AndroidGPS.startGPS === 'function');",
                    null
                );
            }
        }, 3000);
    }

    // AndroidGPS WebView Interface Methods
    
    @JavascriptInterface
    public String startGPS(String courseId, String vehicleNumber, String uit, String authToken, int status) {
        Log.e(TAG, "🚀 === SIMPLE GPS === AndroidGPS.startGPS CALLED FROM JAVASCRIPT");
        Log.e(TAG, "📍 Starting NATIVE GPS system:");
        Log.e(TAG, "  - courseId: " + courseId);
        Log.e(TAG, "  - vehicleNumber: " + vehicleNumber);
        Log.e(TAG, "  - uit: " + uit);
        Log.e(TAG, "  - authToken length: " + (authToken != null ? authToken.length() : "NULL"));
        Log.e(TAG, "  - status: " + status);
        
        try {
            // Start NEW SimpleGPSService instead of OptimalGPSService
            Intent intent = new Intent(this, SimpleGPSService.class);
            intent.setAction("START_SIMPLE_GPS");
            intent.putExtra("courseId", courseId);
            intent.putExtra("vehicleNumber", vehicleNumber);
            intent.putExtra("uit", uit);
            intent.putExtra("authToken", authToken);
            intent.putExtra("status", status);
            
            Log.e(TAG, "🚀 === STARTING === SimpleGPSService with NATIVE precision...");
            startForegroundService(intent);
            Log.e(TAG, "✅ === SUCCESS === SimpleGPSService started for " + courseId);
            
            String result = "SUCCESS: NATIVE GPS started for " + courseId;
            Log.e(TAG, "📤 Returning to JavaScript: " + result);
            return result;
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error starting NATIVE GPS: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    @JavascriptInterface
    public String stopGPS(String courseId) {
        Log.e(TAG, "🛑 === SIMPLE GPS === AndroidGPS.stopGPS called: courseId=" + courseId);
        
        try {
            // Stop NEW SimpleGPSService
            Intent intent = new Intent(this, SimpleGPSService.class);
            intent.setAction("STOP_SIMPLE_GPS");
            intent.putExtra("courseId", courseId);
            
            startService(intent);
            Log.e(TAG, "✅ SimpleGPSService stop requested for courseId: " + courseId);
            return "SUCCESS: NATIVE GPS stop requested for " + courseId;
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error stopping NATIVE GPS: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    @JavascriptInterface
    public String updateStatus(String courseId, int newStatus) {
        Log.e(TAG, "🔄 === SIMPLE GPS === Status update: courseId=" + courseId + ", newStatus=" + newStatus);
        Log.e(TAG, "  Status meanings: 2=START/RESUME, 3=PAUSE, 4=STOP");
        
        try {
            // Send to NEW SimpleGPSService for status updates
            Intent intent = new Intent(this, SimpleGPSService.class);
            intent.setAction("UPDATE_SIMPLE_GPS_STATUS");
            intent.putExtra("courseId", courseId);
            intent.putExtra("newStatus", newStatus);
            
            startService(intent);
            Log.e(TAG, "✅ SimpleGPSService status update sent: " + courseId + " → " + newStatus);
            
            String statusName = (newStatus == 2) ? "ACTIVE" : (newStatus == 3) ? "PAUSE" : (newStatus == 4) ? "STOP" : "UNKNOWN";
            return "SUCCESS: NATIVE GPS status " + statusName + " for " + courseId;
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error updating NATIVE GPS status: " + e.getMessage());
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

    // NETWORK STATUS REPORTING pentru frontend - CRITICAL pentru online/offline detection
    @JavascriptInterface
    public void onGPSTransmissionSuccess() {
        Log.d(TAG, "📡 GPS transmission SUCCESS - notifying WebView about network status");
        
        // Call JavaScript function to report success
        runOnUiThread(() -> {
            String jsCode = "if(window.AndroidGPSCallback && window.AndroidGPSCallback.onTransmissionSuccess) { window.AndroidGPSCallback.onTransmissionSuccess(); }";
            getBridge().getWebView().evaluateJavascript(jsCode, null);
        });
    }

    @JavascriptInterface  
    public void onGPSTransmissionError(int httpStatus) {
        Log.d(TAG, "📡 GPS transmission ERROR " + httpStatus + " - notifying WebView about network status");
        
        // Call JavaScript function to report error
        runOnUiThread(() -> {
            String jsCode = "if(window.AndroidGPSCallback && window.AndroidGPSCallback.onTransmissionError) { window.AndroidGPSCallback.onTransmissionError(" + httpStatus + "); }";
            getBridge().getWebView().evaluateJavascript(jsCode, null);
        });
    }
}