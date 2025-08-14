import { Preferences } from '@capacitor/preferences';

export type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'app_theme';

export class ThemeService {
  private currentTheme: Theme = 'dark';
  private listeners: ((theme: Theme) => void)[] = [];

  async loadTheme(): Promise<Theme> {
    try {
      const { value } = await Preferences.get({ key: THEME_STORAGE_KEY });
      if (value === 'light' || value === 'dark') {
        this.currentTheme = value;
      }
    } catch (error) {
      console.log('Error loading theme, using default:', error);
    }
    return this.currentTheme;
  }

  async setTheme(theme: Theme): Promise<void> {
    try {
      this.currentTheme = theme;
      await Preferences.set({ key: THEME_STORAGE_KEY, value: theme });
      this.applyTheme(theme);
      this.notifyListeners(theme);
      console.log(`🎨 Theme changed to: ${theme}`);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }

  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  onThemeChange(callback: (theme: Theme) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    
    if (theme === 'light') {
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f8fafc');
      root.style.setProperty('--bg-tertiary', '#f1f5f9');
      root.style.setProperty('--text-primary', '#1e293b');
      root.style.setProperty('--text-secondary', '#475569');
      root.style.setProperty('--text-muted', '#64748b');
      root.style.setProperty('--border-color', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--accent-color', '#3b82f6');
      root.style.setProperty('--success-color', '#10b981');
      root.style.setProperty('--warning-color', '#f59e0b');
      root.style.setProperty('--error-color', '#ef4444');
    } else {
      root.style.setProperty('--bg-primary', 'rgba(15, 23, 42, 0.95)');
      root.style.setProperty('--bg-secondary', 'rgba(30, 41, 59, 0.95)');
      root.style.setProperty('--bg-tertiary', 'rgba(51, 65, 85, 0.95)');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#e2e8f0');
      root.style.setProperty('--text-muted', '#94a3b8');
      root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.3)');
      root.style.setProperty('--accent-color', '#60a5fa');
      root.style.setProperty('--success-color', '#34d399');
      root.style.setProperty('--warning-color', '#fbbf24');
      root.style.setProperty('--error-color', '#f87171');
    }
  }

  private notifyListeners(theme: Theme): void {
    this.listeners.forEach(listener => listener(theme));
  }

  async initialize(): Promise<Theme> {
    const theme = await this.loadTheme();
    this.applyTheme(theme);
    return theme;
  }
}

export const themeService = new ThemeService();