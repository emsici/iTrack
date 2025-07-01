package com.euscagency.itrack;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
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
        Log.d(TAG, "✅ MainActivity initialized - preparing AndroidGPS WebView interface");
    }

    @Override
    public void onStart() {
        super.onStart();
        Log.d(TAG, "MainActivity onStart() - adding AndroidGPS interface to WebView");
        
        // Add AndroidGPS interface to WebView after a small delay for WebView readiness
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            addAndroidGPSInterface();
        }, 1000);
    }

    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG, "MainActivity onResume() - ensuring AndroidGPS interface is available");
        
        // Force-add AndroidGPS interface on resume to guarantee availability
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            addAndroidGPSInterface();
        }, 500);
    }

    private void addAndroidGPSInterface() {
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                // FORCE ADD - no delay, no retry complexity
                webView.addJavascriptInterface(this, "AndroidGPS");
                webView.evaluateJavascript("window.AndroidGPS = AndroidGPS;", null);
                webView.evaluateJavascript("window.AndroidGPSReady = true;", null);
                webView.evaluateJavascript("console.log('FORCE: AndroidGPS available = ' + (typeof window.AndroidGPS !== 'undefined'));", null);
                
                Log.d(TAG, "🔧 FORCE AndroidGPS interface added to WebView");
                
            } else {
                Log.e(TAG, "❌ WebView is null");
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Error adding AndroidGPS interface: " + e.getMessage());
        }
    }

    // AndroidGPS WebView Interface Methods
    
    @JavascriptInterface
    public String startGPS(String courseId, String vehicleNumber, String uit, String authToken, int status) {
        Log.d(TAG, "🚀 AndroidGPS.startGPS called: courseId=" + courseId + ", status=" + status);
        
        try {
            Intent intent = new Intent(this, OptimalGPSService.class);
            intent.setAction("START_GPS");
            intent.putExtra("courseId", courseId);
            intent.putExtra("vehicleNumber", vehicleNumber);
            intent.putExtra("uit", uit);
            intent.putExtra("authToken", authToken);
            intent.putExtra("status", status);
            
            startForegroundService(intent);
            Log.d(TAG, "✅ OptimalGPSService started for courseId: " + courseId);
            return "SUCCESS: GPS started for " + courseId;
            
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