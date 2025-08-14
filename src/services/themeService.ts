/**
 * Theme Service - Gestionează schimbarea temei dark/light
 */

import { Preferences } from '@capacitor/preferences';

export type Theme = 'dark' | 'light' | 'auto' | 'corporate';

class ThemeService {
  private readonly THEME_KEY = 'itrack_theme';
  private currentTheme: Theme = 'dark';
  private listeners: Array<(theme: Theme) => void> = [];

  /**
   * Inițializează tema din storage
   */
  async initializeTheme(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: this.THEME_KEY });
      this.currentTheme = (value as Theme) || 'dark';
      this.applyTheme(this.currentTheme);
      
      // Pentru tema auto, ascultă schimbările de preferință sistem
      if (this.currentTheme === 'auto') {
        this.setupAutoThemeListener();
      }
      
      console.log(`🎨 Theme initialized: ${this.currentTheme}`);
    } catch (error) {
      console.error('Error loading theme:', error);
      this.currentTheme = 'dark';
      this.applyTheme('dark');
    }
  }

  /**
   * Configurează listener pentru tema automată
   */
  private setupAutoThemeListener(): void {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        if (this.currentTheme === 'auto') {
          this.applyTheme('auto');
          this.notifyListeners('auto');
        }
      };
      
      // Folosește addEventListener dacă e disponibil, altfel addListener (legacy)
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else {
        mediaQuery.addListener(handleChange);
      }
    }
  }

  /**
   * Obține tema curentă
   */
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Schimbă tema
   */
  async setTheme(theme: Theme): Promise<void> {
    try {
      this.currentTheme = theme;
      await Preferences.set({
        key: this.THEME_KEY,
        value: theme
      });
      this.applyTheme(theme);
      
      // Configurează listener pentru tema auto
      if (theme === 'auto') {
        this.setupAutoThemeListener();
      }
      
      this.notifyListeners(theme);
      console.log(`🎨 Theme changed to: ${theme}`);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }

  /**
   * Toggle între dark și light
   */
  async toggleTheme(): Promise<void> {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    await this.setTheme(newTheme);
  }

  /**
   * Aplică tema în CSS
   */
  private applyTheme(theme: Theme): void {
    // Pentru tema auto, detectează preferința sistemului
    let effectiveTheme = theme;
    if (theme === 'auto') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-effective-theme', effectiveTheme);
    
    // Curăță toate clasele de temă existente
    document.body.classList.remove('dark-theme', 'light-theme', 'auto-theme', 'corporate-theme');
    
    // Aplică clasa temei
    document.body.classList.add(`${theme}-theme`);
    
    console.log(`🎨 Applied theme: ${theme} (effective: ${effectiveTheme})`);
  }

  /**
   * Adaugă listener pentru schimbări de temă
   */
  addThemeListener(listener: (theme: Theme) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Elimină listener
   */
  removeThemeListener(listener: (theme: Theme) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notifică toți listeners-ii
   */
  private notifyListeners(theme: Theme): void {
    this.listeners.forEach(listener => listener(theme));
  }
}

// Export singleton instance
export const themeService = new ThemeService();