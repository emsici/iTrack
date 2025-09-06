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
        
        // FIX: Folosește Capacitor.Plugins standard pentru iOS GPS Bridge
        let jsCode = """
            // Așteaptă ca Capacitor să se încarce
            setTimeout(() => {
                if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.iOSGPS) {
                    // Mapează plugin-ul Capacitor la window.iOSGPS pentru compatibilitate
                    window.iOSGPS = {
                        startGPS: async function(ikRoTransKey, vehicleNumber, realUit, token, status) {
                            try {
                                const result = await window.Capacitor.Plugins.iOSGPS.startGPS({
                                    ikRoTrans: ikRoTransKey,
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
                        
                        updateStatus: async function(ikRoTransKey, status, vehicleNumber) {
                            try {
                                const result = await window.Capacitor.Plugins.iOSGPS.updateStatus({
                                    courseId: ikRoTransKey,
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
                        
                        stopGPS: async function(ikRoTransKey) {
                            try {
                                const result = await window.Capacitor.Plugins.iOSGPS.stopGPS({
                                    courseId: ikRoTransKey
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
                                const result = await window.Capacitor.Plugins.iOSGPS.clearAllOnLogout({});
                                console.log('🍎 iOS GPS Clear all result:', result);
                                return result.message || 'SUCCESS';
                            } catch (error) {
                                console.error('❌ iOS GPS Clear all error:', error);
                                return 'ERROR: ' + error.message;
                            }
                        },
                        
                        markManualPause: async function(ikRoTransKey) {
                            try {
                                const result = await window.Capacitor.Plugins.iOSGPS.markManualPause({
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
                                const result = await window.Capacitor.Plugins.iOSGPS.showPersistentNotification({
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
                                const result = await window.Capacitor.Plugins.iOSGPS.hidePersistentNotification({});
                                console.log('🍎 iOS Hide notification result:', result);
                            } catch (error) {
                                console.error('❌ iOS Hide notification error:', error);
                            }
                        },
                        
                        showQuickNotification: async function(title, message, duration) {
                            try {
                                const result = await window.Capacitor.Plugins.iOSGPS.showQuickNotification({
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
                    
                    console.log('🍎 === iOS GPS BRIDGE INITIALIZED VIA CAPACITOR.PLUGINS ===');
                    console.log('🍎 window.iOSGPS available with methods:', Object.keys(window.iOSGPS));
                } else {
                    console.warn('🍎 Capacitor.Plugins.iOSGPS not available - retrying in 1s');
                    setTimeout(arguments.callee, 1000);
                }
            }, 500);
        """
        
        // Execute JavaScript injection
        webView?.evaluateJavaScript(jsCode) { (result, error) in
            if let error = error {
                print("ViewController: ❌ JavaScript injection error: \(error.localizedDescription)")
            } else {
                print("ViewController: ✅ iOS GPS Bridge setup successfully via Capacitor.Plugins")
            }
        }
    }
}