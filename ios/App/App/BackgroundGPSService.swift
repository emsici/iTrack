//
//  BackgroundGPSService.swift
//  iTrack GPS - Enterprise Fleet Management
//
//  Serviciu GPS de fundal identic cu versiunea Android
//  Transmite coordonate la fiecare 10 secunde în background
//  

import Foundation
import CoreLocation
import UIKit
import UserNotifications

// MARK: - Course Data Structure (identic cu Android)
class CourseData {
    let courseId: String      // ikRoTrans - identificator unic
    var status: Int           // 2=ACTIV, 3=PAUZA, 4=STOP
    let realUit: String       // UIT real pentru server
    let vehicleNumber: String // Numărul vehiculului
    
    init(courseId: String, status: Int, realUit: String, vehicleNumber: String) {
        self.courseId = courseId
        self.status = status
        self.realUit = realUit
        self.vehicleNumber = vehicleNumber
    }
}

// MARK: - Background GPS Service (echivalent BackgroundGPSService.java)
@objc class BackgroundGPSService: NSObject {
    static let shared = BackgroundGPSService()
    
    // CONSTANTE GPS (identice cu Android)
    private let GPS_INTERVAL_SECONDS: TimeInterval = 10.0
    private let TAG = "GPS_Fundal_iOS"
    
    // PROPRIETĂȚI GPS
    private let locationManager = CLLocationManager()
    private var activeCourses: [String: CourseData] = [:]
    private var globalToken: String?
    private var isGPSRunning = false
    private var gpsTimer: Timer?
    
    // QUEUE-uri pentru thread safety (ca în Android)
    private let gpsQueue = DispatchQueue(label: "com.euscagency.itrack.gps", qos: .background)
    private let httpQueue = DispatchQueue(label: "com.euscagency.itrack.http", qos: .background)
    
    override init() {
        super.init()
        setupLocationManager()
        setupNotifications()
        print("\(TAG): 🚀 BackgroundGPSService inițializat pentru iOS")
    }
    
    // MARK: - Location Manager Setup (echivalent cu FusedLocationProviderClient)
    private func setupLocationManager() {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 0  // Orice mișcare (identic cu Android)
        
        // BACKGROUND LOCATION (esențial pentru iOS)
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
        
        print("\(TAG): 📍 LocationManager configurat: Best accuracy, no distance filter, background enabled")
    }
    
