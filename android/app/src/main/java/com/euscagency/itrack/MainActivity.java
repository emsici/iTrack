package com.euscagency.itrack;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Setup AndroidBridge for direct GPS service access
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.addJavascriptInterface(new AndroidBridge(this), "AndroidInterface");
            android.util.Log.d("MainActivity", "✅ AndroidBridge registered successfully");
            android.util.Log.d("MainActivity", "🎯 Direct GPS service access via window.AndroidInterface");
        }
        
        android.util.Log.d("MainActivity", "iTrack app initialized - EnhancedGPSService ready");
    }
}
