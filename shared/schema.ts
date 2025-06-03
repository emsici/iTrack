import {
  pgTable,
  text,
  varchar,
  timestamp,
  decimal,
  integer,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for simple auth
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  email: varchar("email", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const gpsDataSchema = z.object({
  vehicleNumber: z.string(),
  uit: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  timestamp: z.string(),
  status: z.number()
});

export const authSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(4)
});

export type GPSData = z.infer<typeof gpsDataSchema>;
export type AuthData = z.infer<typeof authSchema>;