/**
 * Service pentru gestionarea stării curselor per vehicul
 * Salvează și restaurează statusurile curselor când se schimbă vehiculul
 */

import { Preferences } from '@capacitor/preferences';
import { Course } from '../types';

interface VehicleCourseState {
  vehicleNumber: string;
  courses: Course[];
  lastUpdated: string;
}

class CourseStateManager {
  private readonly STORAGE_PREFIX = 'vehicle_courses_';
  private readonly MAX_STORED_VEHICLES = 10; // Păstrează starea pentru maxim 10 vehicule

  /**
   * Salvează starea curselor pentru un vehicul specific
   */
  async saveCourseState(vehicleNumber: string, courses: Course[]): Promise<void> {
    if (!vehicleNumber?.trim() || !courses.length) {
      return;
    }

    try {
      const state: VehicleCourseState = {
        vehicleNumber: vehicleNumber.trim(),
        courses: courses.map(course => ({
          // Salvează doar câmpurile esențiale pentru stare
          id: course.id,
          status: course.status,
          uit: course.uit,
          ikRoTrans: course.ikRoTrans
        })),
        lastUpdated: new Date().toISOString()
      };

      const storageKey = `${this.STORAGE_PREFIX}${vehicleNumber.trim()}`;
      await Preferences.set({
        key: storageKey,
        value: JSON.stringify(state)
      });

      console.log(`💾 Starea curselor salvată pentru vehiculul ${vehicleNumber} (${courses.length} curse)`);
      
      // Curăță vehiculele mai vechi dacă sunt prea multe
      await this.cleanupOldVehicleStates();
    } catch (error) {
      console.error('Eroare la salvarea stării curselor:', error);
    }
  }

  /**
   * Restaurează starea curselor pentru un vehicul specific
   */
  async restoreCourseState(vehicleNumber: string): Promise<Course[] | null> {
    if (!vehicleNumber?.trim()) {
      return null;
    }

    try {
      const storageKey = `${this.STORAGE_PREFIX}${vehicleNumber.trim()}`;
      const { value } = await Preferences.get({ key: storageKey });
      
      if (!value) {
        console.log(`📭 Nu există stare salvată pentru vehiculul ${vehicleNumber}`);
        return null;
      }

      const state: VehicleCourseState = JSON.parse(value);
      const ageHours = (Date.now() - new Date(state.lastUpdated).getTime()) / (1000 * 60 * 60);
      
      // Starea expiră după 24 de ore
      if (ageHours > 24) {
        console.log(`⏰ Starea pentru vehiculul ${vehicleNumber} a expirat (${ageHours.toFixed(1)}h)`);
        await this.removeCourseState(vehicleNumber);
        return null;
      }

      console.log(`🔄 Starea curselor restaurată pentru vehiculul ${vehicleNumber} (${state.courses.length} curse, ${ageHours.toFixed(1)}h veche)`);
      return state.courses;
    } catch (error) {
      console.error('Eroare la restaurarea stării curselor:', error);
      return null;
    }
  }

  /**
   * Șterge starea pentru un vehicul specific
   */
  async removeCourseState(vehicleNumber: string): Promise<void> {
    if (!vehicleNumber?.trim()) {
      return;
    }

    try {
      const storageKey = `${this.STORAGE_PREFIX}${vehicleNumber.trim()}`;
      await Preferences.remove({ key: storageKey });
      console.log(`🗑️ Starea ștearsă pentru vehiculul ${vehicleNumber}`);
    } catch (error) {
      console.error('Eroare la ștergerea stării curselor:', error);
    }
  }

