package com.euscagency.itrack;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register Simple GPS plugin for background service
        registerPlugin(SimpleGPSPlugin.class);
        
        android.util.Log.d("MainActivity", "GPS Tracking Plugin registered for background service");
    }
}
