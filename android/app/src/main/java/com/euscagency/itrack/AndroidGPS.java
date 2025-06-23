package com.euscagency.itrack;

import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;
// All HTTP operations moved to CapacitorHttp - no Java HTTP imports needed

/**
 * AndroidGPS WebView Interface
 * Provides GPS control commands - all HTTP operations use CapacitorHttp
 */
public class AndroidGPS {
    private static final String TAG = "AndroidGPS";
    private Context context;

    public AndroidGPS() {
        // Get context from MainActivity
        try {
            this.context = MainActivity.getContext();
        } catch (Exception e) {
            Log.e(TAG, "Context not available yet");
        }
    }

    /**
     * Start GPS tracking for a course
     */
    @JavascriptInterface
    public String startGPS(String courseId, String vehicleNumber, String uit, String token, String status) {
        Log.d(TAG, "🟢 Starting GPS for course: " + courseId + ", UIT: " + uit);
        try {
            Context context = MainActivity.getContext();
            Intent intent = new Intent(context, SimpleGPSService.class);
            intent.setAction("START_GPS");
            intent.putExtra("courseId", courseId);
            intent.putExtra("vehicleNumber", vehicleNumber);
            intent.putExtra("uit", uit);
            intent.putExtra("token", token);
            intent.putExtra("status", status);
            context.startService(intent);
            Log.d(TAG, "✅ GPS start command sent to SimpleGPSService");
            return "SUCCESS";
        } catch (Exception e) {
            Log.e(TAG, "❌ Error starting GPS: " + e.getMessage(), e);
            return "ERROR: " + e.getMessage();
        }
    }

    /**
     * Update course status
     */
    @JavascriptInterface
    public String updateStatus(String courseId, String newStatus) {
        Log.d(TAG, "🔄 Updating status for course: " + courseId + " to status: " + newStatus);
        try {
            Context context = MainActivity.getContext();
            Intent intent = new Intent(context, SimpleGPSService.class);
            intent.setAction("UPDATE_STATUS");
            intent.putExtra("courseId", courseId);
            intent.putExtra("status", newStatus);
            context.startService(intent);
            Log.d(TAG, "✅ Status update command sent to SimpleGPSService");
            return "SUCCESS";
        } catch (Exception e) {
            Log.e(TAG, "❌ Error updating status: " + e.getMessage(), e);
            return "ERROR: " + e.getMessage();
        }
    }

    /**
     * Stop GPS tracking for a course
     */
    @JavascriptInterface
    public String stopGPS(String courseId) {
        Log.d(TAG, "🔴 Stopping GPS for course: " + courseId);
        try {
            Context context = MainActivity.getContext();
            Intent intent = new Intent(context, SimpleGPSService.class);
            intent.setAction("STOP_GPS");
            intent.putExtra("courseId", courseId);
            context.startService(intent);
            Log.d(TAG, "✅ GPS stop command sent to SimpleGPSService");
            return "SUCCESS";
        } catch (Exception e) {
            Log.e(TAG, "❌ Error stopping GPS: " + e.getMessage(), e);
            return "ERROR: " + e.getMessage();
        }
    }

    /**
     * Clear all active GPS tracking on logout
     */
    @JavascriptInterface
    public String clearAllOnLogout() {
        Log.d(TAG, "🔴 Clearing all GPS tracking on logout");
        try {
            Context context = MainActivity.getContext();
            Intent intent = new Intent(context, SimpleGPSService.class);
            intent.setAction("CLEAR_ALL");
            context.startService(intent);
            Log.d(TAG, "✅ Logout clear command sent to SimpleGPSService");
            return "SUCCESS";
        } catch (Exception e) {
            Log.e(TAG, "❌ Error clearing GPS on logout: " + e.getMessage(), e);
            return "ERROR: " + e.getMessage();
        }
    }

    /**
     * DEPRECATED: All HTTP operations moved to CapacitorHttp
     */
    @JavascriptInterface
    public String postNativeHttp(String url, String jsonData, String authToken) {
        Log.d(TAG, "⚠️ DEPRECATED: postNativeHttp - use CapacitorHttp with Bearer token");
        return "DEPRECATED: Use CapacitorHttp for all HTTP operations";
    }

    /**
     * Native HTTP GET request with automatic Bearer token
     */
    @JavascriptInterface
    public String getNativeHttp(String url, String authToken) {
        Log.d(TAG, "🔥 Native HTTP GET to: " + url);
        
        try {
            URL urlObject = new URL(url);
            HttpURLConnection connection = (HttpURLConnection) urlObject.openConnection();
            
            connection.setRequestMethod("GET");
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("Cache-Control", "no-cache");
            connection.setRequestProperty("User-Agent", "iTrack/1.0");
            
            // Add Bearer token automatically
            if (authToken != null && !authToken.isEmpty()) {
                connection.setRequestProperty("Authorization", "Bearer " + authToken);
            }
            
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);
            
            int responseCode = connection.getResponseCode();
            BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();
            
            return response.toString();
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Native GET error: " + e.getMessage(), e);
            return "{\"error\":\"" + e.getMessage() + "\"}";
        }
    }
}