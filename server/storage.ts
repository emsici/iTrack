import { 
  users, 
  vehicleInfo, 
  transportStatus, 
  gpsData,
  User, 
  InsertUser, 
  VehicleInfo, 
  InsertVehicleInfo, 
  TransportStatus, 
  InsertTransportStatus, 
  GpsData, 
  InsertGpsData
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getVehicleInfo(registrationNumber: string): Promise<VehicleInfo | undefined>;
  createVehicleInfo(vehicleInfo: InsertVehicleInfo): Promise<VehicleInfo>;

  getTransportStatus(vehicleId: number): Promise<TransportStatus | undefined>;
  createTransportStatus(status: InsertTransportStatus): Promise<TransportStatus>;

  getGpsData(vehicleId: number): Promise<GpsData[]>;
  getLastGpsData(vehicleId: number): Promise<GpsData | undefined>;
  saveGpsData(data: InsertGpsData): Promise<GpsData>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private vehicles: Map<string, VehicleInfo>;
  private transports: Map<number, TransportStatus>;
  private gpsDataList: Map<number, GpsData[]>;
  
  currentUserId: number;
  currentVehicleId: number;
  currentTransportId: number;
  currentGpsId: number;

  constructor() {
    this.users = new Map();
    this.vehicles = new Map();
    this.transports = new Map();
    this.gpsDataList = new Map();
    
    this.currentUserId = 1;
    this.currentVehicleId = 1;
    this.currentTransportId = 1;
    this.currentGpsId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getVehicleInfo(registrationNumber: string): Promise<VehicleInfo | undefined> {
    return this.vehicles.get(registrationNumber);
  }

  async createVehicleInfo(info: InsertVehicleInfo): Promise<VehicleInfo> {
    const id = this.currentVehicleId++;
    const vehicleInfo: VehicleInfo = { ...info, id };
    this.vehicles.set(info.registrationNumber, vehicleInfo);
    return vehicleInfo;
  }

  async getTransportStatus(vehicleId: number): Promise<TransportStatus | undefined> {
    return this.transports.get(vehicleId);
  }

  async createTransportStatus(insertStatus: InsertTransportStatus): Promise<TransportStatus> {
    const id = this.currentTransportId++;
    const status: TransportStatus = { ...insertStatus, id };
    this.transports.set(insertStatus.vehicleId, status);
    return status;
  }

  async getGpsData(vehicleId: number): Promise<GpsData[]> {
    return this.gpsDataList.get(vehicleId) || [];
  }

  async getLastGpsData(vehicleId: number): Promise<GpsData | undefined> {
    const data = this.gpsDataList.get(vehicleId) || [];
    return data.length > 0 ? data[data.length - 1] : undefined;
  }

  async saveGpsData(insertData: InsertGpsData): Promise<GpsData> {
    const id = this.currentGpsId++;
    const data: GpsData = { ...insertData, id };
    
    // Get or create the vehicle's GPS data array
    const existingData = this.gpsDataList.get(insertData.vehicleId) || [];
    existingData.push(data);
    this.gpsDataList.set(insertData.vehicleId, existingData);
    
    return data;
  }
}

export const storage = new MemStorage();
