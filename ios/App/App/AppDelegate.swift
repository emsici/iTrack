import UIKit
import Capacitor
import CoreLocation
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // iTrack GPS iOS - Initialize GPS and notification services
        setupGPSServices()
        setupNotificationServices()
        
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // iTrack GPS continues in background for GPS tracking
        print("📱 [iOS AppDelegate] App will resign active - GPS continues in background")
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // iTrack GPS background operation - GPS service remains active
        print("🌙 [iOS AppDelegate] App entered background - GPS tracking continues")
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Returning from background - sync any pending data
        print("🌅 [iOS AppDelegate] App will enter foreground - checking GPS sync")
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // App became active - refresh GPS status
        print("⚡ [iOS AppDelegate] App became active - GPS services ready")
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // iTrack GPS cleanup on app termination
        print("🚪 [iOS AppDelegate] App will terminate - cleaning up GPS services")
        BackgroundGPSService.clearAllOnLogout()
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
    
    // MARK: - iTrack GPS Setup Functions
    
    private func setupGPSServices() {
        // Request location permissions for GPS tracking
        print("🔧 [iOS AppDelegate] Setting up GPS services...")
        
        // Background location updates permission
        if #available(iOS 9.0, *) {
            // This will be handled by BackgroundGPSService when needed
        }
    }
    
    private func setupNotificationServices() {
        // Request notification permissions for GPS status
        print("🔔 [iOS AppDelegate] Setting up notification services...")
        
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
            if granted {
                print("✅ [iOS AppDelegate] Notification permissions granted")
            } else {
                print("❌ [iOS AppDelegate] Notification permissions denied: \(error?.localizedDescription ?? "Unknown error")")
            }
        }
    }
}