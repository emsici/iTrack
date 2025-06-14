import { Geolocation } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';
import { sendGPSData, type GPSData } from "./api";

// Simple GPS service that only sends coordinates on course status changes
class StatusGPSService {
  private hasLocationPermission = false;

  async requestLocationPermissions(): Promise<boolean> {
    try {
      console.log('Requesting location permissions...');
      
      const permission = await Geolocation.requestPermissions();
      console.log('Location permission result:', permission);
      
      if (permission.location === 'granted') {
        this.hasLocationPermission = true;
        
        // Show user instruction for background permission
        const message = `Pentru urmărirea GPS în background (când aplicația este minimizată), vă rugăm să acordați permisiunea "Allow all the time" în setările Android.

Deschideți: Setări > Aplicații > iTrack > Permisiuni > Locație > "Allow all the time"`;
        
        alert(message);
        return true;
      } else {
        alert('Pentru urmărirea GPS, aplicația necesită acces la locație. Vă rugăm să acordați permisiunea în setări.');
        return false;
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  async sendStatusWithGPS(courseId: string, vehicleNumber: string, uit: string, token: string, status: number): Promise<void> {
    if (!this.hasLocationPermission) {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        throw new Error('Location permission required');
      }
    }

    try {
      console.log(`Sending GPS data for course ${courseId} with status ${status}`);
      
      // Get current GPS position
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      });

      // Get battery info
      const batteryInfo = await Device.getBatteryInfo();
      const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

      // Prepare GPS data
      const gpsData: GPSData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: currentTime,
        viteza: Math.max(0, Math.round((position.coords.speed || 0) * 3.6)), // km/h
        directie: Math.round(position.coords.heading || 0),
        altitudine: Math.round(position.coords.altitude || 0),
        baterie: Math.round((batteryInfo.batteryLevel || 0) * 100),
        numar_inmatriculare: vehicleNumber,
        uit: uit,
        status: status.toString(), // 2=start, 3=pause, 4=stop
        hdop: Math.round(position.coords.accuracy || 0).toString(),
        gsm_signal: '100'
      };

      console.log(`Sending status ${status} GPS data:`, gpsData);
      await sendGPSData(gpsData, token);
      
      console.log(`GPS data sent successfully for course ${courseId} with status ${status}`);
    } catch (error) {
      console.error('Failed to send GPS data:', error);
      throw error;
    }
  }
}

// Export singleton instance
const statusGPSService = new StatusGPSService();

export const sendCourseStatusWithGPS = (courseId: string, vehicleNumber: string, uit: string, token: string, status: number) => 
  statusGPSService.sendStatusWithGPS(courseId, vehicleNumber, uit, token, status);

export const requestGPSPermissions = () => 
  statusGPSService.requestLocationPermissions();