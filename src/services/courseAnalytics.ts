/**
 * Course Analytics Service
 * Tracks and calculates real-time course statistics: distance, time, speed
 */

import { Preferences } from '@capacitor/preferences';

export interface GPSPoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed: number; // km/h
  accuracy: number;
}

export interface CourseStatistics {
  courseId: string;
  uit: string;
  vehicleNumber: string;
  startTime: string;
  endTime?: string;
  totalDistance: number; // km
  drivingTime: number; // minutes
  averageSpeed: number; // km/h
  maxSpeed: number; // km/h
  totalStops: number;
  stopDuration: number; // minutes
  // Removed fuel estimate - too variable for trucks without real data
  gpsPoints: GPSPoint[];
  isActive: boolean;
  lastUpdateTime: string;
}

class CourseAnalyticsService {
  private readonly STORAGE_KEY_PREFIX = 'course_analytics_';
  // Removed fuel consumption - too variable for trucks without real data
  private readonly MIN_SPEED_THRESHOLD = 5; // km/h - below this is considered stopped
  private readonly MIN_DISTANCE_THRESHOLD = 0.01; // km - minimum distance to count

  /**
   * Start tracking analytics for a course
   */
  async startCourseTracking(courseId: string, uit: string, vehicleNumber: string): Promise<void> {
    try {
      // FIX GPS STATISTICS 0 ISSUE: Don't overwrite existing analytics if they exist
      const existingAnalytics = await this.getCourseAnalytics(courseId);
      if (existingAnalytics && existingAnalytics.gpsPoints && existingAnalytics.gpsPoints.length > 0) {
        console.log(`⚠️ Course ${courseId} already has ${existingAnalytics.gpsPoints.length} GPS points - updating existing analytics`);
        existingAnalytics.isActive = true; // Ensure it's active
        existingAnalytics.lastUpdateTime = new Date().toISOString();
        await this.saveCourseAnalytics(courseId, existingAnalytics);
        return;
      }

      const analytics: CourseStatistics = {
        courseId,
        uit,
        vehicleNumber,
        startTime: new Date().toISOString(),
        totalDistance: 0,
        drivingTime: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        totalStops: 0,
        stopDuration: 0,
        // Removed fuel estimate field
        gpsPoints: [],
        isActive: true,
        lastUpdateTime: new Date().toISOString()
      };

      await this.saveCourseAnalytics(courseId, analytics);
      console.log(`📊 Started NEW analytics tracking for course: ${courseId} | UIT: ${uit}`);
    } catch (error) {
      console.error('❌ Error starting course tracking:', error);
    }
  }

  /**
   * Add GPS point and update course statistics
   */
  async updateCourseStatistics(
    courseId: string, 
    lat: number, 
    lng: number, 
    speed: number, 
    accuracy: number
  ): Promise<CourseStatistics | null> {
    try {
      const analytics = await this.getCourseAnalytics(courseId);
      if (!analytics || !analytics.isActive) {
        return null;
      }

      const newPoint: GPSPoint = {
        lat,
        lng,
        timestamp: new Date().toISOString(),
        speed,
        accuracy
      };

      // Add new GPS point
      analytics.gpsPoints.push(newPoint);
      analytics.lastUpdateTime = new Date().toISOString();

      // Calculate distance if we have previous point
      if (analytics.gpsPoints.length > 1) {
        const previousPoint = analytics.gpsPoints[analytics.gpsPoints.length - 2];
        const distance = this.calculateDistance(
          previousPoint.lat, previousPoint.lng,
          lat, lng
        );

        // Only add distance if it's significant and accuracy is good
        if (distance >= this.MIN_DISTANCE_THRESHOLD && accuracy <= 50) {
          analytics.totalDistance += distance;
        }
      }

      // Update speed statistics
      if (speed > analytics.maxSpeed) {
        analytics.maxSpeed = speed;
      }

      // Calculate driving time and stops
      this.updateTimeStatistics(analytics);

      // Calculate average speed
      if (analytics.drivingTime > 0) {
        analytics.averageSpeed = (analytics.totalDistance / (analytics.drivingTime / 60));
      }

      // Fuel consumption removed - too variable for trucks without real data

      // Keep only last 1000 GPS points for performance
      if (analytics.gpsPoints.length > 1000) {
        analytics.gpsPoints = analytics.gpsPoints.slice(-1000);
      }

      await this.saveCourseAnalytics(courseId, analytics);
      return analytics;

    } catch (error) {
      console.error('❌ Error updating course statistics:', error);
      return null;
    }
  }

  /**
   * Stop tracking and finalize course statistics
   */
  async stopCourseTracking(courseId: string): Promise<CourseStatistics | null> {
    try {
      const analytics = await this.getCourseAnalytics(courseId);
      if (!analytics) {
        return null;
      }

      analytics.isActive = false;
      analytics.endTime = new Date().toISOString();
      analytics.lastUpdateTime = new Date().toISOString();

      // Final calculations
      this.updateTimeStatistics(analytics);
      if (analytics.drivingTime > 0) {
        analytics.averageSpeed = (analytics.totalDistance / (analytics.drivingTime / 60));
      }

      await this.saveCourseAnalytics(courseId, analytics);
      console.log(`🏁 Stopped analytics tracking for course: ${courseId}`);
      console.log(`📊 Final stats: ${analytics.totalDistance.toFixed(2)}km, ${analytics.drivingTime}min, ${analytics.averageSpeed.toFixed(1)}km/h`);
      
      return analytics;
    } catch (error) {
      console.error('❌ Error stopping course tracking:', error);
      return null;
    }
  }

