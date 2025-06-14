package com.gps.tracker;

import com.getcapacitor.BridgeActivity;
import com.euscagency.itrack.GPSTrackingPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register the native GPS tracking plugin
        registerPlugin(GPSTrackingPlugin.class);
    }
}
