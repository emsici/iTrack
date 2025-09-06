//
//  BackgroundGPSService+OfflineSync.swift
//  iTrack GPS - Offline GPS Sync pentru iOS (FIX COMPLET)
//
//  FIXED: Toate problemele critice identificate de advisor
//

import Foundation
import Network

// MARK: - Static Storage Holder (SWIFT EXTENSION FIX)
private struct OfflineSyncHolder {
    static let offlineQueue = DispatchQueue(label: "com.euscagency.itrack.offline", qos: .background)
    static var networkMonitor: NWPathMonitor?
    static let networkQueue = DispatchQueue(label: "com.euscagency.itrack.network", qos: .background)
}

// MARK: - Offline Sync Extension (FIXED pentru compile + reliability)
extension BackgroundGPSService {
    
    private var offlineQueueURL: URL {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        return documentsPath.appendingPathComponent("gps_offline_queue.json")
    }
    
    // FIXED: HTTP method with completion pentru retry logic
    private func sendGPSHTTP(gpsData: [String: Any], completion: @escaping (Bool) -> Void) {
        guard let jsonData = try? JSONSerialization.data(withJSONObject: gpsData),
              let url = URL(string: "https://www.euscagency.com/etsm_prod/platforme/transport/apk/gps.php") else {
            completion(false)
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(globalToken ?? "")", forHTTPHeaderField: "Authorization")
        request.httpBody = jsonData
        request.timeoutInterval = 30
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            let httpResponse = response as? HTTPURLResponse
            let statusCode = httpResponse?.statusCode ?? 0
            let success = (200...299).contains(statusCode) && error == nil
            
            if success {
                print("✅ iOS GPS HTTP SUCCESS: \(statusCode)")
            } else {
                print("❌ iOS GPS HTTP FAILED: \(statusCode), error: \(error?.localizedDescription ?? "unknown")")
            }
            
            completion(success)
        }.resume()
    }
    
    // FIXED: Salvează GPS data offline când HTTP eșuează
    func saveGPSDataOffline(_ gpsData: [String: Any], for courseId: String) {
        let timestamp = getRomanianTimestamp()
        let offlineEntry: [String: Any] = [
            "timestamp": timestamp,
            "courseId": courseId,
            "gpsData": gpsData,
            "retryCount": 0,
            "createdAt": Date().timeIntervalSince1970,
            "nextAttemptAt": Date().timeIntervalSince1970 // Poate fi încercat imediat
        ]
        
        OfflineSyncHolder.offlineQueue.async { [weak self] in
            guard let self = self else { return }
            
            var offlineQueue = self.loadOfflineQueue()
            offlineQueue.append(offlineEntry)
            
            // Cap queue size (max 1000 entries pentru iOS)
            if offlineQueue.count > 1000 {
                offlineQueue.removeFirst(offlineQueue.count - 1000)
            }
            
            self.saveOfflineQueue(offlineQueue)
            print("💾 iOS GPS OFFLINE SAVE: \(courseId) @ \(timestamp)")
            
            // Încercă sync imediat dacă network e disponibil
            self.attemptOfflineSync()
        }
    }
    
    // FIXED: Încarcă queue offline din storage
    private func loadOfflineQueue() -> [[String: Any]] {
        guard FileManager.default.fileExists(atPath: offlineQueueURL.path),
              let data = try? Data(contentsOf: offlineQueueURL),
              let jsonObject = try? JSONSerialization.jsonObject(with: data),
              let queue = jsonObject as? [[String: Any]] else {
            return []
        }
        return queue
    }
    
    // FIXED: Salvează queue offline în storage
    private func saveOfflineQueue(_ queue: [[String: Any]]) {
        do {
            let data = try JSONSerialization.data(withJSONObject: queue, options: .prettyPrinted)
            try data.write(to: offlineQueueURL)
        } catch {
            print("❌ iOS GPS Offline Queue Save Error: \(error.localizedDescription)")
        }
    }
    
