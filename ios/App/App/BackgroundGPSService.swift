import Foundation
import CoreLocation
import UIKit
import UserNotifications

// iTrack GPS - iOS Background GPS Service
// Port direct din Android BackgroundGPSService.java pentru funcționalitate identică
@objc class BackgroundGPSService: NSObject, CLLocationManagerDelegate {
    
    // Thread safety cu NSLock (echivalent AtomicBoolean din Java)
    private static var isGPSRunning = false
    private static let gpsLock = NSLock()
    
    // Course management (echivalent ConcurrentHashMap din Java)
    private static var activeCourses: [String: CourseData] = [:]
    private static let coursesLock = NSLock()
    
    // GPS Timer pentru interval exact 10 secunde
    private static var gpsTimer: Timer?
    private static let GPS_INTERVAL: TimeInterval = 10.0
    
    // Location Manager pentru GPS de înaltă precizie
    private static var locationManager: CLLocationManager?
    private static var currentLocation: CLLocation?
    
    // Queue pentru GPS offline (echivalent ConcurrentLinkedQueue)
    private static var offlineGPSQueue: [GPSData] = []
    private static let offlineQueueLock = NSLock()
    
    // HTTP Request management
    private static var httpSession: URLSession?
    
    // Notification pentru background operation
    private static var backgroundTaskID: UIBackgroundTaskIdentifier = .invalid
    
    // CourseData struct similar cu Android
    struct CourseData {
        let ikRoTrans: String
        let vehicleNumber: String
        let realUit: String
        let token: String
        var status: Int
        let startTime: Date
    }
    
    // GPSData struct pentru queue offline
    struct GPSData {
        let ikRoTrans: String
        let latitude: Double
        let longitude: Double
        let speed: Double
        let heading: Double
        let altitude: Double
        let accuracy: Double
        let timestamp: String
        let vehicleNumber: String
        let batteryLevel: Int
        let signalStrength: Int
        let status: Int
    }
    
    // MARK: - Public API (bridge with JavaScript)
    
    @objc static func startGPS(ikRoTrans: String, vehicleNumber: String, realUit: String, token: String, status: Int) -> String {
        print("🚀 [iOS GPS] Starting GPS for course: \(ikRoTrans)")
        
        gpsLock.lock()
        defer { gpsLock.unlock() }
        
        // Initialize location manager
        if locationManager == nil {
            setupLocationManager()
        }
        
        // Create course data
        let courseData = CourseData(
            ikRoTrans: ikRoTrans,
            vehicleNumber: vehicleNumber,
            realUit: realUit,
            token: token,
            status: status,
            startTime: Date()
        )
        
        // Add to active courses
        coursesLock.lock()
        activeCourses[ikRoTrans] = courseData
        coursesLock.unlock()
        
        // Start GPS if not already running
        if !isGPSRunning {
            startGPSTracking()
            isGPSRunning = true
            
            // Start background task
            beginBackgroundTask()
            
            // Show persistent notification
            showGPSNotification()
        }
        
        return "GPS Started for course \(ikRoTrans)"
    }
    
    @objc static func stopGPS(courseId: String) -> String {
        print("🛑 [iOS GPS] Stopping GPS for course: \(courseId)")
        
        coursesLock.lock()
        activeCourses.removeValue(forKey: courseId)
        let hasActiveCourses = !activeCourses.isEmpty
        coursesLock.unlock()
        
        // Stop GPS if no active courses
        if !hasActiveCourses {
            gpsLock.lock()
            if isGPSRunning {
                stopGPSTracking()
                isGPSRunning = false
                endBackgroundTask()
                hideGPSNotification()
            }
            gpsLock.unlock()
        }
        
        return "GPS Stopped for course \(courseId)"
    }
    
    @objc static func updateStatus(courseId: String, status: Int, vehicleNumber: String) -> String {
        coursesLock.lock()
        defer { coursesLock.unlock() }
        
        if var courseData = activeCourses[courseId] {
            courseData.status = status
            activeCourses[courseId] = courseData
            print("📊 [iOS GPS] Updated status for \(courseId) to \(status)")
            return "Status updated for \(courseId)"
        }
        
        return "Course \(courseId) not found"
    }
    
    @objc static func clearAllOnLogout() -> String {
        print("🚪 [iOS GPS] Clearing all GPS courses on logout")
        
        gpsLock.lock()
        coursesLock.lock()
        
        activeCourses.removeAll()
        
        if isGPSRunning {
            stopGPSTracking()
            isGPSRunning = false
            endBackgroundTask()
            hideGPSNotification()
        }
        
        coursesLock.unlock()
        gpsLock.unlock()
        
        return "All GPS courses cleared"
    }
    
    // MARK: - Private GPS Implementation
    
