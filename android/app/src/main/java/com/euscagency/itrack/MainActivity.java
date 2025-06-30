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

/**
 * MainActivity pentru iTrack cu integrare GPS nativă
 * Oferă interfață WebView pentru activarea serviciului GPS din JavaScript
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
        Log.d(TAG, "✅ MainActivity initialized with AndroidGPS WebView interface");
    }

    @Override
    public void onStart() {
        super.onStart();
        
        // Add AndroidGPS interface to WebView
        addAndroidGPSInterface();
    }

    /**
     * Adaugă interfața AndroidGPS la WebView pentru apeluri din JavaScript
     */
    private void addAndroidGPSInterface() {
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            try {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().addJavascriptInterface(new AndroidGPS(), "AndroidGPS");
                    
                    // Notify JavaScript that interface is ready
                    getBridge().getWebView().evaluateJavascript(
                        "window.AndroidGPSReady = true; window.androidGPSBridgeReady = true; window.androidGPSInterfaceReady = true;",
                        null
                    );
                    
                    Log.d(TAG, "✅ AndroidGPS interface added to WebView successfully");
                } else {
                    Log.e(TAG, "❌ WebView not available for AndroidGPS interface");
                }
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to add AndroidGPS interface: " + e.getMessage());
            }
        }, 1000); // Wait 1 second for WebView to be ready
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
                // Validare parametri
                if (courseId == null || uit == null || authToken == null) {
                    Log.e(TAG, "Invalid parameters for GPS service");
                    return "ERROR: Invalid parameters";
                }
                
                // GPS permissions - start service if any location permission exists
                if (checkSelfPermission("android.permission.ACCESS_FINE_LOCATION") != PackageManager.PERMISSION_GRANTED &&
                    checkSelfPermission("android.permission.ACCESS_COARSE_LOCATION") != PackageManager.PERMISSION_GRANTED) {
                    Log.w(TAG, "No location permissions - continuing anyway");
                }

                Intent intent = new Intent(MainActivity.this, OptimalGPSService.class);
                intent.setAction("START_GPS");
                intent.putExtra("courseId", courseId);
                intent.putExtra("vehicleNumber", vehicleNumber);
                intent.putExtra("uit", uit);
                intent.putExtra("authToken", authToken);
                intent.putExtra("status", status);
                
                ComponentName result = startForegroundService(intent);
                if (result != null) {
                    Log.d(TAG, "✅ OptimalGPSService started successfully");
                    return "SUCCESS: GPS service started for course " + courseId;
                } else {
                    Log.e(TAG, "❌ Failed to start OptimalGPSService");
                    return "ERROR: Failed to start GPS service";
                }
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to start GPS service: " + e.getMessage(), e);
                return "ERROR: " + e.getMessage();
            }
        }
        
        @JavascriptInterface
        public String stopGPS(String courseId) {
            Log.d(TAG, "=== AndroidGPS.stopGPS called ===");
            Log.d(TAG, "Course ID: " + courseId);
            
            try {
                Intent intent = new Intent(MainActivity.this, OptimalGPSService.class);
                intent.setAction("STOP_GPS");
                intent.putExtra("courseId", courseId);
                
                startService(intent);
                Log.d(TAG, "✅ OptimalGPSService stop requested successfully");
                return "SUCCESS: GPS service stopped for course " + courseId;
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to stop GPS service: " + e.getMessage());
                return "ERROR: " + e.getMessage();
            }
        }
        
        @JavascriptInterface
        public String updateStatus(String courseId, int newStatus) {
            Log.d(TAG, String.format("=== AndroidGPS.updateStatus called ==="));
            Log.d(TAG, String.format("Course=%s, Status=%d", courseId, newStatus));
            
            try {
                Intent intent = new Intent(MainActivity.this, OptimalGPSService.class);
                intent.setAction("UPDATE_STATUS");
                intent.putExtra("courseId", courseId);
                intent.putExtra("status", newStatus);
                
                startService(intent);
                Log.d(TAG, "✅ OptimalGPSService status update successful");
                return "SUCCESS: Status updated for course " + courseId + " to " + newStatus;
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to update GPS status: " + e.getMessage());
                return "ERROR: " + e.getMessage();
            }
        }
        
        @JavascriptInterface
        public String clearAllOnLogout() {
            Log.d(TAG, "=== AndroidGPS.clearAllOnLogout called ===");
            
            try {
                Intent intent = new Intent(MainActivity.this, OptimalGPSService.class);
                intent.setAction("CLEAR_ALL");
                
                startService(intent);
                Log.d(TAG, "✅ OptimalGPSService clear all successful");
                return "SUCCESS: All GPS data cleared";
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to clear GPS data: " + e.getMessage());
                return "ERROR: " + e.getMessage();
            }
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        Log.d(TAG, "MainActivity onStart() - GPS Plugin ready");
    }

    @Override
    public void onStart() {
        super.onStart();
        Log.d(TAG, "MainActivity onStart() - GPS Plugin ready");
    }

    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG, "MainActivity onResume() - GPS Plugin available");
    }
}