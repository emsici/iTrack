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
