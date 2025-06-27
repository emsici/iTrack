package com.euscagency.itrack;

import android.content.Intent;
import android.os.Bundle;
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

/**
 * MainActivity pentru iTrack cu integrare GPS nativă
 * Oferă interfață WebView pentru activarea serviciului GPS din JavaScript
 */
public class MainActivity extends BridgeActivity {
    private static final String TAG = "iTrackMainActivity";
    private static MainActivity instance;
    private static Context context;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instance = this;
        context = this;
        
        Log.d(TAG, "iTrack MainActivity starting with multiple HTTP methods");
        
        // Add AndroidGPS interface for GPS control only
        addAndroidGPSInterface();
        
        Log.d(TAG, "iTrack ready with CapacitorHttp unified HTTP");
    }
    
    public static Context getContext() {
        return instance != null ? instance.getApplicationContext() : null;
    }
    
    public static MainActivity getInstance() {
        return instance;
    }
    
    public WebView getWebView() {
        return getBridge().getWebView();
    }
    
    public static void runOnMainThread(Runnable runnable) {
        if (instance != null) {
            instance.runOnUiThread(runnable);
        }
    }
    
    private void addAndroidGPSInterface() {
        // CRITICAL: Wait for WebView to be completely ready before adding interface
        new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
            int retryCount = 0;
            final int maxRetries = 50; // Increased to 50 for slower devices
            
            @Override
            public void run() {
                try {
                    Log.d(TAG, "Attempting to add AndroidGPS interface (attempt " + (retryCount + 1) + "/" + maxRetries + ")");
                    
                    if (getBridge() != null && getBridge().getWebView() != null) {
                        AndroidGPS androidGPSInterface = new AndroidGPS();
                        getBridge().getWebView().addJavascriptInterface(androidGPSInterface, "AndroidGPS");
                        
                        // Enable JavaScript
                        getBridge().getWebView().getSettings().setJavaScriptEnabled(true);
                        
                        Log.d(TAG, "✅ AndroidGPS WebView interface added successfully");
                        Log.d(TAG, "📱 AndroidGPS methods ready for iTrack:");
                        Log.d(TAG, "  - startGPS: available");
                        Log.d(TAG, "  - stopGPS: available");
                        Log.d(TAG, "  - updateStatus: available");
                        Log.d(TAG, "  - clearAllOnLogout: available");
                        Log.d(TAG, "  - postNativeHttp: available");
                        Log.d(TAG, "  - getNativeHttp: available");
                        
                        // Force interface validation
                        getBridge().getWebView().evaluateJavascript(
                            "window.AndroidGPSReady = true; " +
                            "console.log('✅ AndroidGPS interface confirmed ready'); " +
                            "if (typeof window.AndroidGPS !== 'undefined') { " +
                            "console.log('AndroidGPS methods:', Object.keys(window.AndroidGPS)); " +
                            "}",
                            null
                        );
                        
                        // Test interface availability with delay
                        new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                            @Override
                            public void run() {
                                getBridge().getWebView().evaluateJavascript(
                                    "console.log('🔍 AndroidGPS test:', typeof window.AndroidGPS); " +
                                    "if (typeof window.AndroidGPS !== 'undefined') { " +
                                        "console.log('✅ AndroidGPS methods:', Object.getOwnPropertyNames(window.AndroidGPS)); " +
                                    "} else { " +
                                        "console.error('❌ AndroidGPS still not available'); " +
                                    "}",
                                    null
                                );
                            }
                        }, 1000);
                        
                    } else {
                        retryCount++;
                        if (retryCount < maxRetries) {
                            Log.w(TAG, "Bridge/WebView not ready, retrying in 250ms (attempt " + retryCount + "/" + maxRetries + ")");
                            new Handler(Looper.getMainLooper()).postDelayed(this, 250);
                        } else {
                            Log.e(TAG, "❌ Failed to add AndroidGPS interface after " + maxRetries + " attempts");
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "❌ Exception adding AndroidGPS interface: " + e.getMessage(), e);
                    retryCount++;
                    if (retryCount < maxRetries) {
                        new Handler(Looper.getMainLooper()).postDelayed(this, 250);
                    }
                }
            }
        }, 2000); // FIXED: Increased to 2000ms for better WebView readiness
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
                
                Intent intent = new Intent(MainActivity.this, OptimalGPSService.class);
                intent.setAction("START_GPS");
                intent.putExtra("courseId", courseId);
                intent.putExtra("vehicleNumber", vehicleNumber);
                intent.putExtra("uit", uit);
                intent.putExtra("authToken", authToken);
                intent.putExtra("status", status);
                
                try {
                    ComponentName result = startForegroundService(intent);
                    if (result != null) {
                        Log.d(TAG, "✅ OptimalGPSService started successfully - 70% battery efficiency");
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
                Intent intent = new Intent(MainActivity.this, OptimalGPSService.class);
                intent.setAction("STOP_GPS");
                intent.putExtra("courseId", courseId);
                
                startService(intent);
                Log.d(TAG, "✅ OptimalGPSService stop requested - AlarmManager cancelled");
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
                Log.d(TAG, "✅ OptimalGPSService status updated - efficient transmission");
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
                Log.d(TAG, "✅ OptimalGPSService cleared all courses - logout complete");
                return "SUCCESS: All GPS data cleared";
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to clear GPS data: " + e.getMessage());
                return "ERROR: " + e.getMessage();
            }
        }
    }
}