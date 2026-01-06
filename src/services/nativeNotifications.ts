import { Course } from '../types';

// CRASH PREVENTION: Flag JavaScript pentru a bloca apelurile native după logout
let isLogoutInProgress = false;

// API pentru a seta flag-ul din alte module
export const setLogoutInProgress = (value: boolean) => {
  isLogoutInProgress = value;
  console.log(`🔒 JavaScript logout guard: ${value ? 'ACTIVATED' : 'DEACTIVATED'}`);
};

export const getLogoutInProgress = () => isLogoutInProgress;

interface NotificationService {
  showPersistentTracking: (activeCourses: Course[]) => Promise<void>;
  hidePersistentTracking: () => Promise<void>;
  showQuickNotification: (title: string, message: string, duration?: number) => Promise<void>;
  updateTrackingNotification: (activeCourses: Course[]) => Promise<void>;
}

class AndroidNotificationService implements NotificationService {
  
  /**
   * Afișează notificarea persistentă pentru tracking GPS
   */
  async showPersistentTracking(activeCourses: Course[]): Promise<void> {
    // CRASH GUARD: Skip dacă logout e în progres
    if (isLogoutInProgress) {
      console.log('🔒 showPersistentTracking BLOCKED - logout in progress');
      return;
    }
    
    try {
      const message = this.formatTrackingMessage(activeCourses);
      
      // Așteaptă ca bridge-ul să fie gata
      await this.waitForAndroidBridge();
      
      // DOUBLE CHECK după await
      if (isLogoutInProgress) {
        console.log('🔒 showPersistentTracking BLOCKED after await - logout in progress');
        return;
      }
      
      // Verifică dacă AndroidGPS este disponibil
      if (window.AndroidGPS?.showPersistentNotification) {
        await window.AndroidGPS.showPersistentNotification(
          'iTrack GPS', 
          message,
          true // persistent
        );
        console.log('🔔 Notificare persistentă afișată:', message);
      } else {
        console.log('⚠️ AndroidGPS nu e disponibil pentru notificări persistente');
        console.log('🔍 Debug - window.AndroidGPS:', window.AndroidGPS);
      }
    } catch (error) {
      if (!isLogoutInProgress) {
        console.error('❌ Eroare afișare notificare persistentă:', error);
      }
    }
  }

  /**
   * Așteaptă ca bridge-ul Android să fie disponibil
   */
  private async waitForAndroidBridge(maxWait: number = 5000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      // CRASH GUARD: Exit early dacă logout e în progres
      if (isLogoutInProgress) {
        console.log('🔒 waitForAndroidBridge ABORTED - logout in progress');
        return;
      }
      
      if (window.AndroidGPS?.showPersistentNotification) {
        console.log('✅ AndroidGPS bridge gata!');
        return;
      }
      
      // Așteaptă 100ms și încearcă din nou
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('⏰ Timeout waiting for AndroidGPS bridge');
  }

  /**
   * Ascunde notificarea persistentă
   */
  async hidePersistentTracking(): Promise<void> {
    // CRASH GUARD: Skip dacă logout e în progres (dar permite apelul din logoutClearAllGPS)
    if (isLogoutInProgress) {
      console.log('🔒 hidePersistentTracking called during logout - safe operation');
    }
    
    try {
      if (window.AndroidGPS?.hidePersistentNotification) {
        await window.AndroidGPS.hidePersistentNotification();
        console.log('🔔 Notificare persistentă ascunsă');
      }
    } catch (error) {
      if (!isLogoutInProgress) {
        console.error('❌ Eroare ascundere notificare persistentă:', error);
      }
    }
  }

  /**
   * Afișează notificare rapidă care dispare automat
   */
  async showQuickNotification(title: string, message: string, duration: number = 5000): Promise<void> {
    // CRASH GUARD: Skip dacă logout e în progres
    if (isLogoutInProgress) {
      console.log('🔒 showQuickNotification BLOCKED - logout in progress');
      return;
    }
    
    try {
      // Așteaptă ca bridge-ul să fie gata
      await this.waitForAndroidBridge();
      
      // DOUBLE CHECK după await
      if (isLogoutInProgress) {
        console.log('🔒 showQuickNotification BLOCKED after await - logout in progress');
        return;
      }
      
      if (window.AndroidGPS?.showQuickNotification) {
        await window.AndroidGPS.showQuickNotification(title, message, duration);
        console.log('🔔 Notificare rapidă trimisă:', title, '-', message);
      } else {
        console.log('⚠️ AndroidGPS nu e disponibil pentru notificări rapide');
      }
    } catch (error) {
      if (!isLogoutInProgress) {
        console.error('❌ Eroare notificare rapidă:', error);
      }
    }
  }

