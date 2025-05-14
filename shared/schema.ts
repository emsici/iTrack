import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const vehicleInfo = pgTable("vehicle_info", {
  id: serial("id").primaryKey(),
  registrationNumber: text("registration_number").notNull().unique(),
  uit: text("uit").notNull(),
  startLocation: text("start_location").notNull(),
  stopLocation: text("stop_location").notNull(),
  userId: integer("user_id").notNull()
});

export const insertVehicleInfoSchema = createInsertSchema(vehicleInfo).pick({
  registrationNumber: true,
  uit: true,
  startLocation: true,
  stopLocation: true,
  userId: true,
});

export const transportStatus = pgTable("transport_status", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  status: text("status").notNull(), // "start", "pause", "resume", "finish"
  timestamp: timestamp("timestamp").notNull(),
});

export const insertTransportStatusSchema = createInsertSchema(transportStatus).pick({
  vehicleId: true,
  status: true,
  timestamp: true,
});

export const gpsData = pgTable("gps_data", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  uit: text("uit").notNull(),
  registrationNumber: text("registration_number").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  speed: real("speed"),
  direction: real("direction"),
  altitude: real("altitude"),
  battery: integer("battery"),
});

export const insertGpsDataSchema = createInsertSchema(gpsData).pick({
  vehicleId: true,
  uit: true,
  registrationNumber: true,
  lat: true,
  lng: true,
  timestamp: true,
  speed: true,
  direction: true, 
  altitude: true,
  battery: true,
});

export const gpsDataSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  timestamp: z.string(),
  viteza: z.number(),
  directie: z.number(),
  altitudine: z.number(),
  baterie: z.number(),
  numar_inmatriculare: z.string(),
  uit: z.string(),
  status: z.string(), // "in_progress" sau "finished"
  hdop: z.number().optional(), // Horizontal Dilution of Precision (precizia poziției GPS)
  gsm_signal: z.number().optional() // Puterea semnalului GSM/celular (0-100%)
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Login = z.infer<typeof loginSchema>;
export type VehicleInfo = typeof vehicleInfo.$inferSelect;
export type InsertVehicleInfo = z.infer<typeof insertVehicleInfoSchema>;
export type TransportStatus = typeof transportStatus.$inferSelect;
export type InsertTransportStatus = z.infer<typeof insertTransportStatusSchema>;
export type GpsData = typeof gpsData.$inferSelect;
export type InsertGpsData = z.infer<typeof insertGpsDataSchema>;
export type GpsDataPayload = z.infer<typeof gpsDataSchema>;