  /**
   * Get current course analytics
   */
  async getCourseAnalytics(courseId: string): Promise<CourseStatistics | null> {
    try {
      const { value } = await Preferences.get({ key: this.STORAGE_KEY_PREFIX + courseId });
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('❌ Error getting course analytics:', error);
      return null;
    }
  }

  /**
   * Get all course analytics (for history)
   */
  async getAllCourseAnalytics(): Promise<CourseStatistics[]> {
    try {
      const { value } = await Preferences.get({ key: 'all_course_analytics' });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('❌ Error getting all course analytics:', error);
      return [];
    }
  }

  /**
   * Save course analytics to storage
   */
  private async saveCourseAnalytics(courseId: string, analytics: CourseStatistics): Promise<void> {
    try {
      // Save individual course analytics
      await Preferences.set({
        key: this.STORAGE_KEY_PREFIX + courseId,
        value: JSON.stringify(analytics)
      });

      // Update global analytics list for history
      const allAnalytics = await this.getAllCourseAnalytics();
      const existingIndex = allAnalytics.findIndex(a => a.courseId === courseId);
      
      if (existingIndex >= 0) {
        allAnalytics[existingIndex] = analytics;
      } else {
        allAnalytics.push(analytics);
      }

      // Keep only last 50 courses for performance
      if (allAnalytics.length > 50) {
        allAnalytics.splice(0, allAnalytics.length - 50);
      }

      await Preferences.set({
        key: 'all_course_analytics',
        value: JSON.stringify(allAnalytics)
      });

    } catch (error) {
      console.error('❌ Error saving course analytics:', error);
    }
  }

  /**
   * Calculate distance between two GPS points using Haversine formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Update time statistics (driving time, stops, etc.)
   */
  private updateTimeStatistics(analytics: CourseStatistics): void {
    if (analytics.gpsPoints.length < 2) {
      return;
    }

    let totalDrivingTime = 0;
    let totalStopTime = 0;
    let stopCount = 0;
    let currentStopStart: Date | null = null;

    for (let i = 1; i < analytics.gpsPoints.length; i++) {
      const currentPoint = analytics.gpsPoints[i];
      const previousPoint = analytics.gpsPoints[i - 1];
      
      const timeDiff = new Date(currentPoint.timestamp).getTime() - new Date(previousPoint.timestamp).getTime();
      const timeDiffMinutes = timeDiff / (1000 * 60);

      // Skip if time difference is too large (data gap)
      if (timeDiffMinutes > 10) {
        continue;
      }

      if (currentPoint.speed >= this.MIN_SPEED_THRESHOLD) {
        // Vehicle is moving
        totalDrivingTime += timeDiffMinutes;
        
        // End current stop if any
        if (currentStopStart) {
          const stopDuration = new Date(currentPoint.timestamp).getTime() - currentStopStart.getTime();
          const stopMinutes = stopDuration / (1000 * 60);
          
          if (stopMinutes >= 2) { // Only count stops longer than 2 minutes
            totalStopTime += stopMinutes;
            stopCount++;
          }
          currentStopStart = null;
        }
      } else {
        // Vehicle is stopped
        if (!currentStopStart) {
          currentStopStart = new Date(previousPoint.timestamp);
        }
      }
    }

    // Handle ongoing stop
    if (currentStopStart) {
      const lastPoint = analytics.gpsPoints[analytics.gpsPoints.length - 1];
      const stopDuration = new Date(lastPoint.timestamp).getTime() - currentStopStart.getTime();
      const stopMinutes = stopDuration / (1000 * 60);
      
      if (stopMinutes >= 2) {
        totalStopTime += stopMinutes;
        stopCount++;
      }
    }

    analytics.drivingTime = Math.round(totalDrivingTime);
    analytics.stopDuration = Math.round(totalStopTime);
    analytics.totalStops = stopCount;
  }

  /**
   * Get formatted statistics for display
   */
  formatStatistics(analytics: CourseStatistics): {
    distance: string;
    time: string;
    avgSpeed: string;
    maxSpeed: string;
    stops: string;
  } {
    return {
      distance: analytics.totalDistance.toFixed(2) + ' km',
      time: this.formatDuration(analytics.drivingTime),
      avgSpeed: analytics.averageSpeed.toFixed(1) + ' km/h',
      maxSpeed: analytics.maxSpeed.toFixed(1) + ' km/h',
      stops: `${analytics.totalStops} (${this.formatDuration(analytics.stopDuration)})`
    };
  }

  /**
   * Format duration in minutes to human readable format
   */
  private formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)}min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
    }
  }

  /**
   * Clear analytics for a specific course
   */
  async clearCourseAnalytics(courseId: string): Promise<void> {
    try {
      await Preferences.remove({ key: this.STORAGE_KEY_PREFIX + courseId });
      console.log(`🗑️ Cleared analytics for course: ${courseId}`);
    } catch (error) {
      console.error('❌ Error clearing course analytics:', error);
    }
  }
}

// Export singleton instance
export const courseAnalyticsService = new CourseAnalyticsService();
export default courseAnalyticsService;

// Convenience functions


export const getCourseStats = (courseId: string) =>
  courseAnalyticsService.getCourseAnalytics(courseId);

export const formatCourseStats = (analytics: CourseStatistics) =>
  courseAnalyticsService.formatStatistics(analytics);