/**
 * Theme Service - Gestionează schimbarea temei dark/light
 */

import { Preferences } from '@capacitor/preferences';

export type Theme = 'dark' | 'light';

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
      console.log(`🎨 Theme initialized: ${this.currentTheme}`);
    } catch (error) {
      console.error('Error loading theme:', error);
      this.currentTheme = 'dark';
      this.applyTheme('dark');
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
    document.documentElement.setAttribute('data-theme', theme);
    
    // Aplică tema și pe body pentru compatibilitate
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    } else {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    }
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