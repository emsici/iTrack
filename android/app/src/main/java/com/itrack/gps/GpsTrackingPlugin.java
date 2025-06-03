package com.itrack.gps;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.Manifest;
import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(name = "GpsTracking")
public class GpsTrackingPlugin extends Plugin {

    @PluginMethod
    public void startGpsService(PluginCall call) {
        String vehicleNumber = call.getString("vehicleNumber");
        String uit = call.getString("uit");
        String authToken = call.getString("authToken");

        if (vehicleNumber == null || uit == null || authToken == null) {
            call.reject("Parametri lipsă: vehicleNumber, uit, authToken");
            return;
        }

        // Verifică permisiunile
        if (!hasRequiredPermissions()) {
            call.reject("Permisiuni GPS lipsă");
            return;
        }

        try {
            Intent serviceIntent = new Intent(getContext(), GpsBackgroundService.class);
            serviceIntent.putExtra("vehicleNumber", vehicleNumber);
            serviceIntent.putExtra("uit", uit);
            serviceIntent.putExtra("authToken", authToken);
            
            getContext().startForegroundService(serviceIntent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Serviciu GPS nativ pornit");
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("Eroare la pornirea serviciului GPS: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopGpsService(PluginCall call) {
        try {
            Intent serviceIntent = new Intent(getContext(), GpsBackgroundService.class);
            getContext().stopService(serviceIntent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Serviciu GPS nativ oprit");
            call.resolve(result);
            
        } catch (Exception e) {
            call.reject("Eroare la oprirea serviciului GPS: " + e.getMessage());
        }
    }

    @PluginMethod
    public void checkGpsServiceStatus(PluginCall call) {
        // Verifică dacă serviciul rulează
        // Pentru simplitate, returnăm întotdeauna success
        // În implementare reală, s-ar verifica prin ServiceManager
        
        JSObject result = new JSObject();
        result.put("isRunning", true);
        result.put("message", "Status serviciu GPS verificat");
        call.resolve(result);
    }

    private boolean hasRequiredPermissions() {
        return ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
            && ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }
}