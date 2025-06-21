package com.euscagency.itrack;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;

import com.getcapacitor.BridgeActivity;
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
        public void startGPS(String courseId, String vehicleNumber, String uit, String authToken, int status) {
            Log.d(TAG, String.format("WebView GPS Start: Course=%s, UIT=%s, Status=%d", courseId, uit, status));
            
            Intent intent = new Intent(MainActivity.this, EnhancedGPSService.class);
            intent.setAction("START_TRACKING");
            intent.putExtra("courseId", courseId);
            intent.putExtra("vehicleNumber", vehicleNumber);
            intent.putExtra("uit", uit);
            intent.putExtra("authToken", authToken);
            intent.putExtra("status", status);
            
            startForegroundService(intent);
            Log.d(TAG, "EnhancedGPSService started via WebView interface");
        }
        
        @JavascriptInterface
        public void stopGPS(String courseId) {
            Log.d(TAG, "WebView GPS Stop: Course=" + courseId);
            
            Intent intent = new Intent(MainActivity.this, EnhancedGPSService.class);
            intent.setAction("STOP_TRACKING");
            intent.putExtra("courseId", courseId);
            
            startService(intent);
            Log.d(TAG, "EnhancedGPSService stop requested via WebView interface");
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