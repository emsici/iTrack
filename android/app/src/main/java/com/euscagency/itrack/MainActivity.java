package com.euscagency.itrack;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register Simple GPS plugin for reliable Android GPS tracking
        registerPlugin(SimpleGPSPlugin.class);
        
        android.util.Log.d("MainActivity", "SimpleGPSPlugin registered successfully");
        android.util.Log.d("MainActivity", "Ready for GPS coordinate transmission every 60 seconds");
    }
}
