//
//  BackgroundGPSService+OfflineSync.swift
//  iTrack GPS - Offline GPS Sync pentru iOS
//
//  Implementare identică cu Android pentru sync offline GPS data
//

import Foundation

// MARK: - Offline Sync Extension (identic cu Android)
extension BackgroundGPSService {
    
    private var offlineQueueURL: URL {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        return documentsPath.appendingPathComponent("gps_offline_queue.json")
    }
    
    // Salvează GPS data offline când HTTP eșuează (identic cu Android)
    func saveGPSDataOffline(_ gpsData: [String: Any], for courseId: String) {
        let timestamp = getRomanianTimestamp()
        let offlineEntry = [
            "timestamp": timestamp,
            "courseId": courseId,
            "gpsData": gpsData,
            "retryCount": 0,
            "createdAt": Date().timeIntervalSince1970
        ] as [String : Any]
        
        // Thread-safe offline queue operations
        serialQueue.async { [weak self] in
            guard let self = self else { return }
            
            var offlineQueue = self.loadOfflineQueue()
            offlineQueue.append(offlineEntry)
            
            // Cap queue size (max 1000 entries pentru iOS)
            if offlineQueue.count > 1000 {
                offlineQueue.removeFirst(offlineQueue.count - 1000)
            }
            
            self.saveOfflineQueue(offlineQueue)
            
            print("📱 iOS GPS OFFLINE SAVE: \(courseId) @ \(timestamp)")
            
            // Încearc\u0103 sync imediat
            self.attemptOfflineSync()
        }
    }
    
    // \u00cencarcă queue offline din storage
    private func loadOfflineQueue() -> [[String: Any]] {
        guard FileManager.default.fileExists(atPath: offlineQueueURL.path),
              let data = try? Data(contentsOf: offlineQueueURL),
              let jsonObject = try? JSONSerialization.jsonObject(with: data),
              let queue = jsonObject as? [[String: Any]] else {
            return []
        }
        return queue
    }
    
    // Salvează queue offline în storage
    private func saveOfflineQueue(_ queue: [[String: Any]]) {
        do {
            let data = try JSONSerialization.data(withJSONObject: queue)
            try data.write(to: offlineQueueURL)
        } catch {
            print("❌ iOS GPS Offline Queue Save Error: \(error.localizedDescription)")
        }
    }
    
    // Sync offline data la server (identic cu Android)
    func attemptOfflineSync() {
        serialQueue.async { [weak self] in
            guard let self = self else { return }
            
            let offlineQueue = self.loadOfflineQueue()
            guard !offlineQueue.isEmpty else { return }
            
            print("🔄 iOS GPS Offline Sync: \(offlineQueue.count) entries to process")
            
            var successCount = 0
            var remainingQueue: [[String: Any]] = []
            
            for entry in offlineQueue {
                guard let gpsData = entry["gpsData"] as? [String: Any],
                      let courseId = entry["courseId"] as? String,
                      let createdAt = entry["createdAt"] as? TimeInterval,
                      let retryCount = entry["retryCount"] as? Int else {
                    continue
                }
                
                // Skip entries older than 24 hours
                if Date().timeIntervalSince1970 - createdAt > 24 * 3600 {
                    print("⏰ iOS GPS Offline: Discarding old entry for \(courseId)")
                    continue
                }
                
                // Skip entries with too many retry attempts
                if retryCount >= 5 {
                    print("🚫 iOS GPS Offline: Max retries reached for \(courseId)")
                    continue
                }
                
                // Încercare sync HTTP
                let semaphore = DispatchSemaphore(value: 0)
                var syncSuccess = false
                
                self.transmitGPSData(gpsData) { success in
                    syncSuccess = success
                    if success {
                        successCount += 1
                        print("✅ iOS GPS Offline Sync SUCCESS: \(courseId)")
                    } else {
                        // Increment retry count și păstrează în queue
                        var updatedEntry = entry
                        updatedEntry["retryCount"] = retryCount + 1
                        remainingQueue.append(updatedEntry)
                        print("❌ iOS GPS Offline Sync FAILED: \(courseId) (retry \(retryCount + 1))")
                    }
                    semaphore.signal()
                }
                
                // Wait for HTTP completion (timeout 30s)
                _ = semaphore.wait(timeout: .now() + 30)
            }
            
            // Update offline queue cu remaining entries
            self.saveOfflineQueue(remainingQueue)
            
            if successCount > 0 {
                print("✅ iOS GPS Offline Sync Complete: \(successCount) entries sent, \(remainingQueue.count) remaining")
            }
        }
    }
    
    // MARK: - Network Status Monitoring (pentru auto-sync)
    func setupNetworkMonitoring() {
        // Monitor network changes pentru auto-sync când devine disponibil
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(networkStatusChanged),
            name: NSNotification.Name("NetworkStatusChanged"),
            object: nil
        )
        
        print("📶 iOS GPS Network Monitoring setup pentru offline sync")
    }
    
    @objc private func networkStatusChanged() {
        print("📶 iOS GPS Network Status Changed - attempting offline sync")
        attemptOfflineSync()
    }
    
    // MARK: - Cleanup and Stats
    func getOfflineQueueStats() -> [String: Any] {
        let queue = loadOfflineQueue()
        let totalEntries = queue.count
        let oldEntries = queue.filter { entry in
            guard let createdAt = entry["createdAt"] as? TimeInterval else { return false }
            return Date().timeIntervalSince1970 - createdAt > 24 * 3600
        }.count
        
        return [
            "totalEntries": totalEntries,
            "oldEntries": oldEntries,
            "queueSizeMB": (try? FileManager.default.attributesOfItem(atPath: offlineQueueURL.path)[.size] as? Int64) ?? 0 / 1024 / 1024
        ]
    }
    
    func clearOldOfflineEntries() {
        serialQueue.async { [weak self] in
            guard let self = self else { return }
            
            let queue = self.loadOfflineQueue()
            let cleanQueue = queue.filter { entry in
                guard let createdAt = entry["createdAt"] as? TimeInterval else { return false }
                return Date().timeIntervalSince1970 - createdAt <= 24 * 3600
            }
            
            if cleanQueue.count < queue.count {
                self.saveOfflineQueue(cleanQueue)
                print("🧹 iOS GPS Offline: Cleaned \(queue.count - cleanQueue.count) old entries")
            }
        }
    }
}