    private static func setupLocationManager() {
        locationManager = CLLocationManager()
        locationManager?.delegate = BackgroundGPSServiceDelegate.shared
        locationManager?.desiredAccuracy = kCLLocationAccuracyBest
        locationManager?.distanceFilter = 5 // meters
        
        // Request permissions
        locationManager?.requestAlwaysAuthorization()
        
        // Enable background location
        if #available(iOS 9.0, *) {
            locationManager?.allowsBackgroundLocationUpdates = true
        }
    }
    
    private static func startGPSTracking() {
        print("📍 [iOS GPS] Starting location tracking")
        
        locationManager?.startUpdatingLocation()
        
        // Start timer for exact 10-second intervals
        gpsTimer = Timer.scheduledTimer(withTimeInterval: GPS_INTERVAL, repeats: true) { _ in
            processGPSData()
        }
    }
    
    private static func stopGPSTracking() {
        print("🔴 [iOS GPS] Stopping location tracking")
        
        locationManager?.stopUpdatingLocation()
        gpsTimer?.invalidate()
        gpsTimer = nil
    }
    
    private static func processGPSData() {
        guard let location = currentLocation else {
            print("⚠️ [iOS GPS] No current location available")
            return
        }
        
        coursesLock.lock()
        let courses = Array(activeCourses.values)
        coursesLock.unlock()
        
        for course in courses {
            let gpsData = createGPSData(location: location, course: course)
            
            // Send to server or queue offline
            sendGPSDataToServer(gpsData: gpsData)
        }
    }
    
    private static func createGPSData(location: CLLocation, course: CourseData) -> GPSData {
        // Romanian timestamp (UTC+2/UTC+3)
        let formatter = DateFormatter()
        formatter.timeZone = TimeZone(identifier: "Europe/Bucharest")
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        
        return GPSData(
            ikRoTrans: course.ikRoTrans,
            latitude: location.coordinate.latitude,
            longitude: location.coordinate.longitude,
            speed: max(0, location.speed * 3.6), // m/s to km/h
            heading: location.course >= 0 ? location.course : 0,
            altitude: location.altitude,
            accuracy: location.horizontalAccuracy,
            timestamp: formatter.string(from: Date()),
            vehicleNumber: course.vehicleNumber,
            batteryLevel: getBatteryLevel(),
            signalStrength: getSignalStrength(),
            status: course.status
        )
    }
    
    private static func sendGPSDataToServer(gpsData: GPSData) {
        // Implementation similar to Android's HTTP transmission
        guard let course = activeCourses[gpsData.ikRoTrans] else { return }
        
        let url = URL(string: "https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(course.token)", forHTTPHeaderField: "Authorization")
        
        let jsonData = [
            "ikRoTrans": gpsData.ikRoTrans,
            "lat": gpsData.latitude,
            "lng": gpsData.longitude,
            "speed": gpsData.speed,
            "heading": gpsData.heading,
            "altitude": gpsData.altitude,
            "accuracy": gpsData.accuracy,
            "timestamp": gpsData.timestamp,
            "vehicleNumber": gpsData.vehicleNumber,
            "batteryLevel": gpsData.batteryLevel,
            "signalStrength": gpsData.signalStrength,
            "status": gpsData.status
        ] as [String : Any]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: jsonData)
            
            URLSession.shared.dataTask(with: request) { data, response, error in
                if let error = error {
                    print("❌ [iOS GPS] HTTP Error: \(error)")
                    // Add to offline queue
                    addToOfflineQueue(gpsData: gpsData)
                } else {
                    print("✅ [iOS GPS] GPS data sent successfully")
                }
            }.resume()
            
        } catch {
            print("❌ [iOS GPS] JSON Error: \(error)")
            addToOfflineQueue(gpsData: gpsData)
        }
    }
    
    private static func addToOfflineQueue(gpsData: GPSData) {
        offlineQueueLock.lock()
        defer { offlineQueueLock.unlock() }
        
        offlineGPSQueue.append(gpsData)
        print("💾 [iOS GPS] Added to offline queue. Queue size: \(offlineGPSQueue.count)")
    }
    
    // MARK: - Background Tasks & Notifications
    
    private static func beginBackgroundTask() {
        backgroundTaskID = UIApplication.shared.beginBackgroundTask(withName: "iTrackGPS") {
            endBackgroundTask()
        }
    }
    
    private static func endBackgroundTask() {
        if backgroundTaskID != .invalid {
            UIApplication.shared.endBackgroundTask(backgroundTaskID)
            backgroundTaskID = .invalid
        }
    }
    
    private static func showGPSNotification() {
        let content = UNMutableNotificationContent()
        content.title = "iTrack GPS Activ"
        content.body = "Tracking GPS în progres..."
        content.sound = nil
        
        let request = UNNotificationRequest(identifier: "itrack_gps", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request)
    }
    
    private static func hideGPSNotification() {
        UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: ["itrack_gps"])
    }
    
    // MARK: - Utility Functions
    
    private static func getBatteryLevel() -> Int {
        UIDevice.current.isBatteryMonitoringEnabled = true
        return Int(UIDevice.current.batteryLevel * 100)
    }
    
    private static func getSignalStrength() -> Int {
        // iOS doesn't provide direct signal strength access
        // Return estimated value based on network type
        return 75 // Default value
    }
}

// Separate delegate class for location manager
class BackgroundGPSServiceDelegate: NSObject, CLLocationManagerDelegate {
    static let shared = BackgroundGPSServiceDelegate()
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        if let location = locations.last {
            BackgroundGPSService.setCurrentLocation(location)
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("❌ [iOS GPS] Location error: \(error)")
    }
}

// Extension to access current location
extension BackgroundGPSService {
    static func setCurrentLocation(_ location: CLLocation) {
        currentLocation = location
    }
}