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
   * ACTIVEAZĂ optimizările pentru TOATE telefoanele Android
   * Nu mai detectăm model specific - optimizăm universal
   */
  private shouldOptimize(): boolean {
    // OPTIMIZEAZĂ ÎNTOTDEAUNA pe Android pentru performanță maximă
    const isAndroid = /android/i.test(navigator.userAgent);
    const memory = (navigator as any).deviceMemory;
    
    logGPS(`📱 Optimizare universală Android: Memory=${memory || 'unknown'}GB, Optimizing=true`);
    return isAndroid || true; // Optimizăm întotdeauna pentru toate device-urile
  }

  /**
   * OPTIMIZEAZĂ aplicația pentru performanță maximă pe TOATE dispozitivele
   */
  optimize(): void {
    if (this.isOptimized) return;

    const shouldOptimize = this.shouldOptimize();
    
    if (shouldOptimize) {
      logGPS(`🏎️ ACTIVEAZĂ MODUL PERFORMANȚĂ pentru toate telefoanele Android`);
      
      // 1. Reduce durata animațiilor
      this.optimizeAnimations();
      
      // 2. Dezactivează efectele vizuale grele
      this.optimizeVisualEffects();
      
      // 3. Reduce frecvența polling-ului
      this.optimizePolling();
      
      // 4. Curăță interval-urile inutile
      this.cleanupIntervals();
      
      this.isOptimized = true;
      logGPS(`✅ MOD PERFORMANȚĂ activat - lag-ul eliminat pentru toate device-urile`);
    }
  }

  /**
   * REDUCE durata animațiilor pentru responsivitate mai bună pe toate device-urile
   */
  private optimizeAnimations(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* PERFORMANȚĂ UNIVERSALĂ: Reduce durata tuturor animațiilor */
      *, *::before, *::after {
        animation-duration: 0.15s !important;
        animation-delay: 0s !important;
        transition-duration: 0.15s !important;
        transition-delay: 0s !important;
      }
      
      /* Dezactivează animațiile complexe pe toate dispozitivele */
      .course-card-compact {
        transition: transform 0.1s ease !important;
      }
      
      .btn, button {
        transition: background-color 0.1s ease !important;
      }
    `;
    document.head.appendChild(style);
    logGPS(`⚡ Animații optimizate pentru toate telefoanele Android`);
  }

  /**
   * DEZACTIVEAZĂ efectele vizuale grele pentru performanță pe toate device-urile
   */
  private optimizeVisualEffects(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* PERFORMANȚĂ UNIVERSALĂ: Dezactivează efectele vizuale grele */
      .vehicle-screen.courses-loaded {
        backdrop-filter: none !important;
        background: #1e293b !important; /* Culoare solidă */
      }
      
      .course-card-compact {
        backdrop-filter: blur(5px) !important; /* Redus de la 12px */
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important; /* Umbră redusă */
      }
      
      /* Dezactivează efectele glassmorphism */
      .glassmorphism {
        backdrop-filter: none !important;
        background: rgba(255, 255, 255, 0.95) !important;
      }
    `;
    document.head.appendChild(style);
    logGPS(`🎨 Efecte vizuale reduse pentru performanță universală Android`);
  }

  /**
   * REDUCE frecvențele de polling pentru mai puțin CPU usage pe toate device-urile
   */
  private optimizePolling(): void {
    // Instrucțiuni pentru serviciile GPS să folosească intervale mai mari
    (window as any).__PERFORMANCE_MODE__ = {
      gpsInterval: 8000,       // 8s în loc de 5s (compromis între performanță și precizie)
      monitoringInterval: 25000, // 25s în loc de 15s
      syncInterval: 15000,     // 15s în loc de 10s
    };
    logGPS(`⏱️ Frecvențe polling reduse pentru performanță universală Android`);
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