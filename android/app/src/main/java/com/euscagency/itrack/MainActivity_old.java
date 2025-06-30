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
        try {
            WebView webView = getBridge().getWebView();
            Log.e(TAG, "📍 getBridge().getWebView() result: " + (webView == null ? "NULL" : "SUCCESS"));
            return webView;
        } catch (Exception e) {
            Log.e(TAG, "❌ Error getting WebView: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instance = this;
        
        // Register GPS plugin
        registerPlugin(GPSPlugin.class);
        
        Log.e(TAG, "🔧 MainActivity onCreate() - GPS plugin registered successfully");
    }

    @Override
    public void onStart() {
        super.onStart();
        Log.e(TAG, "🎯 MainActivity onStart() called");
    }
    
    @Override
    public void onResume() {
        super.onResume();
        Log.e(TAG, "🎯 MainActivity onResume() called - GPS Plugin ready");
        // GPS Plugin is automatically available via Capacitor registerPlugin()
        // No additional setup required
    }

    private void setupDirectGPSBridgeWithRetry(int attempt) {
        final int MAX_ATTEMPTS = 5;
        
        try {
            WebView webView = getWebView();
            Log.e(TAG, "📍 WebView null check: " + (webView == null ? "NULL" : "NOT NULL"));
            
            if (webView != null) {
                Log.e(TAG, "🔧 Adding DirectGPS interface to WebView - attempt " + (attempt + 1));
                
                // CRITICAL: Force WebView settings for interface exposure
                webView.getSettings().setJavaScriptEnabled(true);
                webView.getSettings().setDomStorageEnabled(true);
                
                // Add direct JavaScript interface for GPS methods
                webView.addJavascriptInterface(new DirectGPSInterface(), "DirectGPS");
                
                Log.e(TAG, "✅ DirectGPS interface added to WebView successfully");
                
                // MULTIPLE VERIFICATION STRATEGIES for interface exposure
                String jsCode = 
                    "setTimeout(function() {" +
                    "  console.log('🔧 DirectGPS DETAILED interface verification - attempt " + (attempt + 1) + "'); " +
                    "  console.log('🔍 window.DirectGPS exists:', typeof window.DirectGPS); " +
                    "  console.log('🔍 window.DirectGPS object:', window.DirectGPS); " +
                    "  if (window.DirectGPS) { " +
                    "    console.log('🔍 DirectGPS properties:', Object.getOwnPropertyNames(window.DirectGPS)); " +
                    "    console.log('🔍 DirectGPS methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.DirectGPS))); " +
                    "    console.log('🔍 startGPS type:', typeof window.DirectGPS.startGPS); " +
                    "    console.log('🔍 stopGPS type:', typeof window.DirectGPS.stopGPS); " +
                    "    console.log('🔍 updateGPS type:', typeof window.DirectGPS.updateGPS); " +
                    "    console.log('🔍 clearAllGPS type:', typeof window.DirectGPS.clearAllGPS); " +
                    "  } " +
                    "  try { " +
                    "    if (window.DirectGPS && window.DirectGPS.startGPS) { " +
                    "      console.log('✅ DirectGPS startGPS function AVAILABLE - interface WORKING'); " +
                    "      window.DirectGPSReady = true; " +
                    "      window.directGPSAvailable = true; " +
                    "    } else { " +
                    "      console.log('❌ DirectGPS startGPS NOT AVAILABLE - interface FAILED'); " +
                    "      console.log('🔧 Debugging - DirectGPS object details:', JSON.stringify(window.DirectGPS, null, 2)); " +
                    "    } " +
                    "  } catch (e) { " +
                    "    console.log('❌ DirectGPS verification error:', e.message); " +
                    "  } " +
                    "}, 1000);"; // Increased to 1 second for full interface attachment
                
                webView.evaluateJavascript(jsCode, null);
                
                Log.e(TAG, "✅ DirectGPS interface added successfully on attempt " + (attempt + 1));
                
                // Verify interface is actually available
                webView.evaluateJavascript("typeof window.DirectGPS", new android.webkit.ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String value) {
                        Log.e(TAG, "DirectGPS type check result: " + value);
                        if (!"\"object\"".equals(value) && !"\"undefined\"".equals(value)) {
                            Log.e(TAG, "✅ DirectGPS interface verified as available");
                        }
                    }
                });
                
            } else {
                Log.e(TAG, "❌ WebView not available for DirectGPS interface - attempt " + (attempt + 1));
                
                // Retry if we haven't reached max attempts
                if (attempt < MAX_ATTEMPTS - 1) {
                    Handler retryHandler = new Handler(Looper.getMainLooper());
                    retryHandler.postDelayed(new Runnable() {
                        @Override
                        public void run() {
                            setupDirectGPSBridgeWithRetry(attempt + 1);
                        }
                    }, 1000 * (attempt + 1)); // Increasing delay: 1s, 2s, 3s, 4s
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to setup DirectGPS interface on attempt " + (attempt + 1) + ": " + e.getMessage());
            e.printStackTrace();
            
            // Retry if we haven't reached max attempts
            if (attempt < MAX_ATTEMPTS - 1) {
                Handler retryHandler = new Handler(Looper.getMainLooper());
                retryHandler.postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        setupDirectGPSBridgeWithRetry(attempt + 1);
                    }
                }, 1000 * (attempt + 1));
            }
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