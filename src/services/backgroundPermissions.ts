/**
 * Serviciu pentru gestionarea permisiunilor background location
 * Asigură compliance cu Android 10+ și Play Store policies
 */

import { Geolocation, PermissionStatus } from '@capacitor/geolocation';
import { Device, DeviceInfo } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

export interface PermissionState {
  location: PermissionStatus;
  backgroundLocation: 'granted' | 'denied' | 'prompt' | 'unknown';
  batteryOptimization: 'whitelisted' | 'not-whitelisted' | 'unknown';
  isLocationEnabled: boolean;
  needsManualSteps: boolean;
  deviceInfo: DeviceInfo | null;
}

export interface BackgroundLocationSetupSteps {
  step: number;
  title: string;
  description: string;
  action: () => Promise<boolean>;
  isCompleted: boolean;
  isRequired: boolean;
}

class BackgroundPermissionsService {
  private static instance: BackgroundPermissionsService;
  private deviceInfo: DeviceInfo | null = null;
  private currentState: PermissionState | null = null;

  public static getInstance(): BackgroundPermissionsService {
    if (!BackgroundPermissionsService.instance) {
      BackgroundPermissionsService.instance = new BackgroundPermissionsService();
    }
    return BackgroundPermissionsService.instance;
  }

  async initialize(): Promise<void> {
    console.log('🔐 Inițializez serviciul de permisiuni background...');
    try {
      this.deviceInfo = await Device.getInfo();
      console.log(`📱 Dispozitiv: ${this.deviceInfo.manufacturer} ${this.deviceInfo.model}, Android ${this.deviceInfo.osVersion}`);
    } catch (error) {
      console.error('❌ Eroare obținere info dispozitiv:', error);
    }
  }

  async checkAllPermissions(): Promise<PermissionState> {
    console.log('🔍 Verific toate permisiunile pentru background location...');
    
    let locationPermission: PermissionStatus = { location: 'denied', coarseLocation: 'denied' };
    let isLocationEnabled = false;
    
    try {
      // Verifică permisiunile de localizare
      locationPermission = await Geolocation.checkPermissions();
      console.log('📍 Stare permisiuni location:', locationPermission);

      // Testează dacă location services sunt active
      try {
        await Geolocation.getCurrentPosition({ timeout: 3000 });
        isLocationEnabled = true;
      } catch (error) {
        isLocationEnabled = false;
        console.log('⚠️ Location services nu sunt disponibile');
      }
    } catch (error) {
      console.error('❌ Eroare verificare permisiuni location:', error);
    }

    // Pentru Android, verifică background location status
    let backgroundLocationStatus: 'granted' | 'denied' | 'prompt' | 'unknown' = 'unknown';
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      backgroundLocationStatus = await this.checkBackgroundLocationStatus();
    }

    // Verifică battery optimization status
    const batteryOptimization = await this.checkBatteryOptimizationStatus();

    this.currentState = {
      location: locationPermission,
      backgroundLocation: backgroundLocationStatus,
      batteryOptimization,
      isLocationEnabled,
      needsManualSteps: this.requiresManualSteps(locationPermission, backgroundLocationStatus),
      deviceInfo: this.deviceInfo
    };

