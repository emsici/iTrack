package com.euscagency.itrack;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;

import com.getcapacitor.BridgeActivity;
import android.content.ComponentName;
import android.content.Intent;
import android.content.Context;
import android.app.ActivityManager;
import android.os.Handler;
import android.os.Looper;
import android.content.pm.PackageManager;
// EnhancedGPSService is now in the same package

/**
 * MainActivity pentru iTrack cu integrare GPS nativă
 * Oferă interfață WebView pentru activarea serviciului GPS din JavaScript
 */
public class MainActivity extends BridgeActivity {
    
    // Register DirectGPS plugin
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(DirectGPSPlugin.class);
    }
    private static final String TAG = "iTrackMainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Add AndroidGPS interface to WebView for JavaScript access
        getBridge().getWebView().addJavascriptInterface(new AndroidGPS(), "AndroidGPS");
        
        Log.d(TAG, "iTrack MainActivity initialized with GPS interface");
    }

    /**
     * WebView JavaScript Interface pentru controlul GPS-ului
     * Permite apelarea directă din JavaScript: window.AndroidGPS.startGPS(...)
     */
    public class AndroidGPS {
        
        @JavascriptInterface
        public String startGPS(String courseId, String vehicleNumber, String uit, String authToken, int status) {
            Log.d(TAG, "=== AndroidGPS.startGPS called ===");
            Log.d(TAG, "Course ID: " + courseId);
            Log.d(TAG, "Vehicle: " + vehicleNumber);
            Log.d(TAG, "UIT: " + uit);
            Log.d(TAG, "Status: " + status);
            Log.d(TAG, "Token: " + (authToken != null ? authToken.substring(0, Math.min(30, authToken.length())) + "..." : "null"));
            
            try {
                Intent intent = new Intent(MainActivity.this, EnhancedGPSService.class);
                intent.setAction("START_TRACKING");
                intent.putExtra("courseId", courseId);
                intent.putExtra("vehicleNumber", vehicleNumber);
                intent.putExtra("uit", uit);
                intent.putExtra("authToken", authToken);
                intent.putExtra("status", status);
                
                startForegroundService(intent);
                Log.d(TAG, "✅ EnhancedGPSService started successfully via WebView interface");
                return "SUCCESS: GPS service started for course " + courseId;
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to start GPS service: " + e.getMessage());
                return "ERROR: " + e.getMessage();
            }
        }
        
        @JavascriptInterface
        public String stopGPS(String courseId) {
            Log.d(TAG, "=== AndroidGPS.stopGPS called ===");
            Log.d(TAG, "Course ID: " + courseId);
            
            try {
                Intent intent = new Intent(MainActivity.this, EnhancedGPSService.class);
                intent.setAction("STOP_TRACKING");
                intent.putExtra("courseId", courseId);
                
                startService(intent);
                Log.d(TAG, "✅ EnhancedGPSService stop requested successfully");
                return "SUCCESS: GPS service stopped for course " + courseId;
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to stop GPS service: " + e.getMessage());
                return "ERROR: " + e.getMessage();
            }
        }
        
        @JavascriptInterface
        public void updateStatus(String courseId, int newStatus) {
            Log.d(TAG, String.format("WebView GPS Status Update: Course=%s, Status=%d", courseId, newStatus));
            
            Intent intent = new Intent(MainActivity.this, EnhancedGPSService.class);
            intent.setAction("UPDATE_STATUS");
            intent.putExtra("courseId", courseId);
            intent.putExtra("status", newStatus);
            
            startService(intent);
            Log.d(TAG, "EnhancedGPSService status update via WebView interface");
        }
        
        @JavascriptInterface
        public void clearAllOnLogout() {
            Log.d(TAG, "WebView GPS Clear All on Logout");
            
            Intent intent = new Intent(MainActivity.this, EnhancedGPSService.class);
            intent.setAction("STOP_TRACKING");
            intent.putExtra("courseId", "LOGOUT_CLEAR_ALL");
            
            startService(intent);
            Log.d(TAG, "EnhancedGPSService cleared all on logout via WebView interface");
        }
    }
}