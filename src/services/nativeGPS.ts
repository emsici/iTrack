import { registerPlugin, Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';

interface GPSTrackingPlugin {
  startGPSTracking(options: {
    vehicleNumber: string;
    courseId: string;
    uit: string;
    authToken: string;
    status?: number;
  }): Promise<{ success: boolean; message: string }>;
  
  stopGPSTracking(options: {
    courseId: string;
  }): Promise<{ success: boolean; message: string }>;
  
  isGPSTrackingActive(): Promise<{ isActive: boolean }>;
}

// Check if running on native platform before registering plugin
const GPSTracking = Capacitor.isNativePlatform() ? 
  registerPlugin<GPSTrackingPlugin>('GPSTracking') : 
  null;

// Service for managing native Android GPS foreground service
class NativeGPSService {
  private activeCourses: Set<string> = new Set();

  async startTracking(courseId: string, vehicleNumber: string, uit: string, token: string, status: number = 2): Promise<void> {
    try {
      console.log(`Starting GPS tracking for course ${courseId} with status ${status}`);
      
      // Request GPS permissions before starting tracking
      await this.requestPermissions();
      
      if (GPSTracking && Capacitor.isNativePlatform()) {
        // Try custom GPS plugin first (Android native)
        try {
          const result = await GPSTracking.startGPSTracking({
            vehicleNumber,
            courseId,
            uit,
            authToken: token,
            status
          });
          
          if (result.success) {
            this.activeCourses.add(courseId);
            console.log(`Native GPS tracking started: ${result.message}`);
            return;
          }
        } catch (pluginError) {
          console.warn('Custom GPS plugin failed, using fallback:', pluginError);
        }
      }
      
      // Fallback: Use community background geolocation
      await this.startBackgroundGeolocation(courseId, vehicleNumber, uit, token, status);
      
    } catch (error) {
      console.error('Failed to start GPS tracking:', error);
      throw error;
    }
  }

  private async startBackgroundGeolocation(courseId: string, vehicleNumber: string, uit: string, token: string, status: number): Promise<void> {
    try {
      const { BackgroundGeolocationPlugin } = await import('@capacitor-community/background-geolocation');
      
      // Configure background geolocation
      await BackgroundGeolocationPlugin.addWatcher({
        backgroundMessage: `Tracking ${uit}`,
        backgroundTitle: "iTrack GPS Active",
        requestPermissions: true,
        stale: false,
        distanceFilter: 0.5
      }, (location, error) => {
        if (error) {
          console.error('Background geolocation error:', error);
          return;
        }
        
        if (location) {
          this.sendLocationToServer(location, vehicleNumber, uit, token, status);
        }
      });
      
      this.activeCourses.add(courseId);
      console.log(`Background geolocation started for course ${courseId}`);
      
    } catch (error) {
      console.error('Failed to start background geolocation:', error);
      throw new Error('Nu s-a putut porni urmărirea GPS');
    }
  }

  private async sendLocationToServer(location: any, vehicleNumber: string, uit: string, token: string, status: number): Promise<void> {
    try {
      const gpsData = {
        lat: location.latitude,
        lng: location.longitude,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        viteza: Math.round((location.speed || 0) * 3.6), // km/h
        directie: Math.round(location.bearing || 0),
        altitudine: Math.round(location.altitude || 0),
        baterie: 100, // Default value
        numar_inmatriculare: vehicleNumber,
        uit: uit,
        status: status,
        hdop: Math.round(location.accuracy || 0),
        gsm_signal: "85"
      };

      const response = await fetch('https://www.euscagency.com/etsm3/platforme/transport/apk/gps.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(gpsData)
      });

      if (response.ok) {
        console.log(`GPS data sent successfully for UIT: ${uit}`);
      } else {
        console.warn(`GPS transmission failed with code: ${response.status} for UIT: ${uit}`);
      }
    } catch (error) {
      console.error(`Error sending GPS data for UIT ${uit}:`, error);
    }
  }

  private async requestPermissions(): Promise<void> {
    try {
      console.log('Requesting GPS and background location permissions...');
      
      // Request location permissions
      const permissions = await Geolocation.requestPermissions();
      
      if (permissions.location === 'denied') {
        throw new Error('Permisiunile GPS sunt necesare pentru urmărirea traseului');
      }
      
      if (permissions.coarseLocation === 'denied') {
        console.warn('Permisiunea pentru locația aproximativă a fost refuzată');
      }
      
      console.log('GPS permissions granted:', permissions);
      
    } catch (error) {
      console.error('Error requesting permissions:', error);
      throw new Error('Nu s-au putut obține permisiunile GPS necesare');
    }
  }

  async stopTracking(courseId: string): Promise<void> {
    try {
      console.log(`Stopping native GPS tracking for course ${courseId}`);
      
      const result = await GPSTracking.stopGPSTracking({
        courseId
      });
      
      if (result.success) {
        this.activeCourses.delete(courseId);
        console.log(`Native GPS tracking stopped: ${result.message}`);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to stop native GPS tracking:', error);
      throw error;
    }
  }

  getActiveCourses(): string[] {
    return Array.from(this.activeCourses);
  }

  hasActiveCourses(): boolean {
    return this.activeCourses.size > 0;
  }

  async isTrackingActive(): Promise<boolean> {
    try {
      const result = await GPSTracking.isGPSTrackingActive();
      return result.isActive;
    } catch (error) {
      console.error('Failed to check GPS tracking status:', error);
      return false;
    }
  }
}

// Export singleton instance
const nativeGPSService = new NativeGPSService();

export const startGPSTracking = (courseId: string, vehicleNumber: string, token: string, uit: string, status: number = 2) => 
  nativeGPSService.startTracking(courseId, vehicleNumber, uit, token, status);

export const stopGPSTracking = (courseId: string) => 
  nativeGPSService.stopTracking(courseId);

export const getActiveCourses = () => 
  nativeGPSService.getActiveCourses();

export const hasActiveCourses = () => 
  nativeGPSService.hasActiveCourses();

export const isGPSTrackingActive = () => 
  nativeGPSService.isTrackingActive();