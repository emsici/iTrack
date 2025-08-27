import { Course } from '../types';

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
    try {
      const message = this.formatTrackingMessage(activeCourses);
      
      // Așteaptă ca bridge-ul să fie gata
      await this.waitForAndroidBridge();
      
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
      console.error('❌ Eroare afișare notificare persistentă:', error);
    }
  }

  /**
   * Așteaptă ca bridge-ul Android să fie disponibil
   */
  private async waitForAndroidBridge(maxWait: number = 5000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
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
    try {
      if (window.AndroidGPS?.hidePersistentNotification) {
        await window.AndroidGPS.hidePersistentNotification();
        console.log('🔔 Notificare persistentă ascunsă');
      }
    } catch (error) {
      console.error('❌ Eroare ascundere notificare persistentă:', error);
    }
  }

  /**
   * Afișează notificare rapidă care dispare automat
   */
  async showQuickNotification(title: string, message: string, duration: number = 5000): Promise<void> {
    try {
      // Așteaptă ca bridge-ul să fie gata
      await this.waitForAndroidBridge();
      
      if (window.AndroidGPS?.showQuickNotification) {
        await window.AndroidGPS.showQuickNotification(title, message, duration);
        console.log('🔔 Notificare rapidă trimisă:', title, '-', message);
      } else {
        console.log('⚠️ AndroidGPS nu e disponibil pentru notificări rapide');
      }
    } catch (error) {
      console.error('❌ Eroare notificare rapidă:', error);
    }
  }

  /**
   * Actualizează notificarea persistentă cu noile curse
   */
  async updateTrackingNotification(activeCourses: Course[]): Promise<void> {
    console.log(`🔔 === NATIVE NOTIFICATION DEBUG === updateTrackingNotification called with ${activeCourses.length} courses`);
    console.log('🔔 AndroidGPS availability:', {
      exists: !!window.AndroidGPS,
      showPersistent: !!window.AndroidGPS?.showPersistentNotification,
      showQuick: !!window.AndroidGPS?.showQuickNotification,
      allMethods: window.AndroidGPS ? Object.keys(window.AndroidGPS) : 'AndroidGPS is null'
    });
    
    // TEST direct notification call
    if (window.AndroidGPS?.showQuickNotification) {
      console.log('🔔 Testing direct quick notification...');
      try {
        window.AndroidGPS.showQuickNotification('TEST', 'Notificare de test iTrack GPS', 5000);
        console.log('✅ Direct notification call successful!');
      } catch (error) {
        console.error('❌ Direct notification call failed:', error);
      }
    }
    
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

// Export serviciul principal
export const nativeNotificationService: NotificationService = 
  window.AndroidGPS ? new AndroidNotificationService() : new BrowserNotificationService();

export default nativeNotificationService;