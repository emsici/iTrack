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
    private static final String TAG = "iTrackMainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // DirectGPS plugin eliminat - folosim doar WebView interface pentru stabilitate
        // Plugin-ul DirectGPS cauza probleme de compilare
        
        // Add AndroidGPS interface to WebView for JavaScript access
        try {
            AndroidGPS androidGPSInterface = new AndroidGPS();
            getBridge().getWebView().addJavascriptInterface(androidGPSInterface, "AndroidGPS");
            Log.d(TAG, "✅ AndroidGPS WebView interface added successfully");
            Log.d(TAG, "AndroidGPS interface methods available:");
            Log.d(TAG, "- startGPS: available");
            Log.d(TAG, "- stopGPS: available");
            Log.d(TAG, "- updateStatus: available");
            Log.d(TAG, "- clearAllOnLogout: available");
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to add AndroidGPS interface: " + e.getMessage(), e);
        }
        
        Log.d(TAG, "iTrack MainActivity initialized with WebView GPS interface");
        
        // Eliminat auto-test care poate cauza crash-uri
        // Auto-test dezactivat pentru stabilitate
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
                
                Log.d(TAG, "Starting GPS service...");
                
                Intent intent = new Intent(MainActivity.this, SimpleGPSService.class);
                intent.setAction("START_TRACKING");
                intent.putExtra("courseId", courseId);
                intent.putExtra("vehicleNumber", vehicleNumber);
                intent.putExtra("uit", uit);
                intent.putExtra("authToken", authToken);
                intent.putExtra("status", status);
                
                try {
                    ComponentName result = startForegroundService(intent);
                    if (result != null) {
                        Log.d(TAG, "✅ SimpleGPSService started successfully via WebView interface");
                        Log.d(TAG, "Service component: " + result.getClassName());
                        return "SUCCESS: GPS service started for course " + courseId;
                    } else {
                        Log.e(TAG, "Failed to start GPS service - result is null");
                        return "ERROR: Service start failed";
                    }
                } catch (SecurityException e) {
                    Log.e(TAG, "Security exception starting GPS service: " + e.getMessage());
                    return "ERROR: Security exception - " + e.getMessage();
                } catch (Exception e) {
                    Log.e(TAG, "Exception starting GPS service: " + e.getMessage());
                    return "ERROR: Exception - " + e.getMessage();
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
                Intent intent = new Intent(MainActivity.this, SimpleGPSService.class);
                intent.setAction("STOP_TRACKING");
                intent.putExtra("courseId", courseId);
                
                startService(intent);
                Log.d(TAG, "✅ SimpleGPSService stop requested successfully");
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
                Intent intent = new Intent(MainActivity.this, SimpleGPSService.class);
                intent.setAction("UPDATE_STATUS");
                intent.putExtra("courseId", courseId);
                intent.putExtra("status", newStatus);
                
                startService(intent);
                Log.d(TAG, "✅ SimpleGPSService status update successful");
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
                Intent intent = new Intent(MainActivity.this, SimpleGPSService.class);
                intent.setAction("CLEAR_ALL");
                
                startService(intent);
                Log.d(TAG, "✅ SimpleGPSService clear all successful");
                return "SUCCESS: All GPS data cleared";
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to clear GPS data: " + e.getMessage());
                return "ERROR: " + e.getMessage();
            }
        }
    }
}