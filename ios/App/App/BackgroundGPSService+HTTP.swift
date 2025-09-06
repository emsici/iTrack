//
//  BackgroundGPSService+HTTP.swift
//  iTrack GPS - HTTP Transmission Extension
//
//  Extensie pentru transmisia HTTP GPS (identic cu Android)
//

import Foundation
import CoreLocation

// MARK: - HTTP Transmission Methods (identice cu Android)
extension BackgroundGPSService {
    
    // MARK: - Transmit GPS Data to All Active Courses (identic cu Android)
    func transmitGPSDataToAllActiveCourses(location: CLLocation) {
        httpQueue.async {
            print("\(self.TAG): 📡 Pregătesc transmisia GPS pentru \(self.activeCourses.count) curse")
            
            // Timestamp România (identic cu Android)
            let romanianTimestamp = self.getRomanianTimestamp()
            
            // Senzori iOS
            let batteryLevel = self.getBatteryLevel()
            let networkSignal = self.getNetworkSignal()
            
            var coursesTransmitting = 0
            
            for (uniqueKey, courseData) in self.activeCourses {
                // DOAR status 2 (ACTIVE) transmite GPS (identic cu Android)
                if courseData.status != 2 {
                    let statusName = courseData.status == 3 ? "PAUSE" : (courseData.status == 4 ? "STOP" : "INVALID")
                    print("\(self.TAG): ⏭️ Skip \(uniqueKey) - status \(statusName)")
                    continue
                }
                
                print("\(self.TAG): ✅ TRANSMIT: UIT \(courseData.realUit) status 2 ACTIVE - TRIMIT LA SERVER")
                coursesTransmitting += 1
                
                // Pregătește datele GPS (identic cu structura Android)
                let gpsData: [String: Any] = [
                    "uit": courseData.realUit,
                    "numar_inmatriculare": courseData.vehicleNumber,
                    "lat": location.coordinate.latitude,
                    "lng": location.coordinate.longitude,
                    "viteza": Int(max(0, location.speed * 3.6)), // m/s to km/h
                    "directie": Int(location.course >= 0 ? location.course : 0),
                    "altitudine": Int(location.altitude),
                    "hdop": Int(location.horizontalAccuracy),
                    "gsm_signal": networkSignal,
                    "baterie": batteryLevel,
                    "status": courseData.status,
                    "timestamp": romanianTimestamp
                ]
                
                // Transmite HTTP (identic cu Android)
                self.sendGPSHTTPDirect(gpsData: gpsData, uniqueKey: uniqueKey)
                
                // Trimite coordonatele și către Analytics (pentru hartă)
                self.sendGPSToAnalyticsService(gpsData: gpsData, realUit: courseData.realUit, 
                                            uniqueKey: uniqueKey, ikRoTrans: courseData.courseId)
            }
            
            if coursesTransmitting > 0 {
                print("\(self.TAG): 📊 GPS TRANSMISSION COMPLETE: \(coursesTransmitting) curse au transmis coordonate")
            }
        }
    }
    
    // MARK: - Send GPS HTTP Direct (identic cu Android)
    private func sendGPSHTTPDirect(gpsData: [String: Any], uniqueKey: String) {
        guard let token = globalToken else {
            print("\(TAG): ❌ Nu pot trimite GPS - lipsește token-ul")
            return
        }
        
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: gpsData, options: [])
            
            guard let url = URL(string: "https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php") else {
                print("\(TAG): ❌ URL invalid pentru GPS transmission")
                return
            }
            
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Accept")
            request.setValue("iTrack-GPS-iOS/1.0", forHTTPHeaderField: "User-Agent")
            request.httpBody = jsonData
            request.timeoutInterval = 15.0
            
            print("\(TAG): 📤 GPS HTTP transmission started pentru \(uniqueKey)")
            
            let task = URLSession.shared.dataTask(with: request) { data, response, error in
                if let error = error {
                    print("\(self.TAG): ❌ GPS HTTP error: \(error.localizedDescription)")
                    // TODO: Salvează în offline queue
                    return
                }
                
                let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
                print("\(self.TAG): 📡 GPS HTTP Response: \(statusCode)")
                
                if statusCode >= 200 && statusCode < 300 {
                    print("\(self.TAG): ✅ GPS transmission SUCCESS pentru \(uniqueKey)")
                } else {
                    print("\(self.TAG): ❌ GPS transmission FAILED: \(statusCode)")
                }
            }
            
