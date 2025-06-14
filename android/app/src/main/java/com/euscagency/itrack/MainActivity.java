package com.euscagency.itrack;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.euscagency.itrack.SimpleGPSPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register simplified GPS tracking plugin for reliable operation
        registerPlugin(SimpleGPSPlugin.class);
        
        android.util.Log.d("MainActivity", "Simple GPS Plugin registered successfully");
    }
}
