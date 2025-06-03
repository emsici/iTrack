import { registerPlugin } from '@capacitor/core';

export interface GpsTrackingPlugin {
  startBackgroundTracking(options: {
    interval: number;
    enableWakeLock: boolean;
    notificationTitle: string;
    notificationText: string;
  }): Promise<void>;
  
  stopBackgroundTracking(): Promise<void>;
  
  getCurrentLocation(): Promise<{ latitude: number; longitude: number }>;
  
  addListener(
    eventName: 'locationUpdate',
    listenerFunc: (data: {
      latitude: number;
      longitude: number;
      accuracy: number;
      timestamp: number;
    }) => void,
  ): Promise<any>;
}

const GpsTracking = registerPlugin<GpsTrackingPlugin>('GpsTrackingPlugin');

export default GpsTracking;