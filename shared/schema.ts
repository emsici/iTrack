import { z } from 'zod';

export const gpsDataSchema = z.object({
  vehicleNumber: z.string(),
  uit: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  timestamp: z.string(),
  status: z.number()
});

export const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export type GPSData = z.infer<typeof gpsDataSchema>;
export type AuthData = z.infer<typeof authSchema>;