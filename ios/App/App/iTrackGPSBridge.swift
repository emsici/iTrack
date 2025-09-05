import Foundation
import Capacitor
import UIKit
import WebKit

// iTrack GPS iOS JavaScript Bridge
// Port direct din MainActivity.java pentru compatibilitate completă
@objc class iTrackGPSBridge: NSObject {
    
    private weak var webView: WKWebView?
    private var isGPSBridgeAdded = false
    
    init(webView: WKWebView) {
        self.webView = webView
        super.init()
        setupGPSBridge()
    }
    
    private func setupGPSBridge() {
        guard let webView = webView else { return }
        
        print("🔧 [iOS Bridge] Setting up iTrack GPS JavaScript Bridge...")
        
        // Add JavaScript interface equivalent to Android's addJavascriptInterface
        let contentController = webView.configuration.userContentController
        contentController.add(self, name: "iOSGPSBridge")
        
        // Inject AndroidGPS object for compatibility with existing JavaScript
        let jsCode = """
        window.AndroidGPS = {
            startGPS: function(ikRoTrans, vehicleNumber, realUit, token, status) {
                window.webkit.messageHandlers.iOSGPSBridge.postMessage({
                    method: 'startGPS',
                    ikRoTrans: ikRoTrans,
                    vehicleNumber: vehicleNumber,
                    realUit: realUit,
                    token: token,
                    status: status
                });
                return 'GPS Started from iOS';
            },
            
            stopGPS: function(courseId) {
                window.webkit.messageHandlers.iOSGPSBridge.postMessage({
                    method: 'stopGPS',
                    courseId: courseId
                });
                return 'GPS Stopped from iOS';
            },
            
            updateStatus: function(courseId, status, vehicleNumber) {
                window.webkit.messageHandlers.iOSGPSBridge.postMessage({
                    method: 'updateStatus',
                    courseId: courseId,
                    status: status,
                    vehicleNumber: vehicleNumber
                });
                return 'Status Updated from iOS';
            },
            
            clearAllOnLogout: function() {
                window.webkit.messageHandlers.iOSGPSBridge.postMessage({
                    method: 'clearAllOnLogout'
                });
                return 'All Cleared from iOS';
            },
            
            markManualPause: function(ikRoTrans) {
                window.webkit.messageHandlers.iOSGPSBridge.postMessage({
                    method: 'markManualPause',
                    ikRoTrans: ikRoTrans
                });
                return 'Manual Pause Marked from iOS';
            }
        };
        
        // Set flags for JavaScript compatibility
        window.AndroidGPSReady = true;
        window.androidGPSBridgeReady = true;
        window.androidGPSInterfaceReady = true;
        window.androidGPSVerified = true;
        
        console.log('✅ [iOS Bridge] AndroidGPS interface ready');
        """
        
        let userScript = WKUserScript(source: jsCode, injectionTime: .atDocumentEnd, forMainFrameOnly: false)
        contentController.addUserScript(userScript)
        
        isGPSBridgeAdded = true
        print("✅ [iOS Bridge] iTrack GPS JavaScript Bridge setup completed")
    }
}

// MARK: - WKScriptMessageHandler
extension iTrackGPSBridge: WKScriptMessageHandler {
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "iOSGPSBridge",
              let messageBody = message.body as? [String: Any],
              let method = messageBody["method"] as? String else {
            print("❌ [iOS Bridge] Invalid message format")
            return
        }
        
        print("📱 [iOS Bridge] Received GPS command: \(method)")
        
        switch method {
        case "startGPS":
            handleStartGPS(messageBody)
        case "stopGPS":
            handleStopGPS(messageBody)
        case "updateStatus":
            handleUpdateStatus(messageBody)
        case "clearAllOnLogout":
            handleClearAllOnLogout()
        case "markManualPause":
            handleMarkManualPause(messageBody)
        default:
            print("❌ [iOS Bridge] Unknown method: \(method)")
        }
    }
    
    // MARK: - GPS Command Handlers
    
    private func handleStartGPS(_ params: [String: Any]) {
        guard let ikRoTrans = params["ikRoTrans"] as? String,
              let vehicleNumber = params["vehicleNumber"] as? String,
              let realUit = params["realUit"] as? String,
              let token = params["token"] as? String,
              let status = params["status"] as? Int else {
            print("❌ [iOS Bridge] Invalid startGPS parameters")
            return
        }
        
        let result = BackgroundGPSService.startGPS(
            ikRoTrans: ikRoTrans,
            vehicleNumber: vehicleNumber,
            realUit: realUit,
            token: token,
            status: status
        )
        
        print("✅ [iOS Bridge] StartGPS result: \(result)")
        
        // Send result back to JavaScript (if needed)
        sendMessageToJS(method: "onGPSStarted", data: ["result": result, "courseId": ikRoTrans])
    }
    
    private func handleStopGPS(_ params: [String: Any]) {
        guard let courseId = params["courseId"] as? String else {
            print("❌ [iOS Bridge] Invalid stopGPS parameters")
            return
        }
        
        let result = BackgroundGPSService.stopGPS(courseId: courseId)
        print("✅ [iOS Bridge] StopGPS result: \(result)")
        
        sendMessageToJS(method: "onGPSStopped", data: ["result": result, "courseId": courseId])
    }
    
    private func handleUpdateStatus(_ params: [String: Any]) {
        guard let courseId = params["courseId"] as? String,
              let status = params["status"] as? Int,
              let vehicleNumber = params["vehicleNumber"] as? String else {
            print("❌ [iOS Bridge] Invalid updateStatus parameters")
            return
        }
        
        let result = BackgroundGPSService.updateStatus(
            courseId: courseId,
            status: status,
            vehicleNumber: vehicleNumber
        )
        
        print("✅ [iOS Bridge] UpdateStatus result: \(result)")
        sendMessageToJS(method: "onStatusUpdated", data: ["result": result, "courseId": courseId, "status": status])
    }
    
    private func handleClearAllOnLogout() {
        let result = BackgroundGPSService.clearAllOnLogout()
        print("✅ [iOS Bridge] ClearAllOnLogout result: \(result)")
        
        sendMessageToJS(method: "onAllCleared", data: ["result": result])
    }
    
    private func handleMarkManualPause(_ params: [String: Any]) {
        guard let ikRoTrans = params["ikRoTrans"] as? String else {
            print("❌ [iOS Bridge] Invalid markManualPause parameters")
            return
        }
        
        // Manual pause logic (if needed in iOS)
        print("✅ [iOS Bridge] Manual pause marked for: \(ikRoTrans)")
        sendMessageToJS(method: "onManualPauseMarked", data: ["courseId": ikRoTrans])
    }
    
    // MARK: - JavaScript Communication
    
    private func sendMessageToJS(method: String, data: [String: Any]) {
        guard let webView = webView else { return }
        
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: data)
            let jsonString = String(data: jsonData, encoding: .utf8) ?? "{}"
            
            let jsCode = """
            if (window.AndroidGPS && window.AndroidGPS.onGPSMessage) {
                window.AndroidGPS.onGPSMessage(JSON.stringify({
                    method: '\(method)',
                    data: \(jsonString)
                }));
            }
            """
            
            DispatchQueue.main.async {
                webView.evaluateJavaScript(jsCode) { result, error in
                    if let error = error {
                        print("❌ [iOS Bridge] JavaScript execution error: \(error)")
                    }
                }
            }
        } catch {
            print("❌ [iOS Bridge] JSON serialization error: \(error)")
        }
    }
}