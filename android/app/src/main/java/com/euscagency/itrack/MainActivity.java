package com.euscagency.itrack;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import android.content.ComponentName;
import android.content.Intent;
import android.content.Context;
import android.app.ActivityManager;
import android.os.Handler;
import android.os.Looper;
import android.content.pm.PackageManager;
// EnhancedGPSService is now in the same package

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private static MainActivity instance;
    
    public static MainActivity getInstance() {
        return instance;
    }
    
    public WebView getWebView() {
        return getBridge().getWebView();
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instance = this;
        
        Log.e(TAG, "🔧 Starting GPS Plugin setup...");
        
        // Register native GPS plugin
        registerPlugin(GPSPlugin.class);
        
        Log.e(TAG, "🎯 MainActivity onCreate() completed - Native GPS Plugin registered");
    }

    // GPS Plugin is now registered - no manual bridge setup needed

    public void runOnMainThread(Runnable runnable) {
        runOnUiThread(runnable);
    }

    // All GPS methods moved to GPSPlugin.java - much more reliable
}