    console.log('📊 Stare completă permisiuni:', this.currentState);
    return this.currentState;
  }

  private async checkBackgroundLocationStatus(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> {
    try {
      // Pe Android, verifică prin Capacitor plugin
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        try {
          const result = await (window as any).CapacitorCustomPlugin.PermissionsHelper.checkBackgroundLocation();
          return result.status;
        } catch (error) {
          console.log('Plugin PermissionsHelper nu e disponibil, folosesc fallback');
        }
      }
      
      // Fallback: dacă avem ACCESS_FINE_LOCATION dar nu știm sigur background
      if (this.deviceInfo && parseInt(this.deviceInfo.osVersion) >= 10) {
        return 'prompt'; // Android 10+ necesită solicitare explicită
      }
      
      return 'unknown';
    } catch (error) {
      console.error('❌ Eroare verificare background location:', error);
      return 'unknown';
    }
  }

  private async checkBatteryOptimizationStatus(): Promise<'whitelisted' | 'not-whitelisted' | 'unknown'> {
    try {
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        try {
          const result = await (window as any).CapacitorCustomPlugin.PermissionsHelper.isIgnoringBatteryOptimizations();
          return result.isIgnoring ? 'whitelisted' : 'not-whitelisted';
        } catch (error) {
          console.log('Plugin pentru battery optimization nu e disponibil');
        }
      }
      return 'unknown';
    } catch (error) {
      console.error('❌ Eroare verificare battery optimization:', error);
      return 'unknown';
    }
  }

  private requiresManualSteps(locationPermission: PermissionStatus, backgroundStatus: string): boolean {
    // Necesită pași manuali dacă:
    // 1. Location permission este denied permanent
    // 2. Background location este denied
    // 3. Android 10+ și background location nu este granted
    if (locationPermission.location === 'denied') return true;
    if (backgroundStatus === 'denied') return true;
    if (this.deviceInfo && parseInt(this.deviceInfo.osVersion) >= 10 && backgroundStatus !== 'granted') {
      return true;
    }
    return false;
  }

  async requestLocationPermissions(): Promise<boolean> {
    console.log('🔓 Solicit permisiuni de localizare...');
    
    try {
      const result = await Geolocation.requestPermissions();
      console.log('📍 Rezultat solicitare permisiuni:', result);
      
      if (result.location === 'granted') {
        console.log('✅ Permisiuni location acordate');
        return true;
      } else {
        console.log('❌ Permisiuni location refuzate');
        return false;
      }
    } catch (error) {
      console.error('❌ Eroare solicitare permisiuni location:', error);
      return false;
    }
  }

  async requestBackgroundLocationPermission(): Promise<boolean> {
    console.log('🌅 Solicit permisiuni background location...');
    
    // Verifică dacă avem deja permisiuni de localizare
    const locationStatus = await Geolocation.checkPermissions();
    if (locationStatus.location !== 'granted') {
      console.log('❌ Permisiuni location de bază lipsesc - solicit mai întâi');
      const basicGranted = await this.requestLocationPermissions();
      if (!basicGranted) return false;
    }

    try {
      // Pentru Android, folosește Capacitor plugin pentru background location
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        try {
          const result = await (window as any).CapacitorCustomPlugin.PermissionsHelper.requestBackgroundLocation();
          console.log('🌅 Rezultat background location:', result);
          return result.status === 'granted';
        } catch (error) {
          console.log('Plugin indisponibil pentru background location:', error);
        }
      }
      
      // Fallback pentru versiuni mai vechi
      console.log('ℹ️ Background location permission handling prin sistem');
      return true;
    } catch (error) {
      console.error('❌ Eroare solicitare background location:', error);
      return false;
    }
  }

  async requestBatteryOptimizationWhitelist(): Promise<boolean> {
    console.log('🔋 Solicit excludere din optimizări baterie...');
    
    try {
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        try {
          const result = await (window as any).CapacitorCustomPlugin.PermissionsHelper.requestIgnoreBatteryOptimizations();
          console.log('🔋 Rezultat battery optimization:', result);
          return result.success || false;
        } catch (error) {
          console.log('Plugin pentru battery optimization nu e disponibil:', error);
        }
      }
      
      console.log('ℹ️ Battery optimization handling prin sistem');
      return true;
    } catch (error) {
      console.error('❌ Eroare solicitare battery whitelist:', error);
      return false;
    }
  }

  getSetupSteps(): BackgroundLocationSetupSteps[] {
    const steps: BackgroundLocationSetupSteps[] = [
      {
        step: 1,
        title: 'Permisiuni Localizare',
        description: 'Permite aplicației să acceseze locația dispozitivului',
        action: () => this.requestLocationPermissions(),
        isCompleted: this.currentState?.location.location === 'granted' || false,
        isRequired: true
      },
      {
        step: 2,
        title: 'Localizare în Fundal',
        description: 'Permite urmărirea GPS când aplicația nu este în primul plan',
        action: () => this.requestBackgroundLocationPermission(),
        isCompleted: this.currentState?.backgroundLocation === 'granted' || false,
        isRequired: true
      },
      {
        step: 3,
        title: 'Optimizare Baterie',
        description: 'Dezactivează optimizările de baterie pentru urmărire continuă',
        action: () => this.requestBatteryOptimizationWhitelist(),
        isCompleted: this.currentState?.batteryOptimization === 'whitelisted' || false,
        isRequired: true
      }
    ];

    return steps;
  }

  async performCompleteSetup(): Promise<{ success: boolean; completedSteps: number; totalSteps: number }> {
    console.log('🚀 Încep setup complet background location...');
    
    const steps = this.getSetupSteps();
    let completedSteps = 0;
    
    for (const step of steps) {
      if (step.isCompleted) {
        completedSteps++;
        console.log(`✅ Step ${step.step} deja completat: ${step.title}`);
        continue;
      }
      
      console.log(`🔄 Execut step ${step.step}: ${step.title}`);
      try {
        const result = await step.action();
        if (result) {
          completedSteps++;
          console.log(`✅ Step ${step.step} completat cu succes`);
        } else {
          console.log(`❌ Step ${step.step} eșuat`);
          if (step.isRequired) {
            console.log('🚫 Step obligatoriu eșuat - opresc setup-ul');
            break;
          }
        }
      } catch (error) {
        console.error(`❌ Eroare step ${step.step}:`, error);
        if (step.isRequired) break;
      }
      
      // Delay scurt între steps pentru UX
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Recheck status după setup
    await this.checkAllPermissions();
    
    const success = completedSteps === steps.length;
    console.log(`🎯 Setup complet: ${completedSteps}/${steps.length} steps completate (${success ? 'SUCCESS' : 'PARTIAL'})`);
    
    return {
      success,
      completedSteps,
      totalSteps: steps.length
    };
  }

  getCurrentState(): PermissionState | null {
    return this.currentState;
  }

  isFullyConfigured(): boolean {
    if (!this.currentState) return false;
    
    return (
      this.currentState.location.location === 'granted' &&
      this.currentState.backgroundLocation === 'granted' &&
      this.currentState.isLocationEnabled &&
      (this.currentState.batteryOptimization === 'whitelisted' || this.currentState.batteryOptimization === 'unknown')
    );
  }

  getComplianceMessage(): string {
    const deviceName = this.deviceInfo ? `${this.deviceInfo.manufacturer} ${this.deviceInfo.model}` : 'dispozitivul tău';
    
    return `Pentru a urmări în timp real locația vehiculului, iTrack necesită acces la GPS-ul de pe ${deviceName} chiar și când aplicația nu este în primul plan. Această funcționalitate este esențială pentru:

• Urmărirea precisă a rutelor de transport
• Sincronizarea automată cu serverul companiei
• Generarea rapoartelor complete de traseu

Datele GPS sunt folosite exclusiv pentru operațiunile de transport profesional și sunt transmise securizat către serverul autorizat al companiei tale.

Poți revoca aceste permisiuni oricând din Setările dispozitivului.`;
  }
}

export const backgroundPermissionsService = BackgroundPermissionsService.getInstance();