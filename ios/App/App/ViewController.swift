//
//  ViewController.swift
//  iTrack GPS - Main View Controller
//
//  Capacitor WebView cu integrare GPS nativă
//

import UIKit
import Capacitor

class ViewController: CAPBridgeViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        print("ViewController: 🚀 iTrack GPS WebView loaded")
        
        // Configure Capacitor Bridge
        bridge?.statusBarStyle = .darkContent
        
        // Register custom iOS GPS plugin
        bridge?.registerPlugin(iOSGPSPlugin.self)
        
        print("ViewController: 📱 iOSGPS Plugin registered - window.iOSGPS available in JavaScript")
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        
        // Inject iOS GPS Bridge into JavaScript (echivalent cu window.AndroidGPS)
        let jsCode = """
            window.iOSGPS = {
                startGPS: async function(ikRoTrans, vehicleNumber, realUit, token, status) {
                    try {
                        const result = await CapacitorBridge.callNative('iOSGPS', 'startGPS', {
                            ikRoTrans: ikRoTrans,
                            vehicleNumber: vehicleNumber,
                            realUit: realUit,
                            token: token,
                            status: status || 2
                        });
                        console.log('🍎 iOS GPS Start result:', result);
                        return result.message || 'SUCCESS';
                    } catch (error) {
                        console.error('❌ iOS GPS Start error:', error);
                        return 'ERROR: ' + error.message;
                    }
                },
                
                updateStatus: async function(courseId, status, vehicleNumber) {
                    try {
                        const result = await CapacitorBridge.callNative('iOSGPS', 'updateStatus', {
                            courseId: courseId,
                            status: status,
                            vehicleNumber: vehicleNumber
                        });
                        console.log('🍎 iOS GPS Status update result:', result);
                        return result.message || 'SUCCESS';
                    } catch (error) {
                        console.error('❌ iOS GPS Status update error:', error);
                        return 'ERROR: ' + error.message;
                    }
                },
                
                stopGPS: async function(courseId) {
                    try {
                        const result = await CapacitorBridge.callNative('iOSGPS', 'stopGPS', {
                            courseId: courseId
                        });
                        console.log('🍎 iOS GPS Stop result:', result);
                        return result.message || 'SUCCESS';
                    } catch (error) {
                        console.error('❌ iOS GPS Stop error:', error);
                        return 'ERROR: ' + error.message;
                    }
                },
                
                clearAllOnLogout: async function() {
                    try {
                        const result = await CapacitorBridge.callNative('iOSGPS', 'clearAllOnLogout', {});
                        console.log('🍎 iOS GPS Clear all result:', result);
                        return result.message || 'SUCCESS';
                    } catch (error) {
                        console.error('❌ iOS GPS Clear all error:', error);
                        return 'ERROR: ' + error.message;
                    }
                },
                
                markManualPause: async function(ikRoTransKey) {
                    try {
                        const result = await CapacitorBridge.callNative('iOSGPS', 'markManualPause', {
                            ikRoTransKey: ikRoTransKey
                        });
                        console.log('🍎 iOS GPS Manual pause result:', result);
                        return result.message || 'SUCCESS';
                    } catch (error) {
                        console.error('❌ iOS GPS Manual pause error:', error);
                        return 'ERROR: ' + error.message;
                    }
                },
                
                showPersistentNotification: async function(title, message, persistent) {
                    try {
                        const result = await CapacitorBridge.callNative('iOSGPS', 'showPersistentNotification', {
                            title: title || 'iTrack GPS',
                            message: message || 'GPS tracking active',
                            persistent: persistent !== false
                        });
                        console.log('🍎 iOS Persistent notification result:', result);
                    } catch (error) {
                        console.error('❌ iOS Persistent notification error:', error);
                    }
                },
                
                hidePersistentNotification: async function() {
                    try {
                        const result = await CapacitorBridge.callNative('iOSGPS', 'hidePersistentNotification', {});
                        console.log('🍎 iOS Hide notification result:', result);
                    } catch (error) {
                        console.error('❌ iOS Hide notification error:', error);
                    }
                },
                
                showQuickNotification: async function(title, message, duration) {
                    try {
                        const result = await CapacitorBridge.callNative('iOSGPS', 'showQuickNotification', {
                            title: title || 'iTrack GPS',
                            message: message || 'Notification',
                            duration: duration || 5000
                        });
                        console.log('🍎 iOS Quick notification result:', result);
                    } catch (error) {
                        console.error('❌ iOS Quick notification error:', error);
                    }
                }
            };
            
            // Debug log
            console.log('🍎 === iOS GPS BRIDGE INITIALIZED ===');
            console.log('🍎 window.iOSGPS available with methods:', Object.keys(window.iOSGPS));
        """
        
        // Execute JavaScript injection
        webView?.evaluateJavaScript(jsCode) { (result, error) in
            if let error = error {
                print("ViewController: ❌ JavaScript injection error: \(error.localizedDescription)")
            } else {
                print("ViewController: ✅ iOS GPS Bridge injected successfully into WebView")
            }
        }
    }
}