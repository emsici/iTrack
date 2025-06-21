package com.itrack;

import android.util.Log;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Native Android HTTP Service
 * Completely bypasses any web-based HTTP mechanisms
 * Uses pure Java HttpURLConnection for guaranteed APK compatibility
 */
public class NativeHttpService {
    private static final String TAG = "NativeHttpService";
    private static final int TIMEOUT_CONNECT = 10000; // 10 seconds
    private static final int TIMEOUT_READ = 15000; // 15 seconds
    
    public static class HttpResponse {
        public int statusCode;
        public String body;
        public boolean success;
        public String error;
        
        public HttpResponse(int statusCode, String body, boolean success, String error) {
            this.statusCode = statusCode;
            this.body = body;
            this.success = success;
            this.error = error;
        }
    }
    
    /**
     * POST request with JSON data
     */
    public static HttpResponse postJson(String urlString, String jsonData, String authToken) {
        Log.d(TAG, "Native POST request to: " + urlString);
        
        try {
            URL url = new URL(urlString);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            
            // Configure connection
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("User-Agent", "iTrack-Android-Native/1.0");
            
            if (authToken != null && !authToken.isEmpty()) {
                connection.setRequestProperty("Authorization", "Bearer " + authToken);
            }
            
            connection.setDoOutput(true);
            connection.setDoInput(true);
            connection.setConnectTimeout(TIMEOUT_CONNECT);
            connection.setReadTimeout(TIMEOUT_READ);
            
            // Send JSON data
            try (DataOutputStream outputStream = new DataOutputStream(connection.getOutputStream())) {
                byte[] postData = jsonData.getBytes(StandardCharsets.UTF_8);
                outputStream.write(postData);
                outputStream.flush();
            }
            
            // Get response
            int responseCode = connection.getResponseCode();
            Log.d(TAG, "Response code: " + responseCode);
            
            StringBuilder response = new StringBuilder();
            BufferedReader reader;
            
            if (responseCode >= 200 && responseCode < 300) {
                reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            } else {
                reader = new BufferedReader(new InputStreamReader(connection.getErrorStream()));
            }
            
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();
            connection.disconnect();
            
            String responseBody = response.toString();
            Log.d(TAG, "Response body: " + responseBody);
            
            boolean success = responseCode >= 200 && responseCode < 300;
            return new HttpResponse(responseCode, responseBody, success, null);
            
        } catch (Exception e) {
            Log.e(TAG, "Native HTTP request failed", e);
            return new HttpResponse(0, null, false, e.getMessage());
        }
    }
    
    /**
     * GET request
     */
    public static HttpResponse get(String urlString, String authToken) {
        Log.d(TAG, "Native GET request to: " + urlString);
        
        try {
            URL url = new URL(urlString);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            
            // Configure connection
            connection.setRequestMethod("GET");
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("User-Agent", "iTrack-Android-Native/1.0");
            
            if (authToken != null && !authToken.isEmpty()) {
                connection.setRequestProperty("Authorization", "Bearer " + authToken);
            }
            
            connection.setConnectTimeout(TIMEOUT_CONNECT);
            connection.setReadTimeout(TIMEOUT_READ);
            
            // Get response
            int responseCode = connection.getResponseCode();
            Log.d(TAG, "Response code: " + responseCode);
            
            StringBuilder response = new StringBuilder();
            BufferedReader reader;
            
            if (responseCode >= 200 && responseCode < 300) {
                reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            } else {
                reader = new BufferedReader(new InputStreamReader(connection.getErrorStream()));
            }
            
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();
            connection.disconnect();
            
            String responseBody = response.toString();
            Log.d(TAG, "Response body: " + responseBody);
            
            boolean success = responseCode >= 200 && responseCode < 300;
            return new HttpResponse(responseCode, responseBody, success, null);
            
        } catch (Exception e) {
            Log.e(TAG, "Native HTTP request failed", e);
            return new HttpResponse(0, null, false, e.getMessage());
        }
    }
    
    /**
     * Send GPS coordinates using native HTTP
     */
    public static boolean sendGPSData(String lat, String lng, String speed, String direction, 
                                    String altitude, String battery, String vehicleNumber, 
                                    String uit, String status, String hdop, String gsmSignal, 
                                    String authToken) {
        try {
            JSONObject gpsData = new JSONObject();
            gpsData.put("lat", lat);
            gpsData.put("lng", lng);
            gpsData.put("timestamp", System.currentTimeMillis() / 1000);
            gpsData.put("viteza", speed);
            gpsData.put("directie", direction);
            gpsData.put("altitudine", altitude);
            gpsData.put("baterie", battery);
            gpsData.put("numar_inmatriculare", vehicleNumber);
            gpsData.put("uit", uit);
            gpsData.put("status", status);
            gpsData.put("hdop", hdop);
            gpsData.put("gsm_signal", gsmSignal);
            
            String apiUrl = "https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php";
            HttpResponse response = postJson(apiUrl, gpsData.toString(), authToken);
            
            if (response.success) {
                Log.d(TAG, "GPS data sent successfully");
                return true;
            } else {
                Log.e(TAG, "Failed to send GPS data: " + response.error);
                return false;
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error preparing GPS data", e);
            return false;
        }
    }
}