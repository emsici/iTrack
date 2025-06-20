package com.euscagency.itrack;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import androidx.core.content.ContextCompat;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register DirectGPS plugin for background operation
        registerPlugin(DirectGPSPlugin.class);
        
        // Add WebView interface as backup for GPS control
        WebView webView = getBridge().getWebView();
        webView.addJavascriptInterface(new GPSInterface(), "AndroidGPS");
        
        android.util.Log.d("MainActivity", "iTrack app initialized with DirectGPS plugin + WebView backup");
        android.util.Log.d("MainActivity", "EnhancedGPSService ready for background activation");
    }
    
    public class GPSInterface {
        @JavascriptInterface
        public void startGPS(String courseId, String vehicleNumber, String uit, String authToken, int status) {
            android.util.Log.d("AndroidGPS", "WebView GPS start for course: " + courseId);
            startGPSTracking(courseId, vehicleNumber, uit, authToken, status);
        }
        
        @JavascriptInterface
        public void stopGPS(String courseId) {
            android.util.Log.d("AndroidGPS", "WebView GPS stop for course: " + courseId);
            stopGPSTracking(courseId);
        }
    }
    
    // Direct methods for GPS control if plugin registration fails
    public void startGPSTracking(String courseId, String vehicleNumber, String uit, String authToken, int status) {
        android.util.Log.d("MainActivity", "Direct GPS start for course: " + courseId);
        
        Intent serviceIntent = new Intent(this, EnhancedGPSService.class);
        serviceIntent.putExtra("action", "START_TRACKING");
        serviceIntent.putExtra("courseId", courseId);
        serviceIntent.putExtra("vehicleNumber", vehicleNumber);
        serviceIntent.putExtra("uit", uit);
        serviceIntent.putExtra("authToken", authToken);
        serviceIntent.putExtra("status", status);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ContextCompat.startForegroundService(this, serviceIntent);
        } else {
            startService(serviceIntent);
        }
        
        android.util.Log.d("MainActivity", "EnhancedGPSService started directly");
    }
    
    public void stopGPSTracking(String courseId) {
        android.util.Log.d("MainActivity", "Direct GPS stop for course: " + courseId);
        
        Intent serviceIntent = new Intent(this, EnhancedGPSService.class);
        serviceIntent.putExtra("action", "STOP_TRACKING");
        serviceIntent.putExtra("courseId", courseId);
        
        startService(serviceIntent);
        
        android.util.Log.d("MainActivity", "GPS stop command sent");
    }
}
