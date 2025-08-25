package com.euscagency.itrack;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Plugin pentru gestionarea permisiunilor background location și battery optimization
 * Asigură compliance cu Android 10+ și Play Store policies
 */
@CapacitorPlugin(name = "PermissionsHelper")
public class PermissionsHelper extends Plugin {
    
    private static final String TAG = "PermissionsHelper";
    private static final int REQUEST_CODE_BACKGROUND_LOCATION = 1001;
    private static final int REQUEST_CODE_BATTERY_OPTIMIZATION = 1002;
    
    @PluginMethod
    public void checkBackgroundLocation(PluginCall call) {
        Context context = getContext();
        String status = "unknown";
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Android 10+ necesită ACCESS_BACKGROUND_LOCATION explicit
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_BACKGROUND_LOCATION) 
                == PackageManager.PERMISSION_GRANTED) {
                status = "granted";
            } else if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) 
                == PackageManager.PERMISSION_GRANTED) {
                status = "prompt"; // Avem location dar nu background
            } else {
                status = "denied";
            }
        } else {
            // Android 9 și mai vechi - background location implicit cu ACCESS_FINE_LOCATION
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) 
                == PackageManager.PERMISSION_GRANTED) {
                status = "granted";
            } else {
                status = "denied";
            }
        }
        
        JSObject result = new JSObject();
        result.put("status", status);
        call.resolve(result);
    }
    
    @PluginMethod
    public void requestBackgroundLocation(PluginCall call) {
        Activity activity = getActivity();
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Pentru Android 10+, solicită ACCESS_BACKGROUND_LOCATION
            if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) 
                != PackageManager.PERMISSION_GRANTED) {
                // Trebuie să avem mai întâi ACCESS_FINE_LOCATION
                JSObject result = new JSObject();
                result.put("status", "need_basic_location_first");
                call.resolve(result);
                return;
            }
            
            // Bridge pentru solicitarea permisiunii background
            this.bridge.saveCall(call, "permissions_request");
            ActivityCompat.requestPermissions(activity, 
                new String[]{Manifest.permission.ACCESS_BACKGROUND_LOCATION}, 
                REQUEST_CODE_BACKGROUND_LOCATION);
        } else {
            // Android 9 și mai vechi - background location implicit
            JSObject result = new JSObject();
            result.put("status", "granted");
            call.resolve(result);
        }
    }
    
    @PluginMethod
    public void isIgnoringBatteryOptimizations(PluginCall call) {
        Context context = getContext();
        boolean isIgnoring = false;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                isIgnoring = pm.isIgnoringBatteryOptimizations(context.getPackageName());
            }
        } else {
            // Versiuni mai vechi nu au battery optimization
            isIgnoring = true;
        }
        
        JSObject result = new JSObject();
        result.put("isIgnoring", isIgnoring);
        call.resolve(result);
    }
    
    @PluginMethod
    public void requestIgnoreBatteryOptimizations(PluginCall call) {
        Context context = getContext();
        Activity activity = getActivity();
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null && !pm.isIgnoringBatteryOptimizations(context.getPackageName())) {
                // Deschide setările pentru battery optimization
                Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + context.getPackageName()));
                
                try {
                    this.bridge.saveCall(call, "background_location_request");
                    activity.startActivityForResult(intent, REQUEST_CODE_BATTERY_OPTIMIZATION);
                } catch (Exception e) {
                    // Fallback la setările generale de baterie
                    Intent fallbackIntent = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                    try {
                        activity.startActivity(fallbackIntent);
                        JSObject result = new JSObject();
                        result.put("success", true);
                        result.put("manual", true);
                        call.resolve(result);
                    } catch (Exception e2) {
                        call.reject("Nu s-au putut deschide setările de baterie", e2);
                    }
                }
            } else {
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("alreadyWhitelisted", true);
                call.resolve(result);
            }
        } else {
            // Versiuni mai vechi nu necesită whitelist
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        }
    }
    
    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        
        PluginCall savedCall = bridge.getSavedCall("background_location_request");
        if (savedCall == null) return;
        
        if (requestCode == REQUEST_CODE_BACKGROUND_LOCATION) {
            // Verifică din nou statusul după solicitare
            String status = "denied";
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_BACKGROUND_LOCATION) 
                    == PackageManager.PERMISSION_GRANTED) {
                    status = "granted";
                }
            }
            
            JSObject result = new JSObject();
            result.put("status", status);
            savedCall.resolve(result);
            
        } else if (requestCode == REQUEST_CODE_BATTERY_OPTIMIZATION) {
            // Verifică statusul battery optimization
            boolean isIgnoring = false;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
                if (pm != null) {
                    isIgnoring = pm.isIgnoringBatteryOptimizations(getContext().getPackageName());
                }
            }
            
            JSObject result = new JSObject();
            result.put("success", isIgnoring);
            savedCall.resolve(result);
        }
    }
    
    @Override
    protected void handleRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.handleRequestPermissionsResult(requestCode, permissions, grantResults);
        
        PluginCall savedCall = bridge.getSavedCall("permissions_request");
        if (savedCall == null) return;
        
        if (requestCode == REQUEST_CODE_BACKGROUND_LOCATION) {
            String status = "denied";
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                status = "granted";
            }
            
            JSObject result = new JSObject();
            result.put("status", status);
            savedCall.resolve(result);
        }
    }
}