    // FIXED: Sync offline data cu EXPONENTIAL BACKOFF real
    func attemptOfflineSync() {
        OfflineSyncHolder.offlineQueue.async { [weak self] in
            guard let self = self else { return }
            
            let offlineQueue = self.loadOfflineQueue()
            guard !offlineQueue.isEmpty else { return }
            
            print("🔄 iOS GPS Offline Sync: \(offlineQueue.count) entries to process")
            
            var successCount = 0
            var remainingQueue: [[String: Any]] = []
            let now = Date().timeIntervalSince1970
            
            for entry in offlineQueue {
                guard let gpsData = entry["gpsData"] as? [String: Any],
                      let courseId = entry["courseId"] as? String,
                      let createdAt = entry["createdAt"] as? TimeInterval,
                      let retryCount = entry["retryCount"] as? Int else {
                    continue
                }
                
                // Skip entries older than 24 hours
                if now - createdAt > 24 * 3600 {
                    print("⏰ iOS GPS Offline: Discarding old entry for \(courseId)")
                    continue
                }
                
                // Skip entries with too many retry attempts
                if retryCount >= 5 {
                    print("🚫 iOS GPS Offline: Max retries reached for \(courseId)")
                    continue
                }
                
                // FIXED: EXPONENTIAL BACKOFF - Check if entry can be retried now
                let nextAttemptAt = entry["nextAttemptAt"] as? TimeInterval ?? 0
                if now < nextAttemptAt {
                    remainingQueue.append(entry) // Too early, keep in queue
                    continue
                }
                
                // Sincronizare HTTP cu semaphore pentru async completion
                let semaphore = DispatchSemaphore(value: 0)
                var syncSuccess = false
                
                self.sendGPSHTTP(gpsData: gpsData) { success in
                    syncSuccess = success
                    semaphore.signal()
                }
                
                // Wait for HTTP completion (timeout 30s)
                _ = semaphore.wait(timeout: .now() + 30)
                
                if syncSuccess {
                    successCount += 1
                    print("✅ iOS GPS Offline Sync SUCCESS: \(courseId)")
                } else {
                    // FIXED: EXPONENTIAL BACKOFF calculation
                    let backoffSeconds = min(pow(2.0, Double(retryCount)) * 10, 600) // Max 10min
                    let nextAttempt = now + backoffSeconds
                    
                    var updatedEntry = entry
                    updatedEntry["retryCount"] = retryCount + 1
                    updatedEntry["nextAttemptAt"] = nextAttempt
                    remainingQueue.append(updatedEntry)
                    
                    print("❌ iOS GPS Offline Sync FAILED: \(courseId) (retry \(retryCount + 1), next attempt in \(Int(backoffSeconds))s)")
                }
            }
            
            // Update offline queue cu remaining entries
            self.saveOfflineQueue(remainingQueue)
            
            if successCount > 0 {
                print("✅ iOS GPS Offline Sync Complete: \(successCount) entries sent, \(remainingQueue.count) remaining")
            }
        }
    }
    
    // FIXED: Network monitoring cu NWPathMonitor real
    func setupNetworkMonitoring() {
        OfflineSyncHolder.networkMonitor = NWPathMonitor()
        
        OfflineSyncHolder.networkMonitor?.pathUpdateHandler = { [weak self] path in
            if path.status == .satisfied {
                print("📶 iOS GPS Network AVAILABLE - attempting offline sync")
                self?.attemptOfflineSync()
            } else {
                print("📶 iOS GPS Network UNAVAILABLE")
            }
        }
        
        OfflineSyncHolder.networkMonitor?.start(queue: BackgroundGPSService.networkQueue)
        print("📶 iOS GPS Network Monitoring setup cu NWPathMonitor")
    }
    
    func stopNetworkMonitoring() {
        OfflineSyncHolder.networkMonitor?.cancel()
        OfflineSyncHolder.networkMonitor = nil
        print("📶 iOS GPS Network Monitoring stopped")
    }
    
    // MARK: - App lifecycle triggers pentru sync
    func triggerAppForegroundSync() {
        print("📱 iOS GPS App Foreground - attempting offline sync")
        attemptOfflineSync()
    }
    
    // MARK: - Cleanup and Stats (cu course cleanup)
    func getOfflineQueueStats() -> [String: Any] {
        let queue = loadOfflineQueue()
        let totalEntries = queue.count
        let oldEntries = queue.filter { entry in
            guard let createdAt = entry["createdAt"] as? TimeInterval else { return false }
            return Date().timeIntervalSince1970 - createdAt > 24 * 3600
        }.count
        
        let fileSizeBytes = (try? FileManager.default.attributesOfItem(atPath: offlineQueueURL.path)[.size] as? Int64) ?? 0
        
        return [
            "totalEntries": totalEntries,
            "oldEntries": oldEntries,
            "queueSizeMB": fileSizeBytes / 1024 / 1024
        ]
    }
    
    func clearAllOfflineData() {
        OfflineSyncHolder.offlineQueue.async { [weak self] in
            guard let self = self else { return }
            
            // Clear offline queue file
            try? FileManager.default.removeItem(at: self.offlineQueueURL)
            
            // Stop network monitoring
            self.stopNetworkMonitoring()
            
            print("🧹 iOS GPS Offline: All data cleared (logout)")
        }
    }
}