  /**
   * Actualizează notificarea persistentă cu noile curse
   */
  async updateTrackingNotification(activeCourses: Course[]): Promise<void> {
    // CRASH GUARD: Skip dacă logout e în progres
    if (isLogoutInProgress) {
      console.log('🔒 updateTrackingNotification BLOCKED - logout in progress');
      return;
    }
    
    console.log(`🔔 === NATIVE NOTIFICATION DEBUG === updateTrackingNotification called with ${activeCourses.length} courses`);
    
    if (activeCourses.length > 0) {
      await this.showPersistentTracking(activeCourses);
    } else {
      await this.hidePersistentTracking();
    }
  }

  /**
   * Formatează mesajul pentru notificarea de tracking
   */
  private formatTrackingMessage(activeCourses: Course[]): string {
    if (activeCourses.length === 0) {
      return 'iTrack - GPS inactiv';
    }
    
    if (activeCourses.length === 1) {
      return `iTrack - trimit pentru cursa: ${activeCourses[0].uit}`;
    }
    
    const uits = activeCourses.map(course => course.uit).join(', ');
    return `iTrack - trimit coordonatele pentru cursele: ${uits}`;
  }
}

// Fallback pentru browser (dezvoltare)
class BrowserNotificationService implements NotificationService {
  
  async showPersistentTracking(activeCourses: Course[]): Promise<void> {
    const message = this.formatTrackingMessage(activeCourses);
    console.log('🔔 [BROWSER] Notificare persistentă:', message);
    
    // Încearcă browser notifications dacă sunt permise
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('iTrack GPS', {
        body: message,
        icon: '/icon-192x192.png'
      });
    }
  }

  async hidePersistentTracking(): Promise<void> {
    console.log('🔔 [BROWSER] Notificare persistentă ascunsă');
  }

  async showQuickNotification(title: string, message: string): Promise<void> {
    console.log('🔔 [BROWSER] Notificare rapidă:', title, '-', message);
    
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: message,
        icon: '/icon-192x192.png'
      });
      
      // Auto-close după 5 secunde
      setTimeout(() => notification.close(), 5000);
    }
  }

  async updateTrackingNotification(activeCourses: Course[]): Promise<void> {
    if (activeCourses.length > 0) {
      await this.showPersistentTracking(activeCourses);
    } else {
      await this.hidePersistentTracking();
    }
  }

  private formatTrackingMessage(activeCourses: Course[]): string {
    if (activeCourses.length === 0) {
      return 'iTrack - GPS inactiv';
    }
    
    if (activeCourses.length === 1) {
      return `iTrack - trimit pentru cursa: ${activeCourses[0].uit}`;
    }
    
    const uits = activeCourses.map(course => course.uit).join(', ');
    return `iTrack - trimit coordonatele pentru cursele: ${uits}`;
  }
}

// LAZY DETECTION: Serviciu care detectează dinamic AndroidGPS/iOSGPS
class LazyNotificationService implements NotificationService {
  private androidService = new AndroidNotificationService();
  private browserService = new BrowserNotificationService();
  
  private getActiveService(): NotificationService {
    // Verifică la fiecare apel dacă bridge-ul nativ e disponibil
    if (window.AndroidGPS || window.iOSGPS) {
      return this.androidService;
    }
    return this.browserService;
  }
  
  async showPersistentTracking(activeCourses: Course[]): Promise<void> {
    return this.getActiveService().showPersistentTracking(activeCourses);
  }
  
  async hidePersistentTracking(): Promise<void> {
    return this.getActiveService().hidePersistentTracking();
  }
  
  async showQuickNotification(title: string, message: string, duration?: number): Promise<void> {
    return this.getActiveService().showQuickNotification(title, message, duration);
  }
  
  async updateTrackingNotification(activeCourses: Course[]): Promise<void> {
    return this.getActiveService().updateTrackingNotification(activeCourses);
  }
}

// Export serviciul principal cu LAZY DETECTION
export const nativeNotificationService: NotificationService = new LazyNotificationService();

export default nativeNotificationService;