package com.euscagency.itrack;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register DirectGPS plugin for background-independent operation
        registerPlugin(DirectGPSPlugin.class);
        
        android.util.Log.d("MainActivity", "iTrack app initialized with DirectGPS plugin");
        android.util.Log.d("MainActivity", "EnhancedGPSService ready for background activation");
    }
    

}