    // MARK: - Notifications Setup
    private func setupNotifications() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if granted {
                print(self.TAG + ": 🔔 Permisiuni notificări acordate")
            } else {
                print(self.TAG + ": ❌ Permisiuni notificări refuzate: \(error?.localizedDescription ?? "Unknown")")
            }
        }
    }
    
    // MARK: - START GPS (echivalent cu startGPS din Android)
    @objc func startGPS(courseId: String, vehicleNumber: String, realUit: String, token: String, status: Int) -> String {
        gpsQueue.sync {
            print("\(TAG): ⚡ START GPS pentru cursă \(courseId) (real UIT: \(realUit)) cu status \(status)")
            
            // Salvează token global și vehicul
            self.globalToken = token
            
            // Creează unique key (identic cu Android)
            let deviceId = UIDevice.current.identifierForVendor?.uuidString ?? "iOS_DEVICE"
            let tokenHash = String(abs(token.hashValue))
            let uniqueKey = "\(vehicleNumber)_\(courseId)_\(deviceId.prefix(8))_\(tokenHash.prefix(8))"
            
            // Adaugă cursa în tracking
            let courseData = CourseData(courseId: courseId, status: status, realUit: realUit, vehicleNumber: vehicleNumber)
            self.activeCourses[uniqueKey] = courseData
            
            print("\(TAG): 📊 Cursă adăugată: \(uniqueKey) → realUIT: \(realUit)")
            
            // PORNIRE GPS dacă e status ACTIVE (2)
            if status == 2 {
                self.ensureLocationUpdatesStarted()
            }
            
            return "SUCCESS: iOS GPS started for \(courseId)"
        }
    }
    
    // MARK: - UPDATE STATUS (echivalent cu updateStatus din Android)
    @objc func updateStatus(courseId: String, newStatus: Int, vehicleNumber: String) -> String {
        return gpsQueue.sync {
            print("\(TAG): 🔄 UPDATE STATUS \(courseId) → \(newStatus)")
            
            // Găsește cursa în HashMap (identic cu logica Android)
            var foundKey: String?
            for (key, courseData) in activeCourses {
                if courseData.courseId == courseId {
                    foundKey = key
                    break
                }
            }
            
            guard let key = foundKey, let courseData = activeCourses[key] else {
                print("\(TAG): ❌ Nu găsesc cursa \(courseId) pentru status update")
                return "ERROR: Course not found"
            }
            
            let oldStatus = courseData.status
            print("\(TAG): Status: \(oldStatus) → \(newStatus) pentru \(courseData.realUit)")
            
            if newStatus == 2 { // ACTIVE/RESUME
                courseData.status = 2
                print("\(TAG): 🟢 RESUME: GPS reactivat pentru \(courseData.realUit)")
                
                // Trimite status RESUME la server
                sendStatusUpdateToServer(newStatus: newStatus, courseData: courseData)
                
                // Garantează GPS activ pentru RESUME
                ensureLocationUpdatesStarted()
                
            } else if newStatus == 3 { // PAUSE
                courseData.status = 3
                print("\(TAG): 🔶 PAUSE: \(courseData.realUit) status → 3 (PAUSE)")
                
                // Trimite status PAUSE la server
                sendStatusUpdateToServer(newStatus: newStatus, courseData: courseData)
                
                // Verifică dacă mai sunt curse ACTIVE
                let activeCourseCount = activeCourses.values.filter { $0.status == 2 }.count
                print("\(TAG): 📊 PAUSE: \(activeCourseCount) curse rămân ACTIVE")
                
                if activeCourseCount == 0 {
                    print("\(TAG): 🛑 TOATE cursele în PAUZĂ/STOP - opresc LocationUpdates")
                    stopLocationUpdates()
                }
                
            } else if newStatus == 4 { // STOP
                // Trimite status STOP la server ÎNAINTE de eliminare
                sendStatusUpdateToServer(newStatus: newStatus, courseData: courseData)
                
                activeCourses.removeValue(forKey: key)
                print("\(TAG): ✅ STOP: Status trimis + cursă eliminată din GPS tracking pentru \(courseData.realUit)")
                
                // Verifică dacă mai sunt curse ACTIVE
                let activeCourseCount = activeCourses.values.filter { $0.status == 2 }.count
                
                if activeCourseCount == 0 {
                    print("\(TAG): 🛑 TOATE cursele STOP - opresc LocationUpdates")
                    stopLocationUpdates()
                } else {
                    print("\(TAG): ⚡ GPS continuă pentru \(activeCourseCount) curse ACTIVE rămase")
                }
            }
            
            return "SUCCESS: Status updated to \(newStatus)"
        }
    }
    
    // MARK: - Ensure Location Updates (echivalent cu ensureLocationUpdatesRegistered)
    private func ensureLocationUpdatesStarted() {
        guard !activeCourses.isEmpty else {
            print("\(TAG): ❌ Nu pot porni GPS - NO ACTIVE COURSES")
            return
        }
        
        guard globalToken != nil else {
            print("\(TAG): ❌ Nu pot porni GPS - NO TOKEN")
            return
        }
        
        // Cere permisiuni dacă nu sunt acordate
        if locationManager.authorizationStatus != .authorizedAlways {
            locationManager.requestAlwaysAuthorization()
            return
        }
        
        if !isGPSRunning {
            print("\(TAG): 📍 PORNIRE GPS: Background location updates")
            locationManager.startUpdatingLocation()
            isGPSRunning = true
            
            // TIMER pentru verificări periodice (backup pentru iOS)
            startGPSTimer()
            
            // Notificare persistentă
            showPersistentNotification()
        }
    }
    
    // MARK: - GPS Timer (backup pentru iOS - asigură transmisia la 10 secunde)
    private func startGPSTimer() {
        gpsTimer?.invalidate()
        gpsTimer = Timer.scheduledTimer(withTimeInterval: GPS_INTERVAL_SECONDS, repeats: true) { _ in
            self.requestCurrentLocationForTransmission()
        }
        print("\(TAG): ⏰ GPS Timer pornit - va transmite la fiecare \(GPS_INTERVAL_SECONDS) secunde")
    }
    
    private func stopGPSTimer() {
        gpsTimer?.invalidate()
        gpsTimer = nil
        print("\(TAG): ⏰ GPS Timer oprit")
    }
    
    // MARK: - Stop Location Updates
    private func stopLocationUpdates() {
        print("\(TAG): 🛑 STOP GPS: Location updates")
        locationManager.stopUpdatingLocation()
        stopGPSTimer()
        isGPSRunning = false
        
        hidePersistentNotification()
    }
    
    // MARK: - Request Current Location pentru transmisie
    private func requestCurrentLocationForTransmission() {
        guard let currentLocation = locationManager.location else {
            print("\(TAG): ❌ Nu am locația curentă pentru transmisie")
            return
        }
        
        // Transmite pentru toate cursele ACTIVE (identic cu Android)
        transmitGPSDataToAllActiveCourses(location: currentLocation)
    }
}

// MARK: - Location Manager Delegate
extension BackgroundGPSService: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        
        print("\(TAG): 📍 GPS Update: lat=\(location.coordinate.latitude), lng=\(location.coordinate.longitude)")
        print("\(TAG): 📊 Accuracy: \(location.horizontalAccuracy)m, Speed: \(location.speed * 3.6) km/h")
        
        // Transmite la toate cursele ACTIVE
        transmitGPSDataToAllActiveCourses(location: location)
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("\(TAG): ❌ GPS Error: \(error.localizedDescription)")
    }
    
    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        switch status {
        case .authorizedAlways:
            print("\(TAG): ✅ GPS permission: Always authorized")
            ensureLocationUpdatesStarted()
        case .authorizedWhenInUse:
            print("\(TAG): ⚠️ GPS permission: Only when in use - requesting Always")
            manager.requestAlwaysAuthorization()
        case .denied, .restricted:
            print("\(TAG): ❌ GPS permission: Denied/Restricted")
        case .notDetermined:
            print("\(TAG): 🔄 GPS permission: Not determined - requesting")
            manager.requestAlwaysAuthorization()
        @unknown default:
            print("\(TAG): ❓ GPS permission: Unknown status")
        }
    }
}