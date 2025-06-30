package com.euscagency.itrack;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

/**
 * MainActivity for iTrack GPS Application
 * Uses GPS Capacitor Plugin (GPSPlugin.java) for native GPS operations
 * No WebView JavaScript interface needed - all GPS handled by Capacitor Plugin
 */
public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private static MainActivity instance;

    public static MainActivity getInstance() {
        return instance;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instance = this;
        
        // Register GPS plugin for Capacitor communication
        registerPlugin(GPSPlugin.class);
        
        Log.d(TAG, "✅ MainActivity initialized - GPS Plugin registered");
    }

    @Override
    public void onStart() {
        super.onStart();
        Log.d(TAG, "MainActivity onStart() - GPS Plugin ready");
    }

    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG, "MainActivity onResume() - GPS Plugin available");
    }
}