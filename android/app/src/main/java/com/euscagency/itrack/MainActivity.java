package com.euscagency.itrack;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
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
        
        Log.e(TAG, "🔧 MainActivity onCreate() - Setting up direct GPS bridge...");
    }

    @Override
    public void onStart() {
        super.onStart();
        
        // Add direct WebView bridge as fallback for GPS plugin issues
        Handler handler = new Handler(Looper.getMainLooper());
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                setupDirectGPSBridge();
            }
        }, 1000); // Wait 1 second for WebView to be ready
        
        Log.e(TAG, "🎯 MainActivity onStart() completed - Direct GPS bridge setup scheduled");
    }

    private void setupDirectGPSBridge() {
        try {
            WebView webView = getWebView();
            if (webView != null) {
                // Add direct JavaScript interface for GPS methods
                webView.addJavascriptInterface(new DirectGPSInterface(), "DirectGPS");
                
                // Set ready flag for JavaScript detection
                webView.evaluateJavascript("window.DirectGPSReady = true; console.log('✅ DirectGPS interface ready');", null);
                
                Log.e(TAG, "✅ DirectGPS interface added successfully");
            } else {
                Log.e(TAG, "❌ WebView not available for DirectGPS interface");
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to setup DirectGPS interface: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Direct JavaScript interface for GPS operations
     * Bypasses Capacitor plugin system
     */
    public class DirectGPSInterface {
        @JavascriptInterface
        public String startGPS(String courseId, String vehicleNumber, String uit, String authToken, int status) {
            Log.d(TAG, "=== DirectGPS.startGPS called ===");
            Log.d(TAG, "Course ID: " + courseId);
            Log.d(TAG, "Vehicle: " + vehicleNumber);
            Log.d(TAG, "UIT: " + uit);
            Log.d(TAG, "Status: " + status);
            
            try {
                Intent intent = new Intent(MainActivity.this, OptimalGPSService.class);
                intent.setAction("START_GPS");
                intent.putExtra("COURSE_ID", courseId);
                intent.putExtra("VEHICLE_NUMBER", vehicleNumber);
                intent.putExtra("UIT", uit);
                intent.putExtra("AUTH_TOKEN", authToken);
                intent.putExtra("STATUS", status);
                
                ComponentName result = startForegroundService(intent);
                if (result != null) {
                    Log.d(TAG, "✅ OptimalGPSService started successfully via DirectGPS");
                    return "SUCCESS";
                } else {
                    Log.e(TAG, "❌ Failed to start OptimalGPSService via DirectGPS");
                    return "ERROR: Failed to start service";
                }
            } catch (Exception e) {
                Log.e(TAG, "❌ DirectGPS error: " + e.getMessage());
                e.printStackTrace();
                return "ERROR: " + e.getMessage();
            }
        }

        @JavascriptInterface
        public String stopGPS(String courseId) {
            Log.d(TAG, "=== DirectGPS.stopGPS called ===");
            
            try {
                Intent intent = new Intent(MainActivity.this, OptimalGPSService.class);
                intent.setAction("STOP_GPS");
                intent.putExtra("COURSE_ID", courseId);
                
                ComponentName result = startForegroundService(intent);
                if (result != null) {
                    Log.d(TAG, "✅ GPS stopped successfully via DirectGPS");
                    return "SUCCESS";
                } else {
                    Log.e(TAG, "❌ Failed to stop GPS via DirectGPS");
                    return "ERROR: Failed to stop GPS";
                }
            } catch (Exception e) {
                Log.e(TAG, "❌ DirectGPS stop error: " + e.getMessage());
                e.printStackTrace();
                return "ERROR: " + e.getMessage();
            }
        }

        @JavascriptInterface
        public String updateGPS(String courseId, int status) {
            Log.d(TAG, "=== DirectGPS.updateGPS called ===");
            
            try {
                Intent intent = new Intent(MainActivity.this, OptimalGPSService.class);
                intent.setAction("UPDATE_STATUS");
                intent.putExtra("COURSE_ID", courseId);
                intent.putExtra("STATUS", status);
                
                ComponentName result = startForegroundService(intent);
                if (result != null) {
                    Log.d(TAG, "✅ GPS status updated successfully via DirectGPS");
                    return "SUCCESS";
                } else {
                    Log.e(TAG, "❌ Failed to update GPS status via DirectGPS");
                    return "ERROR: Failed to update status";
                }
            } catch (Exception e) {
                Log.e(TAG, "❌ DirectGPS update error: " + e.getMessage());
                e.printStackTrace();
                return "ERROR: " + e.getMessage();
            }
        }

        @JavascriptInterface
        public String clearAllGPS() {
            Log.d(TAG, "=== DirectGPS.clearAllGPS called ===");
            
            try {
                Intent intent = new Intent(MainActivity.this, OptimalGPSService.class);
                intent.setAction("CLEAR_ALL");
                
                ComponentName result = startForegroundService(intent);
                if (result != null) {
                    Log.d(TAG, "✅ All GPS cleared successfully via DirectGPS");
                    return "SUCCESS";
                } else {
                    Log.e(TAG, "❌ Failed to clear all GPS via DirectGPS");
                    return "ERROR: Failed to clear all GPS";
                }
            } catch (Exception e) {
                Log.e(TAG, "❌ DirectGPS clearAll error: " + e.getMessage());
                e.printStackTrace();
                return "ERROR: " + e.getMessage();
            }
        }
    }

    public void runOnMainThread(Runnable runnable) {
        runOnUiThread(runnable);
    }
}