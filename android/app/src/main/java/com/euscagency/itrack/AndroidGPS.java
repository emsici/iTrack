package com.euscagency.itrack;

import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * AndroidGPS WebView Interface
 * Provides native GPS control and HTTP functionality to JavaScript
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
     * Native HTTP POST request with automatic Bearer token
     * Eliminates CORS issues and provides maximum efficiency in APK
     */
    @JavascriptInterface
    public String postNativeHttp(String url, String jsonData, String authToken) {
        Log.d(TAG, "🔥 Native HTTP POST to: " + url);
        Log.d(TAG, "📤 Payload size: " + jsonData.length() + " bytes");
        Log.d(TAG, "🔑 Using token: " + (authToken.isEmpty() ? "none" : authToken.substring(0, 20) + "..."));
        
        try {
            URL urlObject = new URL(url);
            HttpURLConnection connection = (HttpURLConnection) urlObject.openConnection();
            
            // Configure connection - match curl exactly
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("User-Agent", "iTrack-Android/1.0");
            connection.setRequestProperty("Cache-Control", "no-cache");
            
            // Calculate and set content length
            byte[] postData = jsonData.getBytes(StandardCharsets.UTF_8);
            connection.setRequestProperty("Content-Length", String.valueOf(postData.length));
            
            // Add Bearer token automatically if provided
            if (authToken != null && !authToken.isEmpty()) {
                connection.setRequestProperty("Authorization", "Bearer " + authToken);
                Log.d(TAG, "✅ Bearer token added to request headers");
            }
            
            connection.setConnectTimeout(15000);
            connection.setReadTimeout(15000);
            connection.setUseCaches(false);
            
            // Send request body with pre-calculated data
            connection.setDoOutput(true);
            try (OutputStream os = connection.getOutputStream()) {
                os.write(postData, 0, postData.length);
                os.flush();
            }
            
            // Get response
            int responseCode = connection.getResponseCode();
            Log.d(TAG, "📡 Response code: " + responseCode);
            
            BufferedReader reader;
            if (responseCode >= 200 && responseCode < 300) {
                reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            } else {
                reader = new BufferedReader(new InputStreamReader(connection.getErrorStream()));
            }
            
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();
            
            String responseBody = response.toString();
            Log.d(TAG, "📥 Response: " + responseBody);
            
            // Return success for 200, 201, 204
            if (responseCode == 200 || responseCode == 201 || responseCode == 204) {
                return responseBody.isEmpty() ? "{\"status\":\"success\"}" : responseBody;
            } else {
                Log.e(TAG, "❌ HTTP error " + responseCode + ": " + responseBody);
                return "{\"error\":\"HTTP " + responseCode + "\",\"message\":\"" + responseBody + "\"}";
            }
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Native HTTP error: " + e.getMessage(), e);
            return "{\"error\":\"Network error\",\"message\":\"" + e.getMessage() + "\"}";
        }
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