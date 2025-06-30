import { registerPlugin } from '@capacitor/core';

interface DirectGPSPlugin {
  startGPS(options: {
    courseId: string;
    vehicleNumber: string;
    uit: string;
    authToken: string;
    status: number;
  }): Promise<{ success: boolean; message: string }>;
  
  stopGPS(options: {
    courseId: string;
  }): Promise<{ success: boolean; message: string }>;
  
  updateGPS(options: {
    courseId: string;
    status: number;
  }): Promise<{ success: boolean; message: string }>;
  
  clearAllGPS(): Promise<{ success: boolean; message: string }>;
}

const DirectGPS = registerPlugin<DirectGPSPlugin>('DirectGPS');

export default DirectGPS;