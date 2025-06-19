package com.euscagency.itrack;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register Capacitor GPS wrapper plugin for native background service
        try {
            registerPlugin(CapacitorGPSPlugin.class);
            android.util.Log.d("MainActivity", "✅ CapacitorGPSPlugin registered successfully");
            android.util.Log.d("MainActivity", "📦 Package: com.euscagency.itrack");
            android.util.Log.d("MainActivity", "🔌 Plugin class: " + CapacitorGPSPlugin.class.getName());
            android.util.Log.d("MainActivity", "🚀 Ready for GPS transmission via EnhancedGPSService");
        } catch (Exception e) {
            android.util.Log.e("MainActivity", "❌ Failed to register CapacitorGPSPlugin", e);
        }
    }
}
