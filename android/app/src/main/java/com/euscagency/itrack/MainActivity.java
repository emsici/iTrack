package com.euscagency.itrack;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Add WebView interface for GPS control
        WebView webView = getBridge().getWebView();
        webView.addJavascriptInterface(new AndroidGPSInterface(), "AndroidGPS");
        
        android.util.Log.d("MainActivity", "iTrack app initialized with GPS interface");
        android.util.Log.d("MainActivity", "EnhancedGPSService ready for activation");
    }
    
    public class AndroidGPSInterface {
        @JavascriptInterface
        public void startGPS(String courseId, String vehicleNumber, String uit, String authToken, int status) {
            android.util.Log.d("AndroidGPS", "Starting GPS for course: " + courseId);
            android.util.Log.d("AndroidGPS", "Vehicle: " + vehicleNumber + ", UIT: " + uit);
            
            Intent broadcastIntent = new Intent(GPSBroadcastReceiver.ACTION_START_GPS);
            broadcastIntent.putExtra("courseId", courseId);
            broadcastIntent.putExtra("vehicleNumber", vehicleNumber);
            broadcastIntent.putExtra("uit", uit);
            broadcastIntent.putExtra("authToken", authToken);
            broadcastIntent.putExtra("status", status);
            
            sendBroadcast(broadcastIntent);
            
            android.util.Log.d("AndroidGPS", "GPS start broadcast sent successfully");
        }
        
        @JavascriptInterface
        public void stopGPS(String courseId) {
            android.util.Log.d("AndroidGPS", "Stopping GPS for course: " + courseId);
            
            Intent broadcastIntent = new Intent(GPSBroadcastReceiver.ACTION_STOP_GPS);
            broadcastIntent.putExtra("courseId", courseId);
            
            sendBroadcast(broadcastIntent);
            
            android.util.Log.d("AndroidGPS", "GPS stop broadcast sent successfully");
        }
    }
    
    // Metoda publică pentru activarea GPS din JavaScript prin evaluateJavaScript
    public void startGPS(String courseId, String vehicleNumber, String uit, String authToken, int status) {
        android.util.Log.d("MainActivity", "Starting GPS through direct method call");
        
        Intent broadcastIntent = new Intent(GPSBroadcastReceiver.ACTION_START_GPS);
        broadcastIntent.putExtra("courseId", courseId);
        broadcastIntent.putExtra("vehicleNumber", vehicleNumber);
        broadcastIntent.putExtra("uit", uit);
        broadcastIntent.putExtra("authToken", authToken);
        broadcastIntent.putExtra("status", status);
        
        sendBroadcast(broadcastIntent);
        
        android.util.Log.d("MainActivity", "GPS start broadcast sent for course: " + courseId);
    }
    
    public void stopGPS(String courseId) {
        android.util.Log.d("MainActivity", "Stopping GPS through direct method call");
        
        Intent broadcastIntent = new Intent(GPSBroadcastReceiver.ACTION_STOP_GPS);
        broadcastIntent.putExtra("courseId", courseId);
        
        sendBroadcast(broadcastIntent);
        
        android.util.Log.d("MainActivity", "GPS stop broadcast sent for course: " + courseId);
    }
    
    public void startGPSTracking(String courseId, String vehicleNumber, String uit, String authToken, int status) {
        android.util.Log.d("MainActivity", "Starting GPS for course: " + courseId);
        
        Intent serviceIntent = new Intent(this, EnhancedGPSService.class);
        serviceIntent.putExtra("action", "START_TRACKING");
        serviceIntent.putExtra("courseId", courseId);
        serviceIntent.putExtra("vehicleNumber", vehicleNumber);
        serviceIntent.putExtra("uit", uit);
        serviceIntent.putExtra("authToken", authToken);
        serviceIntent.putExtra("status", status);
        
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
        
        android.util.Log.d("MainActivity", "EnhancedGPSService started directly");
    }
    
    public void stopGPSTracking(String courseId) {
        android.util.Log.d("MainActivity", "Stopping GPS for course: " + courseId);
        
        Intent serviceIntent = new Intent(this, EnhancedGPSService.class);
        serviceIntent.putExtra("action", "STOP_TRACKING");
        serviceIntent.putExtra("courseId", courseId);
        
        startService(serviceIntent);
        
        android.util.Log.d("MainActivity", "GPS stop command sent");
    }
}
