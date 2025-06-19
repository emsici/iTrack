package com.euscagency.itrack;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        android.util.Log.d("MainActivity", "iTrack app initialized");
        android.util.Log.d("MainActivity", "EnhancedGPSService ready for direct activation");
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
