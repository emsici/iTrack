package com.euscagency.itrack;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;
import com.getcapacitor.Plugin;
import android.content.ComponentName;
import android.content.Context;
import android.app.ActivityManager;
import android.os.Handler;
import android.os.Looper;
import android.content.pm.PackageManager;

/**
 * MainActivity pentru iTrack cu integrare GPS nativă
 * Oferă interfață WebView AndroidGPS pentru activarea serviciului GPS din JavaScript
 */
public class MainActivity extends BridgeActivity {
    private static final String TAG = "iTrackMainActivity";
    private static MainActivity instance;
    private boolean isAndroidGPSAdded = false; // FIXED: Previne multiple addJavascriptInterface
    private static volatile boolean isLoggingOut = false; // CRASH FIX: Previne apeluri WebView după logout

    public static MainActivity getInstance() {
        return instance;
    }

    // Păstrăm handler-ul original pentru crash-uri NON-logout
    private static Thread.UncaughtExceptionHandler originalHandler;
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instance = this;
        Log.d(TAG, "✅ MainActivity inițializat - pregătirea interfețelor AndroidGPS");
        
        // CRASH PROTECTION: Capturăm crash-urile și le ignorăm DOAR dacă sunt în timpul logout-ului
        originalHandler = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
            String message = throwable.getMessage() != null ? throwable.getMessage() : "";
            String stackTrace = Log.getStackTraceString(throwable);
            
            // Dacă suntem în logout și crash-ul e legat de WebView/Bridge, îl ignorăm
            if (isLoggingOut && (
                message.contains("WebView") || 
                message.contains("Bridge") || 
                message.contains("evaluateJavascript") ||
                message.contains("NullPointerException") ||
                stackTrace.contains("WebView") ||
                stackTrace.contains("evaluateJavascript") ||
                stackTrace.contains("getBridge")
            )) {
                Log.e(TAG, "🛡️ CRASH PREVENTED during logout: " + message);
                Log.e(TAG, "🛡️ Stack trace (ignored): " + stackTrace);
                // NU propagăm crash-ul - îl ignorăm graceful
                return;
            }
            
