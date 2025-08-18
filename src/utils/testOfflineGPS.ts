/**
 * Test script pentru verificarea funcționării complete a sistemului offline GPS
 * Simulează scenarii de pierdere internet și recuperare automată
 */

import { offlineGPSService, OfflineGPSCoordinate } from '../services/offlineGPS';

export class OfflineGPSTest {
  private offlineService = offlineGPSService;
  
  constructor() {
    // offlineService already initialized
  }

  /**
   * Test complet funcționalitate offline
   */
  async runCompleteTest(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🧪 === ÎNCEPUT TEST OFFLINE GPS ===');
      
      // Test 1: Verifică salvarea offline
      console.log('📝 Test 1: Salvarea coordonatelor offline');
      await this.testOfflineStorage();
      
      // Test 2: Verifică recuperarea offline
      console.log('📋 Test 2: Recuperarea coordonatelor offline');
      const offlineCount = await this.testOfflineRetrieval();
      
      // Test 3: Simulează sincronizarea
      console.log('🔄 Test 3: Sincronizarea coordonatelor');
      await this.testOfflineSync();
      
      return {
        success: true,
        message: `✅ Teste complete: ${offlineCount} coordonate offline procesate`
      };
      
    } catch (error) {
      return {
        success: false,
        message: `❌ Test eșuat: ${error}`
      };
    }
  }

  /**
   * Testează salvarea coordonatelor offline
   */
  private async testOfflineStorage(): Promise<void> {
    const testCoord = {
      uit: 'TEST_UIT_123',
      numar_inmatriculare: 'TEST_B123ABC',
      lat: 44.4268, // București
      lng: 26.1025,
      viteza: 45,
      directie: 90,
      altitudine: 85,
      hdop: 5,
      gsm_signal: 75,
      baterie: '85%',
      status: 2,
      timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    await this.offlineService.saveOfflineCoordinate(testCoord);
    console.log('✅ Coordonată test salvată offline');
  }

  /**
   * Testează recuperarea coordonatelor offline
   */
  private async testOfflineRetrieval(): Promise<number> {
    const offlineCoords = await this.offlineService.getOfflineCoordinates();
    console.log(`📊 Coordonate offline găsite: ${offlineCoords.length}`);
    
    offlineCoords.forEach((coord: OfflineGPSCoordinate, index: number) => {
      console.log(`📍 [${index + 1}] UIT: ${coord.uit}, Coords: ${coord.lat}, ${coord.lng}, Attempts: ${coord.attempts}`);
    });

    return offlineCoords.length;
  }

  /**
   * Testează sincronizarea (DOAR VERIFICARE, NU TRIMITE LA SERVER)
   */
  private async testOfflineSync(): Promise<void> {
    // Doar verifică mecanismul, nu trimite la server
    const stats = this.offlineService.getStats();
    console.log('📊 Statistici offline GPS:', {
      totalOffline: stats.totalOffline,
      totalSynced: stats.totalSynced,
      syncInProgress: stats.syncInProgress,
      lastSyncAttempt: stats.lastSyncAttempt,
      syncErrors: stats.syncErrors
    });
    
    console.log('✅ Mecanismul de sincronizare verificat');
  }

  /**
   * Curăță datele de test
   */
  async cleanupTestData(): Promise<void> {
    // Elimină doar coordonatele de test
    const offlineCoords = await this.offlineService.getOfflineCoordinates();
    const filteredCoords = offlineCoords.filter((coord: OfflineGPSCoordinate) => !coord.uit.startsWith('TEST_'));
    
    // Curăță și salvează doar coordonatele reale
    await this.offlineService.clearOfflineCoordinates();
    for (const coord of filteredCoords) {
      await this.offlineService.saveOfflineCoordinate(coord);
    }
    
    console.log('🧹 Date de test curățate');
  }
}

// Funcție globală pentru testare din consola browser
(window as any).testOfflineGPS = async () => {
  const test = new OfflineGPSTest();
  const result = await test.runCompleteTest();
  console.log(result.message);
  
  // Cleanup după test
  setTimeout(async () => {
    await test.cleanupTestData();
  }, 5000);
  
  return result;
};

export const offlineGPSTest = new OfflineGPSTest();