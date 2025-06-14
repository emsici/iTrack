package com.gps.tracker;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // GPS tracking handled by @capacitor-community/background-geolocation plugin
        android.util.Log.d("MainActivity", "iTrack app initialized");
    }
}
