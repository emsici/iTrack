package com.euscagency.itrack;

import com.getcapacitor.BridgeActivity;
import com.itrack.gps.GpsTrackingPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Înregistrează plugin-ul GPS nativ
        registerPlugin(GpsTrackingPlugin.class);
    }
}