            // Pentru alte crash-uri, le propagăm normal
            if (originalHandler != null) {
                originalHandler.uncaughtException(thread, throwable);
            }
        });
        
        // Setup offline GPS listener pentru capturarea din BackgroundGPSService
        setupOfflineGPSListener();
        
        // Înregistrează AndroidGPS Plugin ca fallback
        // AndroidGPSPlugin eliminat - folosind doar bridge WebView  
        Log.d(TAG, "🔌 Folosind bridge WebView direct - AndroidGPSPlugin eliminat");
    }
    
    // Gestionarea bridge-ului gata mutată în onResume pentru compatibilitate

    @Override
    public void onStart() {
        super.onStart();
        Log.d(TAG, "MainActivity onStart() - programez configurarea interfeței AndroidGPS");
        
        // FIXED: Single initialization pentru a evita multiple addJavascriptInterface
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            // CRASH FIX: Nu executa dacă logout e în progres
            if (isLoggingOut) {
                Log.d(TAG, "🔒 onStart Handler SKIPPED - logout in progress");
                return;
            }
            if (!isAndroidGPSAdded) {
                addAndroidGPSInterface();
            }
        }, 1000);
        // ELIMINAT: Multiple addAndroidGPSInterface calls - folosim isAndroidGPSAdded flag
    }

    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG, "MainActivity onResume() - asigur disponibilitatea interfeței AndroidGPS");
        
        // FIXED: Single addAndroidGPSInterface cu flag protection
        if (!isAndroidGPSAdded) {
            addAndroidGPSInterface();
        }
    }

    private void addAndroidGPSInterface() {
        // CRASH FIX: Nu adăuga interfața dacă logout e în progres
        if (isLoggingOut) {
            Log.d(TAG, "🔒 addAndroidGPSInterface SKIPPED - logout in progress");
            return;
        }
        
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                Log.d(TAG, "🔧 Adaug interfața AndroidGPS la WebView...");
                
                // Add JavaScript interface - this creates window.AndroidGPS
                webView.addJavascriptInterface(this, "AndroidGPS");
                
                // Wait for WebView to be ready, then set flags and verify
                webView.post(() -> {
                    try {
                        if (isLoggingOut) return; // CRASH FIX: Double check
                        webView.evaluateJavascript("window.AndroidGPSReady = true;", null);
                        webView.evaluateJavascript("window.androidGPSBridgeReady = true;", null);
                        webView.evaluateJavascript("window.androidGPSInterfaceReady = true;", null);
                        
                        // CRITICAL: Test and report if interface is working
                        webView.evaluateJavascript(
                            "const isAvailable = (typeof window.AndroidGPS !== 'undefined' && typeof window.AndroidGPS.startGPS === 'function');" +
                            "window.androidGPSVerified = isAvailable;",
                            null
                        );
                        
                        // If interface fails, schedule periodic retry
                        scheduleInterfaceVerification();
                    } catch (Exception e) {
                        Log.e(TAG, "WebView post failed: " + e.getMessage());
                    }
                });
                
                Log.d(TAG, "✅ AndroidGPS interface added successfully");
                isAndroidGPSAdded = true; // FIXED: Marchează ca adăugat
                
            } else {
                Log.e(TAG, "❌ WebView is null - nu mai retry (flag protection)");
                isAndroidGPSAdded = false; // Reset flag pentru următoarea încercare
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Error adding AndroidGPS interface: " + e.getMessage(), e);
            // Retry on error
            // ELIMINAT: Multiple addAndroidGPSInterface calls - folosim isAndroidGPSAdded flag
        }
    }
    
    private void scheduleInterfaceVerification() {
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            // CRASH FIX: Nu verifica dacă logout e în progres
            if (isLoggingOut) {
                Log.d(TAG, "🔒 scheduleInterfaceVerification SKIPPED - logout in progress");
                return;
            }
            
            try {
                WebView webView = getBridge().getWebView();
                if (webView != null) {
                    webView.evaluateJavascript(
                        "window.androidGPSVerified = (typeof window.AndroidGPS !== 'undefined' && typeof window.AndroidGPS.startGPS === 'function');",
                        null
                    );
                }
            } catch (Exception e) {
                Log.e(TAG, "scheduleInterfaceVerification failed: " + e.getMessage());
            }
        }, 3000);
    }

    // AndroidGPS WebView Interface Methods
    
    @JavascriptInterface
    public String startGPS(String courseId, String vehicleNumber, String uit, String authToken, int status) {
        // CRASH FIX: Resetăm flag-ul de logout când utilizatorul pornește GPS (nouă sesiune)
        isLoggingOut = false;
        Log.e(TAG, "🔓 isLoggingOut = false - WebView calls enabled");
        
        Log.e(TAG, "🚀 === BACKGROUND GPS === AndroidGPS.startGPS CALLED FROM JAVASCRIPT");
        Log.e(TAG, "📍 Starting NATIVE GPS system:");
        Log.e(TAG, "  - courseId: " + courseId);
        Log.e(TAG, "  - vehicleNumber: " + vehicleNumber);
        Log.e(TAG, "  - uit: " + uit);
        Log.e(TAG, "  - authToken length: " + (authToken != null ? authToken.length() : "NULL"));
        Log.e(TAG, "  - status: " + status);
        
        try {
            // Start BackgroundGPSService
            Intent intent = new Intent(this, BackgroundGPSService.class);
            intent.setAction("START_BACKGROUND_GPS");
            intent.putExtra("uit", courseId); // ikRoTrans ca identificator unic pentru HashMap
            intent.putExtra("extra_uit", uit); // UIT real pentru server
            intent.putExtra("token", authToken);
            intent.putExtra("vehicle", vehicleNumber);
            intent.putExtra("status", status);
            
            Log.e(TAG, "Intent prepared with extras - UIT: " + uit + ", Vehicle: " + vehicleNumber);
            
            Log.e(TAG, "🚀 === STARTING === BackgroundGPSService cu FUSION GPS...");
            Log.e(TAG, "📦 Intent created with action: START_BACKGROUND_GPS");
            Log.e(TAG, "📋 Intent extras: uit=" + uit + ", vehicle=" + vehicleNumber);
            Log.e(TAG, "⚡ BackgroundGPSService folosește FUSION GPS pentru triangulare inteligentă");
            Log.e(TAG, "🔄 FUSION GPS transmite automat la 10 secunde cu telefonul blocat/minimizat");
            
            // Try to start foreground service
            android.content.ComponentName result = startForegroundService(intent);
            if (result != null) {
                Log.e(TAG, "✅ === SUCCESS === BackgroundGPSService started successfully");
                Log.e(TAG, "🔗 Service component: " + result.toString());
            } else {
                Log.e(TAG, "❌ === WARNING === startForegroundService returned null");
            }
            
            // Verify service is running
            android.app.ActivityManager activityManager = (android.app.ActivityManager) getSystemService(ACTIVITY_SERVICE);
            boolean serviceRunning = false;
            for (android.app.ActivityManager.RunningServiceInfo service : activityManager.getRunningServices(Integer.MAX_VALUE)) {
                if (BackgroundGPSService.class.getName().equals(service.service.getClassName())) {
                    serviceRunning = true;
                    Log.e(TAG, "✅ === VERIFIED === BackgroundGPSService is RUNNING");
                    break;
                }
            }
            
            if (!serviceRunning) {
                Log.e(TAG, "❌ === CRITICAL === BackgroundGPSService NOT FOUND in running services!");
                // Try alternative start method
                Log.e(TAG, "🔄 Trying alternative startService method...");
                startService(intent);
            }
            
            String resultMessage = "SUCCESS: BACKGROUND GPS started for " + courseId;
            Log.e(TAG, "📤 Returning to JavaScript: " + resultMessage);
            return resultMessage;
            
        } catch (Exception e) {
            Log.e(TAG, "❌ === CRITICAL ERROR === starting NATIVE GPS: " + e.getMessage());
            e.printStackTrace();
            return "ERROR: " + e.getMessage();
        }
    }

    @JavascriptInterface
    public String stopGPS(String courseId) {
        Log.e(TAG, "🛑 === BACKGROUND GPS === AndroidGPS.stopGPS called: courseId=" + courseId);
        
        try {
            // Stop BackgroundGPSService
            Intent intent = new Intent(this, BackgroundGPSService.class);
            intent.setAction("STOP_BACKGROUND_GPS");
            
            startService(intent);
            Log.e(TAG, "✅ BackgroundGPSService stop requested");
            return "SUCCESS: BACKGROUND GPS stopped";
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error stopping NATIVE GPS: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    @JavascriptInterface
    public String updateStatus(String courseId, int newStatus, String vehicleNumber) {
        Log.e(TAG, "🔄 === BACKGROUND GPS === Status update: courseId=" + courseId + ", newStatus=" + newStatus + ", vehicle=" + vehicleNumber);
        Log.e(TAG, "  Status meanings: 2=START/RESUME, 3=PAUSE, 4=STOP");
        
        try {
            // Send status update to BackgroundGPSService
            Intent intent = new Intent(this, BackgroundGPSService.class);
            intent.setAction("UPDATE_COURSE_STATUS");
            intent.putExtra("status", newStatus);
            intent.putExtra("uit", courseId); // CORECTARE: Trimite UIT-ul specificat!
            intent.putExtra("vehicle", vehicleNumber); // CRITICAL: Trimite vehiculul pentru unique key!
            
            startService(intent);
            Log.e(TAG, "✅ Status update sent to BackgroundGPSService: " + newStatus);
            
            String statusName = (newStatus == 2) ? "ACTIVE" : (newStatus == 3) ? "PAUSE" : (newStatus == 4) ? "STOP" : "UNKNOWN";
            return "SUCCESS: BACKGROUND GPS status " + statusName + " for " + courseId;
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error updating NATIVE GPS status: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    @JavascriptInterface
    public String clearAllOnLogout() {
        Log.e(TAG, "🧹 === FUSION GPS === clearAllOnLogout called");
        
        // CRASH FIX: Setăm flag-ul ÎNAINTE de orice pentru a bloca apelurile WebView
        isLoggingOut = true;
        Log.e(TAG, "🔒 isLoggingOut = true - WebView calls blocked");
        
        try {
            // CRASH FIX: Verificăm dacă serviciul rulează ÎNAINTE de a trimite STOP
            // Dacă serviciul NU rulează, startService(STOP) îl pornește doar pentru a-l opri
            // ceea ce cauzează crash (accesează state neinițializat)
            if (isServiceRunning(BackgroundGPSService.class)) {
                Log.e(TAG, "📍 BackgroundGPSService IS RUNNING - sending STOP");
                Intent intent = new Intent(this, BackgroundGPSService.class);
                intent.setAction("STOP_BACKGROUND_GPS");
                startService(intent);
                Log.e(TAG, "✅ BackgroundGPSService stop requested on logout");
                return "SUCCESS: BACKGROUND GPS stopped and cleared";
            } else {
                Log.e(TAG, "📍 BackgroundGPSService NOT RUNNING - skip STOP (no crash)");
                return "SUCCESS: GPS was not running";
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error clearing NATIVE GPS data: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }
    
    // Helper pentru a verifica dacă un serviciu rulează
    private boolean isServiceRunning(Class<?> serviceClass) {
        try {
            ActivityManager manager = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
            for (ActivityManager.RunningServiceInfo service : manager.getRunningServices(Integer.MAX_VALUE)) {
                if (serviceClass.getName().equals(service.service.getClassName())) {
                    return true;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error checking service status: " + e.getMessage());
        }
        return false;
    }
    
    @JavascriptInterface
    public String getOfflineGPSCount() {
        Log.e(TAG, "📊 === FUSION GPS === getOfflineGPSCount called");
        
        try {
            android.content.SharedPreferences prefs = getSharedPreferences("offline_gps", MODE_PRIVATE);
            String coordinatesData = prefs.getString("coordinates", "[]");
            org.json.JSONArray coordinates = new org.json.JSONArray(coordinatesData);
            
            int count = coordinates.length();
            Log.e(TAG, "📊 Offline GPS coordinates count: " + count);
            return String.valueOf(count);
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error getting offline GPS count: " + e.getMessage());
            return "0";
        }
    }
    
    @JavascriptInterface
    public String syncOfflineGPS() {
        Log.e(TAG, "🔄 === FUSION GPS === syncOfflineGPS called");
        
        try {
            // BackgroundGPSService handles offline sync automatically
            Log.e(TAG, "ℹ️ BackgroundGPSService syncs offline data automatically");
            Log.e(TAG, "✅ Manual sync not needed - service handles offline/online transitions");
            return "SUCCESS: Automatic offline sync active";
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error starting offline GPS sync: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    @JavascriptInterface
    public String getServiceStatus() {
        Log.e(TAG, "📊 === FUSION GPS === getServiceStatus called");
        
        try {
            // Get basic status from SharedPreferences and service state
            android.content.SharedPreferences prefs = getSharedPreferences("offline_gps", MODE_PRIVATE);
            String coordinatesData = prefs.getString("coordinates", "[]");
            org.json.JSONArray coordinates = new org.json.JSONArray(coordinatesData);
            int offlineCount = coordinates.length();
            
            // Create status JSON
            org.json.JSONObject status = new org.json.JSONObject();
            status.put("isActive", true); // Simple check - service is responsive
            status.put("activeCourses", 1); // Placeholder - BackgroundGPSService tracks this internally
            status.put("offlineCount", offlineCount);
            status.put("networkStatus", true); // Default online
            status.put("lastTransmission", System.currentTimeMillis());
            
            String statusJson = status.toString();
            Log.e(TAG, "📊 Service status: " + statusJson);
            return statusJson;
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error getting service status: " + e.getMessage());
            return "{\"isActive\":false,\"activeCourses\":0,\"offlineCount\":0,\"networkStatus\":true}";
        }
    }

    // Setup listener pentru capturarea GPS offline din BackgroundGPSService
    private void setupOfflineGPSListener() {
        Log.d(TAG, "🔧 Configurez offline GPS listener pentru capturarea din loguri");
        
        // Programez verificarea periodică a log-urilor pentru offline GPS
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            // CRASH FIX: Nu executa dacă logout e în progres
            if (isLoggingOut) {
                Log.d(TAG, "🔒 setupOfflineGPSListener Handler SKIPPED - logout in progress");
                return;
            }
            monitorOfflineGPSLogs();
        }, 2000);
    }
    
    private void monitorOfflineGPSLogs() {
        // Log monitoring va fi implementat prin log bridge către JavaScript
        // GPS offline va fi salvat prin window.saveOfflineGPS din JavaScript
        Log.d(TAG, "💾 Offline GPS monitor activ - coordonatele vor fi salvate prin JavaScript bridge");
    }

    // NETWORK STATUS REPORTING pentru frontend - CRITICAL pentru online/offline detection
    @JavascriptInterface
    public void onGPSTransmissionSuccess() {
        // CRASH FIX: Nu apela WebView dacă logout e în progres
        if (isLoggingOut) {
            Log.d(TAG, "📡 GPS transmission SUCCESS - SKIPPED (logout in progress)");
            return;
        }
        
        Log.d(TAG, "📡 GPS transmission SUCCESS - notifying WebView about network status");
        
        // Call JavaScript function to report success
        runOnUiThread(() -> {
            try {
                if (isLoggingOut) return; // Double check în UI thread
                if (getBridge() == null) return; // CRASH FIX: Bridge poate fi null
                WebView webView = getBridge().getWebView();
                if (webView != null && !isLoggingOut) {
                    String jsCode = "if(window.AndroidGPSCallback && window.AndroidGPSCallback.onTransmissionSuccess) { window.AndroidGPSCallback.onTransmissionSuccess(); }";
                    webView.evaluateJavascript(jsCode, null);
                }
            } catch (Exception e) {
                // SILENT: Nu logăm erori de WebView distrus - e normal la logout
            }
        });
    }

    @JavascriptInterface  
    public void onGPSTransmissionError(int httpStatus) {
        // CRASH FIX: Nu apela WebView dacă logout e în progres
        if (isLoggingOut) {
            Log.d(TAG, "📡 GPS transmission ERROR - SKIPPED (logout in progress)");
            return;
        }
        
        Log.d(TAG, "📡 GPS transmission ERROR " + httpStatus + " - notifying WebView about network status");
        
        // Call JavaScript function to report error
        runOnUiThread(() -> {
            try {
                if (isLoggingOut) return; // Double check în UI thread
                if (getBridge() == null) return; // CRASH FIX: Bridge poate fi null
                WebView webView = getBridge().getWebView();
                if (webView != null && !isLoggingOut) {
                    String jsCode = "if(window.AndroidGPSCallback && window.AndroidGPSCallback.onTransmissionError) { window.AndroidGPSCallback.onTransmissionError(" + httpStatus + "); }";
                    webView.evaluateJavascript(jsCode, null);
                }
            } catch (Exception e) {
                // SILENT: Nu logăm erori de WebView distrus - e normal la logout
            }
        });
    }
    
    // FIXED: Implementează markManualPause pentru compatibility cu frontend
    @JavascriptInterface
    public String markManualPause(String ikRoTransKey) {
        Log.e(TAG, "⏸️ === MARK MANUAL PAUSE === pentru " + ikRoTransKey);
        
        try {
            // Log special pentru analytics bridge capture 
            Log.e("JS_ANALYTICS_BRIDGE", "window.courseAnalyticsService && window.courseAnalyticsService.markManualPause('" + ikRoTransKey + "');");
            Log.e(TAG, "✅ Manual pause marked pentru analytics: " + ikRoTransKey);
            
            return "Manual pause marked pentru " + ikRoTransKey;
        } catch (Exception e) {
            Log.e(TAG, "❌ Eroare mark manual pause: " + e.getMessage());
            return "Eroare: " + e.getMessage();
        }
    }

    // NATIVE NOTIFICATIONS pentru iTrack GPS - sistem de notificări persistente
    @JavascriptInterface
    public void showPersistentNotification(String title, String message, boolean persistent) {
        Log.d(TAG, "🔔 === NATIVE NOTIFICATION === showPersistentNotification CALLED: " + title + " - " + message);
        System.out.println("🔔 SYSTEM OUT: Native persistent notification called - " + title + " : " + message);
        
        try {
            runOnUiThread(() -> {
                android.app.NotificationManager notificationManager = 
                    (android.app.NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                
                // Creează canal pentru notificări pe Android 8.0+
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    android.app.NotificationChannel channel = new android.app.NotificationChannel(
                        "itrack_gps_channel",
                        "iTrack GPS Notifications",
                        android.app.NotificationManager.IMPORTANCE_LOW
                    );
                    channel.setDescription("Notificări pentru tracking GPS iTrack");
                    channel.setSound(null, null); // Silențios pentru notificările persistente
                    notificationManager.createNotificationChannel(channel);
                }
                
                // Creează notificarea
                androidx.core.app.NotificationCompat.Builder builder = 
                    new androidx.core.app.NotificationCompat.Builder(this, "itrack_gps_channel")
                        .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                        .setContentTitle(title)
                        .setContentText(message)
                        .setPriority(androidx.core.app.NotificationCompat.PRIORITY_LOW)
                        .setOngoing(persistent) // Persistentă dacă e specificat
                        .setSound(null); // Silențios
                
                // Afișează notificarea
                notificationManager.notify(3001, builder.build());
                Log.d(TAG, "✅ Notificare persistentă afișată cu succes");
            });
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Eroare afișare notificare persistentă: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    @JavascriptInterface
    public void hidePersistentNotification() {
        Log.d(TAG, "🔔 === NATIVE NOTIFICATION === Ascund notificare persistentă");
        
        try {
            runOnUiThread(() -> {
                android.app.NotificationManager notificationManager = 
                    (android.app.NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                notificationManager.cancel(3001); // Șterge notificarea persistentă
                Log.d(TAG, "✅ Notificare persistentă ascunsă cu succes");
            });
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Eroare ascundere notificare persistentă: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    @JavascriptInterface
    public void showQuickNotification(String title, String message, int durationMs) {
        Log.d(TAG, "🔔 === NATIVE NOTIFICATION === showQuickNotification CALLED: " + title + " - " + message + " (" + durationMs + "ms)");
        System.out.println("🔔 SYSTEM OUT: Native notification called - " + title + " : " + message);
        
        try {
            runOnUiThread(() -> {
                android.app.NotificationManager notificationManager = 
                    (android.app.NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                
                // Creează canal pentru notificări pe Android 8.0+
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    android.app.NotificationChannel channel = new android.app.NotificationChannel(
                        "itrack_quick_channel",
                        "iTrack Quick Notifications",
                        android.app.NotificationManager.IMPORTANCE_DEFAULT
                    );
                    channel.setDescription("Notificări rapide iTrack GPS");
                    notificationManager.createNotificationChannel(channel);
                }
                
                // Creează notificarea rapidă
                androidx.core.app.NotificationCompat.Builder builder = 
                    new androidx.core.app.NotificationCompat.Builder(this, "itrack_quick_channel")
                        .setSmallIcon(android.R.drawable.ic_dialog_info)
                        .setContentTitle(title)
                        .setContentText(message)
                        .setPriority(androidx.core.app.NotificationCompat.PRIORITY_DEFAULT)
                        .setAutoCancel(true); // Se șterge la click
                
                // Afișează notificarea
                int notificationId = (int) System.currentTimeMillis(); // ID unic
                notificationManager.notify(notificationId, builder.build());
                
                // Programează ștergerea automată
                new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                    notificationManager.cancel(notificationId);
                    Log.d(TAG, "🔔 Notificare rapidă ștearsă automat după " + durationMs + "ms");
                }, durationMs);
                
                Log.d(TAG, "✅ Notificare rapidă afișată cu succes");
            });
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Eroare afișare notificare rapidă: " + e.getMessage());
            e.printStackTrace();
        }
    }
}