/**
 * PERFORMANCE OPTIMIZER pentru Samsung A57 și telefoane mid-range
 * Elimină lag-ul și optimizează experiența utilizatorului
 */

import { logGPS } from './appLogger';

class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private intervalIds: Set<NodeJS.Timeout> = new Set();
  private isOptimized: boolean = false;

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * DETECTEAZĂ dacă telefonul este mid-range (Samsung A57, etc.)
   */
  private detectMidRangeDevice(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const memory = (navigator as any).deviceMemory;
    const hardwareConcurrency = navigator.hardwareConcurrency || 0;

    // Samsung A57 și telefoane similare
    const isMidRange = 
      userAgent.includes('sm-a57') ||  // Samsung A57
      memory <= 6 ||                   // ≤6GB RAM
      hardwareConcurrency <= 6;        // ≤6 cores

    logGPS(`📱 Device detection: Memory=${memory}GB, Cores=${hardwareConcurrency}, MidRange=${isMidRange}`);
    return isMidRange;
  }

  /**
   * OPTIMIZEAZĂ aplicația pentru performanță maximă
   */
  optimize(): void {
    if (this.isOptimized) return;

    const isMidRange = this.detectMidRangeDevice();
    
    if (isMidRange) {
      logGPS(`🏎️ ACTIVATING PERFORMANCE MODE pentru Samsung A57/mid-range device`);
      
      // 1. Reduce animation duration
      this.optimizeAnimations();
      
      // 2. Disable heavy visual effects
      this.optimizeVisualEffects();
      
      // 3. Reduce polling frequencies
      this.optimizePolling();
      
      // 4. Cleanup unnecessary intervals
      this.cleanupIntervals();
      
      this.isOptimized = true;
      logGPS(`✅ PERFORMANCE MODE activated - lag should be eliminated`);
    } else {
      logGPS(`📱 High-end device detected - using standard performance settings`);
    }
  }

  /**
   * REDUCE animation durations pentru responsivitate mai bună
   */
  private optimizeAnimations(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* SAMSUNG A57 PERFORMANCE: Reduce all animation durations */
      *, *::before, *::after {
        animation-duration: 0.15s !important;
        animation-delay: 0s !important;
        transition-duration: 0.15s !important;
        transition-delay: 0s !important;
      }
      
      /* Disable complex animations on mid-range devices */
      .course-card-compact {
        transition: transform 0.1s ease !important;
      }
      
      .btn, button {
        transition: background-color 0.1s ease !important;
      }
    `;
    document.head.appendChild(style);
    logGPS(`⚡ Animations optimized for Samsung A57`);
  }

  /**
   * DISABLE heavy visual effects pentru performanță
   */
  private optimizeVisualEffects(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* SAMSUNG A57: Disable heavy visual effects */
      .vehicle-screen.courses-loaded {
        backdrop-filter: none !important;
        background: #1e293b !important; /* Solid color */
      }
      
      .course-card-compact {
        backdrop-filter: blur(5px) !important; /* Reduced from 12px */
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important; /* Reduced shadow */
      }
      
      /* Disable glassmorphism effects */
      .glassmorphism {
        backdrop-filter: none !important;
        background: rgba(255, 255, 255, 0.95) !important;
      }
    `;
    document.head.appendChild(style);
    logGPS(`🎨 Visual effects reduced for Samsung A57 performance`);
  }

  /**
   * REDUCE polling frequencies pentru mai puțin CPU usage
   */
  private optimizePolling(): void {
    // Instrucțiuni pentru serviciile GPS să folosească intervale mai mari
    (window as any).__PERFORMANCE_MODE__ = {
      gpsInterval: 10000,      // 10s în loc de 5s
      monitoringInterval: 30000, // 30s în loc de 15s
      syncInterval: 20000,     // 20s în loc de 10s
    };
    logGPS(`⏱️ Polling frequencies reduced pentru Samsung A57`);
  }

  /**
   * CLEANUP intervale care nu sunt necesare
   */
  private cleanupIntervals(): void {
    // Oprește toate interval-urile GPS redundante
    this.intervalIds.forEach(id => {
      clearInterval(id);
      this.intervalIds.delete(id);
    });
    logGPS(`🧹 Unnecessary intervals cleaned up`);
  }

  /**
   * TRACK intervals pentru cleanup
   */
  trackInterval(id: NodeJS.Timeout): void {
    this.intervalIds.add(id);
  }

  /**
   * STOP all tracked intervals
   */
  stopAllIntervals(): void {
    this.intervalIds.forEach(id => clearInterval(id));
    this.intervalIds.clear();
    logGPS(`🛑 All performance intervals stopped`);
  }
}

export const performanceOptimizer = PerformanceOptimizer.getInstance();