  /**
   * Actualizează statusul unei curse specifice în starea salvată
   */
  async updateCourseStatus(vehicleNumber: string, courseId: string, newStatus: number): Promise<void> {
    if (!vehicleNumber?.trim()) {
      return;
    }

    try {
      const storageKey = `${this.STORAGE_PREFIX}${vehicleNumber.trim()}`;
      const { value } = await Preferences.get({ key: storageKey });
      
      if (!value) {
        return;
      }

      const state: VehicleCourseState = JSON.parse(value);
      const courseIndex = state.courses.findIndex(c => c.id === courseId);
      
      if (courseIndex !== -1) {
        state.courses[courseIndex].status = newStatus;
        state.lastUpdated = new Date().toISOString();
        
        await Preferences.set({
          key: storageKey,
          value: JSON.stringify(state)
        });
        
        console.log(`📝 Status actualizat în stare pentru cursa ${courseId} → ${newStatus}`);
      }
    } catch (error) {
      console.error('Eroare la actualizarea statusului în stare:', error);
    }
  }

  /**
   * Curăță stările vehiculelor mai vechi pentru a nu umple storage-ul
   */
  private async cleanupOldVehicleStates(): Promise<void> {
    try {
      // Obține toate cheile din Preferences
      const { keys } = await Preferences.keys();
      const vehicleKeys = keys.filter(key => key.startsWith(this.STORAGE_PREFIX));
      
      if (vehicleKeys.length <= this.MAX_STORED_VEHICLES) {
        return;
      }

      // Încarcă toate stările și sortează după data ultimei actualizări
      const states: { key: string; lastUpdated: Date }[] = [];
      
      for (const key of vehicleKeys) {
        try {
          const { value } = await Preferences.get({ key });
          if (value) {
            const state: VehicleCourseState = JSON.parse(value);
            states.push({
              key,
              lastUpdated: new Date(state.lastUpdated)
            });
          }
        } catch (error) {
          // Șterge intrările corupte
          await Preferences.remove({ key });
        }
      }

      // Sortează după data actualizării (cele mai vechi primele)
      states.sort((a, b) => a.lastUpdated.getTime() - b.lastUpdated.getTime());
      
      // Șterge stările mai vechi
      const toRemove = states.slice(0, states.length - this.MAX_STORED_VEHICLES);
      for (const { key } of toRemove) {
        await Preferences.remove({ key });
        const vehicleNumber = key.replace(this.STORAGE_PREFIX, '');
        console.log(`🧹 Stare veche ștearsă pentru vehiculul ${vehicleNumber}`);
      }
    } catch (error) {
      console.error('Eroare la curățarea stărilor vechi:', error);
    }
  }

  /**
   * Obține lista vehiculelor cu stări salvate
   */
  async getSavedVehicles(): Promise<string[]> {
    try {
      const { keys } = await Preferences.keys();
      const vehicleKeys = keys.filter(key => key.startsWith(this.STORAGE_PREFIX));
      return vehicleKeys.map(key => key.replace(this.STORAGE_PREFIX, ''));
    } catch (error) {
      console.error('Eroare la obținerea vehiculelor salvate:', error);
      return [];
    }
  }

  /**
   * Merge cursele existente cu starea salvată, păstrând statusurile din stare
   */
  mergeCourseStates(serverCourses: Course[], savedCourses: Course[]): Course[] {
    if (!savedCourses.length) {
      return serverCourses;
    }

    const mergedCourses = serverCourses.map(serverCourse => {
      const savedCourse = savedCourses.find(saved => 
        saved.id === serverCourse.id || 
        (saved.uit && saved.uit === serverCourse.uit) ||
        (saved.ikRoTrans && saved.ikRoTrans === serverCourse.ikRoTrans)
      );

      if (savedCourse) {
        // Păstrează statusul din starea salvată, dar restul datelor de pe server
        return {
          ...serverCourse,
          status: savedCourse.status
        };
      }

      return serverCourse;
    });

    console.log(`🔄 ${savedCourses.length} curse cu stare salvată merge cu ${serverCourses.length} curse de pe server`);
    return mergedCourses;
  }
}

export const courseStateManager = new CourseStateManager();