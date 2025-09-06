//
//  BackgroundGPSService+Utils.swift
//  iTrack GPS - Utility Functions
//
//  Funcții utilitare identice cu Android
//

import Foundation
import CoreLocation
import CoreTelephony
import UIKit

// MARK: - Utility Functions (identice cu Android)
extension BackgroundGPSService {
    
    // MARK: - Romanian Timestamp (identic cu Android)
    func getRomanianTimestamp() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        formatter.timeZone = TimeZone(identifier: "Europe/Bucharest")
        return formatter.string(from: Date())
    }
    
    // MARK: - Battery Level (echivalent cu getBatteryLevel din Android)
    func getBatteryLevel() -> String {
        UIDevice.current.isBatteryMonitoringEnabled = true
        let batteryLevel = UIDevice.current.batteryLevel
        
        if batteryLevel < 0 {
            return "0%" // Unknown battery level
        }
        
        let percentage = Int(batteryLevel * 100)
        return "\(percentage)%"
    }
    
    // MARK: - Network Signal (echivalent cu getNetworkSignal din Android)
    func getNetworkSignal() -> Int {
        // iOS nu oferă acces direct la puterea semnalului GSM din cauza restricțiilor
        // Returnăm o valoare bazată pe tipul conexiunii (identic cu logica Android)
        
        let networkInfo = CTTelephonyNetworkInfo()
        
        // Verifică dacă avem conectivitate mobilă
        if let currentRadioTech = networkInfo.serviceCurrentRadioAccessTechnology?.values.first {
            switch currentRadioTech {
            case CTRadioAccessTechnologyLTE:
                return 4 // 4G LTE - semnal bun
            case CTRadioAccessTechnologyHSDPA,
                 CTRadioAccessTechnologyHSUPA,
                 CTRadioAccessTechnologyWCDMA:
                return 3 // 3G - semnal decent
            case CTRadioAccessTechnologyGPRS,
                 CTRadioAccessTechnologyEdge:
                return 2 // 2G - semnal slab
            default:
                return 1 // Tehnologie necunoscută
            }
        }
        
        // Fallback pentru WiFi sau conexiune necunoscută
        return 0
    }
    
    // MARK: - Clear All on Logout (identic cu Android)
    @objc func clearAllOnLogout() -> String {
        return gpsQueue.sync {
            print("\(TAG): 🧹 CLEAR ALL - Logout complet iOS")
            
            // Oprește toate serviciile GPS
            stopLocationUpdates()
            
            // Curăță toate cursele
            let courseCount = activeCourses.count
            activeCourses.removeAll()
            
            // Șterge token-ul
            globalToken = nil
            
            // Ascunde notificările
            hidePersistentNotification()
            
            print("\(TAG): ✅ CLEAR ALL COMPLETE: \(courseCount) curse eliminate")
            return "SUCCESS: Cleared \(courseCount) courses from iOS GPS tracking"
        }
    }
    
    // MARK: - Mark Manual Pause (pentru analytics)
    @objc func markManualPause(ikRoTransKey: String) -> String {
        print("\(TAG): 🔶 MANUAL PAUSE marked pentru \(ikRoTransKey)")
        // TODO: Implementare pentru analytics manual pause
        return "SUCCESS: Manual pause marked for iOS"
    }
    
    // MARK: - Stop GPS (pentru oprire completă)
    @objc func stopGPS(courseId: String) -> String {
        return gpsQueue.sync {
            print("\(TAG): 🛑 STOP GPS pentru cursă \(courseId)")
            
            // Găsește și elimină cursa
            var foundKey: String?
            for (key, courseData) in activeCourses {
                if courseData.courseId == courseId {
                    foundKey = key
                    break
                }
            }
            
            if let key = foundKey {
                activeCourses.removeValue(forKey: key)
                print("\(TAG): ✅ Cursă \(courseId) eliminată din tracking")
                
                // Dacă nu mai sunt curse active, oprește GPS-ul complet
                if activeCourses.isEmpty {
                    stopLocationUpdates()
                }
                
                return "SUCCESS: GPS stopped for course \(courseId)"
            } else {
                print("\(TAG): ❌ Nu găsesc cursa \(courseId) pentru stop")
                return "ERROR: Course not found"
            }
        }
    }
}

// MARK: - Notifications Functions (echivalent cu Android notifications)
extension BackgroundGPSService {
    
    // MARK: - Show Persistent Notification (echivalent cu Android)
    func showPersistentNotification() {
        let content = UNMutableNotificationContent()
        
        // Contorizează cursele active
        let activeCourseCount = activeCourses.values.filter { $0.status == 2 }.count
        let totalCourses = activeCourses.count
        
        if activeCourseCount > 0 {
            content.title = "iTrack GPS iOS"
            content.body = "GPS activ - \(activeCourseCount)/\(totalCourses) curse transmit"
        } else if totalCourses > 0 {
            content.title = "iTrack GPS iOS"
            content.body = "GPS în standby - \(totalCourses) curse în pauză/stop"
        } else {
            content.title = "iTrack GPS iOS"
            content.body = "Serviciu GPS pregătit"
        }
        
        content.sound = nil
        content.badge = NSNumber(value: activeCourseCount)
        
        // Notificare persistentă (nu se auto-elimină)
        let request = UNNotificationRequest(
            identifier: "itrack_gps_persistent",
            content: content,
            trigger: nil // Trigger nil = notificare immediatly
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("\(self.TAG): ❌ Eroare notificare persistentă: \(error.localizedDescription)")
            } else {
                print("\(self.TAG): 🔔 Notificare persistentă afișată: \(content.body)")
            }
        }
    }
    
    // MARK: - Hide Persistent Notification
    func hidePersistentNotification() {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["itrack_gps_persistent"])
        UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: ["itrack_gps_persistent"])
        print("\(TAG): 🔕 Notificare persistentă ascunsă")
    }
    
    // MARK: - Show Quick Notification (echivalent cu Android)
    func showQuickNotification(title: String, message: String, duration: Int) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = message
        content.sound = .default
        
        // Trigger pentru a se auto-elimina după duration (în secunde)
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        
        let request = UNNotificationRequest(
            identifier: "itrack_quick_\(Date().timeIntervalSince1970)",
            content: content,
            trigger: trigger
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("\(self.TAG): ❌ Eroare notificare rapidă: \(error.localizedDescription)")
            } else {
                print("\(self.TAG): 🔔 Notificare rapidă trimisă: \(title) - \(message)")
            }
        }
        
        // Auto-eliminare după duration secunde
        DispatchQueue.main.asyncAfter(deadline: .now() + TimeInterval(duration / 1000)) {
            UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: [request.identifier])
        }
    }
}