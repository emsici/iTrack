//
//  iOSGPSPlugin.swift
//  iTrack GPS - Capacitor Plugin Bridge
//
//  Bridge JavaScript-Swift identic cu window.AndroidGPS din Android
//  Expune serviciul GPS prin window.iOSGPS
//

import Foundation
import Capacitor

// MARK: - iOS GPS Plugin (echivalent cu AndroidGPS din MainActivity.java)
@objc(iOSGPSPlugin)
public class iOSGPSPlugin: CAPPlugin {
    private let gpsService = BackgroundGPSService.shared
    private let TAG = "iOSGPS_Plugin"
    
    override public func load() {
        print("\(TAG): 🚀 iOSGPSPlugin loaded - bridge JavaScript-Swift pregătit")
    }
    
    // MARK: - START GPS (identic cu startGPS din Android)
    @objc func startGPS(_ call: CAPPluginCall) {
        let ikRoTrans = call.getString("ikRoTrans") ?? ""
        let vehicleNumber = call.getString("vehicleNumber") ?? ""
        let realUit = call.getString("realUit") ?? ikRoTrans
        let token = call.getString("token") ?? ""
        let status = call.getInt("status") ?? 2
        
        print("\(TAG): 📱 START GPS called from JavaScript:")
        print("\(TAG):    ikRoTrans: \(ikRoTrans)")
        print("\(TAG):    vehicleNumber: \(vehicleNumber)")
        print("\(TAG):    realUit: \(realUit)")
        print("\(TAG):    status: \(status)")
        
        let result = gpsService.startGPS(
            courseId: ikRoTrans,
            vehicleNumber: vehicleNumber,
            realUit: realUit,
            token: token,
            status: status
        )
        
        call.resolve([
            "success": true,
            "message": result
        ])
    }
    
    // MARK: - UPDATE STATUS (identic cu updateStatus din Android)
    @objc func updateStatus(_ call: CAPPluginCall) {
        let courseId = call.getString("courseId") ?? ""
        let status = call.getInt("status") ?? 0
        let vehicleNumber = call.getString("vehicleNumber") ?? ""
        
        print("\(TAG): 🔄 UPDATE STATUS called from JavaScript:")
        print("\(TAG):    courseId: \(courseId)")
        print("\(TAG):    status: \(status)")
        print("\(TAG):    vehicleNumber: \(vehicleNumber)")
        
        let result = gpsService.updateStatus(
            courseId: courseId,
            newStatus: status,
            vehicleNumber: vehicleNumber
        )
        
        call.resolve([
            "success": true,
            "message": result
        ])
    }
    
    // MARK: - STOP GPS (identic cu stopGPS din Android)
    @objc func stopGPS(_ call: CAPPluginCall) {
        let courseId = call.getString("courseId") ?? ""
        
        print("\(TAG): 🛑 STOP GPS called from JavaScript for courseId: \(courseId)")
        
        let result = gpsService.stopGPS(courseId: courseId)
        
        call.resolve([
            "success": true,
            "message": result
        ])
    }
    
    // MARK: - CLEAR ALL ON LOGOUT (identic cu clearAllOnLogout din Android)
    @objc func clearAllOnLogout(_ call: CAPPluginCall) {
        print("\(TAG): 🧹 CLEAR ALL called from JavaScript")
        
        let result = gpsService.clearAllOnLogout()
        
        call.resolve([
            "success": true,
            "message": result
        ])
    }
    
    // MARK: - MARK MANUAL PAUSE (identic cu markManualPause din Android)
    @objc func markManualPause(_ call: CAPPluginCall) {
        let ikRoTransKey = call.getString("ikRoTransKey") ?? ""
        
        print("\(TAG): 🔶 MARK MANUAL PAUSE called from JavaScript for key: \(ikRoTransKey)")
        
        let result = gpsService.markManualPause(ikRoTransKey: ikRoTransKey)
        
        call.resolve([
            "success": true,
            "message": result
        ])
    }
    
    // MARK: - SHOW PERSISTENT NOTIFICATION (identic cu Android notifications)
    @objc func showPersistentNotification(_ call: CAPPluginCall) {
        let title = call.getString("title") ?? "iTrack GPS"
        let message = call.getString("message") ?? "GPS tracking active"
        let persistent = call.getBool("persistent") ?? true
        
        print("\(TAG): 🔔 SHOW PERSISTENT NOTIFICATION: \(title) - \(message)")
        
        gpsService.showPersistentNotification()
        
        call.resolve([
            "success": true,
            "message": "Persistent notification displayed"
        ])
    }
    
    // MARK: - HIDE PERSISTENT NOTIFICATION
    @objc func hidePersistentNotification(_ call: CAPPluginCall) {
        print("\(TAG): 🔕 HIDE PERSISTENT NOTIFICATION called")
        
        gpsService.hidePersistentNotification()
        
        call.resolve([
            "success": true,
            "message": "Persistent notification hidden"
        ])
    }
    
    // MARK: - SHOW QUICK NOTIFICATION (identic cu Android)
    @objc func showQuickNotification(_ call: CAPPluginCall) {
        let title = call.getString("title") ?? "iTrack GPS"
        let message = call.getString("message") ?? "Notification"
        let duration = call.getInt("duration") ?? 5000
        
        print("\(TAG): 🔔 SHOW QUICK NOTIFICATION: \(title) - \(message) (\(duration)ms)")
        
        gpsService.showQuickNotification(title: title, message: message, duration: duration)
        
        call.resolve([
            "success": true,
            "message": "Quick notification sent"
        ])
    }
}