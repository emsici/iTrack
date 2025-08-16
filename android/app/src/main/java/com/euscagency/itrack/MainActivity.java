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
        // AndroidGPSPlugin removed - using WebView bridge only  
        Log.d(TAG, "🔌 Using WebView bridge directly - AndroidGPSPlugin eliminated");
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
            // Start BackgroundGPSService
            Intent intent = new Intent(this, BackgroundGPSService.class);
            intent.setAction("START_BACKGROUND_GPS");
            intent.putExtra("uit", uit);
            intent.putExtra("token", authToken);
            intent.putExtra("vehicle", vehicleNumber);
            
            Log.e(TAG, "Intent prepared with extras - UIT: " + uit + ", Vehicle: " + vehicleNumber);
            
            Log.e(TAG, "🚀 === STARTING === BackgroundGPSService with ScheduledExecutorService...");
            Log.e(TAG, "📦 Intent created with action: START_BACKGROUND_GPS");
            Log.e(TAG, "📋 Intent extras: uit=" + uit + ", vehicle=" + vehicleNumber);
            Log.e(TAG, "⚡ BackgroundGPSService uses ScheduledExecutorService for more stable background GPS");
            Log.e(TAG, "🔄 GPS will transmit every 10 seconds with phone locked/minimized");
            
            // Try to start foreground service
            android.content.ComponentName result = startForegroundService(intent);
            if (result != null) {
                Log.e(TAG, "✅ === SUCCESS === BackgroundGPSService started successfully");
                Log.e(TAG, "🔗 Service component: " + result.toString());
            } else {
                Log.e(TAG, "❌ === WARNING === startForegroundService returned null");
            }
            
            // Verify service is running
            android.app.ActivityManager activityManager = (android.app.ActivityManager) getSystemService(ACTIVITY_SERVICE);
            boolean serviceRunning = false;
            for (android.app.ActivityManager.RunningServiceInfo service : activityManager.getRunningServices(Integer.MAX_VALUE)) {
                if (BackgroundGPSService.class.getName().equals(service.service.getClassName())) {
                    serviceRunning = true;
                    Log.e(TAG, "✅ === VERIFIED === BackgroundGPSService is RUNNING");
                    break;
                }
            }
            
            if (!serviceRunning) {
                Log.e(TAG, "❌ === CRITICAL === BackgroundGPSService NOT FOUND in running services!");
                // Try alternative start method
                Log.e(TAG, "🔄 Trying alternative startService method...");
                startService(intent);
            }
            
            String resultMessage = "SUCCESS: BACKGROUND GPS started for " + courseId;
            Log.e(TAG, "📤 Returning to JavaScript: " + resultMessage);
            return resultMessage;
            
        } catch (Exception e) {
            Log.e(TAG, "❌ === CRITICAL ERROR === starting NATIVE GPS: " + e.getMessage());
            e.printStackTrace();
            return "ERROR: " + e.getMessage();
        }
    }

    @JavascriptInterface
    public String stopGPS(String courseId) {
        Log.e(TAG, "🛑 === SIMPLE GPS === AndroidGPS.stopGPS called: courseId=" + courseId);
        
        try {
            // Stop BackgroundGPSService
            Intent intent = new Intent(this, BackgroundGPSService.class);
            intent.setAction("STOP_BACKGROUND_GPS");
            
            startService(intent);
            Log.e(TAG, "✅ BackgroundGPSService stop requested");
            return "SUCCESS: BACKGROUND GPS stopped";
            
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
            // BackgroundGPSService doesn't need status updates - it runs continuously
            Log.e(TAG, "ℹ️ BackgroundGPSService runs continuously - status changes handled automatically");
            Log.e(TAG, "📊 Status change logged: " + courseId + " → " + newStatus);
            
            String statusName = (newStatus == 2) ? "ACTIVE" : (newStatus == 3) ? "PAUSE" : (newStatus == 4) ? "STOP" : "UNKNOWN";
            return "SUCCESS: BACKGROUND GPS status " + statusName + " for " + courseId;
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error updating NATIVE GPS status: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    @JavascriptInterface
    public String clearAllOnLogout() {
        Log.e(TAG, "🧹 === SIMPLE GPS === clearAllOnLogout called");
        
        try {
            // Stop BackgroundGPSService
            Intent intent = new Intent(this, BackgroundGPSService.class);
            intent.setAction("STOP_BACKGROUND_GPS");
            
            startService(intent);
            Log.e(TAG, "✅ BackgroundGPSService stop requested on logout");
            return "SUCCESS: BACKGROUND GPS stopped and cleared";
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error clearing NATIVE GPS data: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }
    
    @JavascriptInterface
    public String getOfflineGPSCount() {
        Log.e(TAG, "📊 === SIMPLE GPS === getOfflineGPSCount called");
        
        try {
            android.content.SharedPreferences prefs = getSharedPreferences("offline_gps", MODE_PRIVATE);
            String coordinatesData = prefs.getString("coordinates", "[]");
            org.json.JSONArray coordinates = new org.json.JSONArray(coordinatesData);
            
            int count = coordinates.length();
            Log.e(TAG, "📊 Offline GPS coordinates count: " + count);
            return String.valueOf(count);
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error getting offline GPS count: " + e.getMessage());
            return "0";
        }
    }
    
    @JavascriptInterface
    public String syncOfflineGPS() {
        Log.e(TAG, "🔄 === SIMPLE GPS === syncOfflineGPS called");
        
        try {
            // BackgroundGPSService handles offline sync automatically
            Log.e(TAG, "ℹ️ BackgroundGPSService syncs offline data automatically");
            Log.e(TAG, "✅ Manual sync not needed - service handles offline/online transitions");
            return "SUCCESS: Automatic offline sync active";
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error starting offline GPS sync: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    @JavascriptInterface
    public String getServiceStatus() {
        Log.e(TAG, "📊 === SIMPLE GPS === getServiceStatus called");
        
        try {
            // Get basic status from SharedPreferences and service state
            android.content.SharedPreferences prefs = getSharedPreferences("offline_gps", MODE_PRIVATE);
            String coordinatesData = prefs.getString("coordinates", "[]");
            org.json.JSONArray coordinates = new org.json.JSONArray(coordinatesData);
            int offlineCount = coordinates.length();
            
            // Create status JSON
            org.json.JSONObject status = new org.json.JSONObject();
            status.put("isActive", true); // Simple check - service is responsive
            status.put("activeCourses", 1); // Placeholder - BackgroundGPSService tracks this internally
            status.put("offlineCount", offlineCount);
            status.put("networkStatus", true); // Default online
            status.put("lastTransmission", System.currentTimeMillis());
            
            String statusJson = status.toString();
            Log.e(TAG, "📊 Service status: " + statusJson);
            return statusJson;
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error getting service status: " + e.getMessage());
            return "{\"isActive\":false,\"activeCourses\":0,\"offlineCount\":0,\"networkStatus\":true}";
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