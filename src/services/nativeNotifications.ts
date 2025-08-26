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
      
      // Verifică dacă AndroidGPS este disponibil
      if (window.AndroidGPS?.showPersistentNotification) {
        await window.AndroidGPS.showPersistentNotification(
          'iTrack GPS', 
          message,
          true // persistent
        );
        console.log('🔔 Notificare persistentă afișată:', message);
      } else {
        console.log('⚠️ AndroidGPS nu e disponibil pentru notificări');
      }
    } catch (error) {
      console.error('❌ Eroare afișare notificare persistentă:', error);
    }
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
      if (window.AndroidGPS?.showQuickNotification) {
        await window.AndroidGPS.showQuickNotification(title, message, duration);
        console.log('🔔 Notificare rapidă:', title, '-', message);
      }
    } catch (error) {
      console.error('❌ Eroare notificare rapidă:', error);
    }
  }

  /**
   * Actualizează notificarea persistentă cu noile curse
   */
  async updateTrackingNotification(activeCourses: Course[]): Promise<void> {
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