            task.resume()
            
        } catch {
            print("\(TAG): ❌ JSON serialization error: \(error.localizedDescription)")
        }
    }
    
    // MARK: - Send Status Update to Server (identic cu Android)
    func sendStatusUpdateToServer(newStatus: Int, courseData: CourseData) {
        httpQueue.async {
            print("\(self.TAG): 📤 === PREPARING STATUS UPDATE FROM iOS SERVICE ===")
            print("\(self.TAG): 🔧 Status update: \(courseData.courseId) → realUit=\(courseData.realUit) status=\(newStatus)")
            
            guard let token = self.globalToken else {
                print("\(self.TAG): ❌ Nu pot trimite status - lipsește token-ul")
                return
            }
            
            // Obține locația curentă pentru status update
            guard let currentLocation = self.locationManager.location else {
                print("\(self.TAG): ❌ Nu am locația curentă pentru status update")
                return
            }
            
            // Creează JSON identic cu Android
            let statusData: [String: Any] = [
                "uit": courseData.realUit,
                "numar_inmatriculare": courseData.vehicleNumber,
                "lat": currentLocation.coordinate.latitude,
                "lng": currentLocation.coordinate.longitude,
                "viteza": Int(max(0, currentLocation.speed * 3.6)),
                "directie": Int(currentLocation.course >= 0 ? currentLocation.course : 0),
                "altitudine": Int(currentLocation.altitude),
                "hdop": Int(currentLocation.horizontalAccuracy),
                "gsm_signal": self.getNetworkSignal(),
                "baterie": self.getBatteryLevel(),
                "status": newStatus,
                "timestamp": self.getRomanianTimestamp()
            ]
            
            print("\(self.TAG): 📊 Status Data prepared for status \(newStatus):")
            print("\(self.TAG):    Vehicle: \(courseData.vehicleNumber)")
            print("\(self.TAG):    Status: \(newStatus)")
            print("\(self.TAG):    Timestamp: \(statusData["timestamp"] as? String ?? "N/A")")
            
            // Transmite HTTP direct
            self.sendStatusHTTPDirect(statusData: statusData)
        }
    }
    
    // MARK: - Send Status HTTP Direct
    private func sendStatusHTTPDirect(statusData: [String: Any]) {
        guard let token = globalToken else { return }
        
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: statusData, options: [])
            
            guard let url = URL(string: "https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php") else {
                print("\(TAG): ❌ URL invalid pentru status transmission")
                return
            }
            
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Accept")
            request.setValue("iTrack-StatusUpdate-iOS/1.0", forHTTPHeaderField: "User-Agent")
            request.httpBody = jsonData
            request.timeoutInterval = 15.0
            
            print("\(TAG): 🔄 === STARTING STATUS HTTP TRANSMISSION ===")
            print("\(TAG): 🔗 URL: https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php")
            
            let task = URLSession.shared.dataTask(with: request) { data, response, error in
                if let error = error {
                    print("\(self.TAG): ❌ Status HTTP error: \(error.localizedDescription)")
                    return
                }
                
                let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
                print("\(self.TAG): 📡 === STATUS HTTP RESPONSE ===")
                print("\(self.TAG): 📊 Response Code: \(statusCode)")
                
                if statusCode >= 200 && statusCode < 300 {
                    print("\(self.TAG): ✅ === STATUS TRANSMISSION SUCCESS ===")
                } else {
                    print("\(self.TAG): ❌ === STATUS TRANSMISSION FAILED ===")
                }
            }
            
            task.resume()
            
        } catch {
            print("\(TAG): ❌ Status JSON serialization error: \(error.localizedDescription)")
        }
    }
    
    // MARK: - Send GPS to Analytics Service (pentru hartă)
    private func sendGPSToAnalyticsService(gpsData: [String: Any], realUit: String, uniqueKey: String, ikRoTrans: String) {
        // Bridge către JavaScript pentru actualizarea hărții (identic cu Android)
        let analyticsMessage = "GPS_ANALYTICS_iOS:\(gpsData)"
        sendLogToJavaScript(message: String(describing: analyticsMessage))
        
        if let lat = gpsData["lat"] as? Double, let lng = gpsData["lng"] as? Double {
            print("\(TAG): 📍 GPS→HARTA iOS: UIT \(realUit) la (\(lat), \(lng)) trimis prin bridge")
        }
    }
    
    // MARK: - Send Log to JavaScript (bridge)
    private func sendLogToJavaScript(message: String) {
        DispatchQueue.main.async {
            // Bridge către WebView pentru JavaScript
            print("JS_BRIDGE_LOG_iOS: [iOS GPS]: \(message)")
            
            // TODO: Implementează bridge-ul către Capacitor WebView
            // Echivalentul window.AndroidGPS din Android
        }
    }
}