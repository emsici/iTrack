import { Course } from '../types';

interface NotificationService {
  showPersistentTracking: (activeCourses: Course[]) => Promise<void>;
  hidePersistentTracking: () => Promise<void>;
  showQuickNotification: (title: string, message: string, duration?: number) => Promise<void>;
  updateTrackingNotification: (activeCourses: Course[]) => Promise<void>;
}

class AndroidNotificationService implements NotificationService {
  
  async showPersistentTracking(activeCourses: Course[]): Promise<void> {
    try {
      const message = this.formatTrackingMessage(activeCourses);
      if (window.AndroidGPS?.showPersistentNotification) {
        await window.AndroidGPS.showPersistentNotification('iTrack GPS', message, true);
      }
    } catch (error) {
      console.log('Notification error (ignored):', error);
    }
  }

  async hidePersistentTracking(): Promise<void> {
    try {
      if (window.AndroidGPS?.hidePersistentNotification) {
        await window.AndroidGPS.hidePersistentNotification();
      }
    } catch (error) {
      console.log('Hide notification error (ignored):', error);
    }
  }

  async showQuickNotification(title: string, message: string, duration: number = 5000): Promise<void> {
    try {
      if (window.AndroidGPS?.showQuickNotification) {
        await window.AndroidGPS.showQuickNotification(title, message, duration);
      }
    } catch (error) {
      console.log('Quick notification error (ignored):', error);
    }
  }

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