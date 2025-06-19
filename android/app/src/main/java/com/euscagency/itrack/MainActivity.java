package com.euscagency.itrack;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register GPS Tracking plugin for native background service
        registerPlugin(GPSTrackingPlugin.class);
        
        android.util.Log.d("MainActivity", "GPSTrackingPlugin registered for native background GPS service");
    }
}
