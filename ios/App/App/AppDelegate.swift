//
//  AppDelegate.swift
//  iTrack GPS - iOS App Delegate
//
//  Integrare BackgroundGPSService în ciclul de viață al aplicației
//

import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    var window: UIWindow?
    
    // GPS Service pentru întreaga aplicație
    private let gpsService = BackgroundGPSService.shared
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        // Capacitor setup
        self.window = UIWindow(frame: UIScreen.main.bounds)
        self.window?.rootViewController = ViewController()
        self.window?.makeKeyAndVisible()
        
        // GPS Service initialization
        print("AppDelegate: 🚀 iTrack GPS iOS starting - BackgroundGPSService pregătit")
        
        // Request background app refresh permission
        application.setMinimumBackgroundFetchInterval(UIApplication.backgroundFetchIntervalMinimum)
        
        return true
    }
    
    // MARK: - Background App Refresh (pentru GPS continuu)
    func application(_ application: UIApplication, performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        print("AppDelegate: 📱 Background fetch triggered - GPS poate continua")
        completionHandler(.newData)
    }
    
    // MARK: - Application Lifecycle pentru GPS
    func applicationDidEnterBackground(_ application: UIApplication) {
        print("AppDelegate: 📱 App entered background - GPS continuă în fundal")
        // GPS Service continuă automat în background datorită location updates
    }
    
    func applicationWillEnterForeground(_ application: UIApplication) {
        print("AppDelegate: 📱 App will enter foreground - GPS activ")
    }
    
    func applicationDidBecomeActive(_ application: UIApplication) {
        print("AppDelegate: 📱 App became active")
    }
    
    func applicationWillResignActive(_ application: UIApplication) {
        print("AppDelegate: 📱 App will resign active")
    }
    
    func applicationWillTerminate(_ application: UIApplication) {
        print("AppDelegate: 📱 App will terminate - GPS cleanup")
        // GPS Service va fi oprit automat de sistem
    }
    
    // MARK: - UISceneSession Lifecycle
    @available(iOS 13.0, *)
    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }
    
    @available(iOS 13.0, *)
    func application(_ application: UIApplication, didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {
        // Called when the user discards a scene session
    }
}