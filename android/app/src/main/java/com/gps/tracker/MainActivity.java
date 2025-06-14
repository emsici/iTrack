package com.gps.tracker;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.euscagency.itrack.GPSTrackingPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register native GPS tracking plugin for GPSForegroundService
        registerPlugin(GPSTrackingPlugin.class);
        
        android.util.Log.d("MainActivity", "GPS Tracking Plugin registered");
    }
}
