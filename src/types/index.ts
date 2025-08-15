export interface Course {
  id: string;
  name: string;
  departure_location?: string;
  destination_location?: string;
  departure_time?: string;
  arrival_time?: string;
  description?: string;
  status: number; // 1: available, 2: in progress, 3: paused, 4: stopped
  uit: string;
  isNew?: boolean; // Temporary flag for sorting new courses first
  // Extended data from API
  ikRoTrans?: number;
  codDeclarant?: number;
  denumireDeclarant?: string;
  nrVehicul?: string;
  dataTransport?: string;
  vama?: string;
  birouVamal?: string;
  judet?: string;
  denumireLocStart?: string;
  vamaStop?: string;
  birouVamalStop?: string;
  judetStop?: string;
  denumireLocStop?: string;
  // API original field names (with capital letters)
  BirouVamal?: string;
  BirouVamalStop?: string;
  Judet?: string;
  JudetStop?: string;

  // API field variants (uppercase)
  Vama?: string;
  VamaStop?: string;
}

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
  timestamp: number;
}

export interface CourseStatus {
  courseId: string;
  status: number;
  timestamp: string;
}
