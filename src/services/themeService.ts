import { Preferences } from '@capacitor/preferences';

export type Theme = 'dark' | 'light' | 'driver' | 'business' | 'nature' | 'night';

const THEME_STORAGE_KEY = 'app_theme';

export class ThemeService {
  private currentTheme: Theme = 'dark';
  private listeners: ((theme: Theme) => void)[] = [];

  async loadTheme(): Promise<Theme> {
    try {
      const { value } = await Preferences.get({ key: THEME_STORAGE_KEY });
      if (value && ['light', 'dark', 'driver', 'business', 'nature', 'night'].includes(value)) {
        this.currentTheme = value as Theme;
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
    
    const themeConfigs = {
      light: {
        bgPrimary: '#ffffff',
        bgSecondary: '#f8fafc',
        bgTertiary: '#f1f5f9',
        textPrimary: '#1e293b',
        textSecondary: '#475569',
        textMuted: '#64748b',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        accentColor: '#3b82f6',
        successColor: '#10b981',
        warningColor: '#f59e0b',
        errorColor: '#ef4444'
      },
      dark: {
        bgPrimary: 'rgba(15, 23, 42, 0.95)',
        bgSecondary: 'rgba(30, 41, 59, 0.95)',
        bgTertiary: 'rgba(51, 65, 85, 0.95)',
        textPrimary: '#ffffff',
        textSecondary: '#e2e8f0',
        textMuted: '#94a3b8',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        accentColor: '#60a5fa',
        successColor: '#34d399',
        warningColor: '#fbbf24',
        errorColor: '#f87171'
      },
      driver: {
        bgPrimary: 'rgba(28, 25, 23, 0.95)',
        bgSecondary: 'rgba(41, 37, 36, 0.95)',
        bgTertiary: 'rgba(68, 64, 60, 0.95)',
        textPrimary: '#fff7ed',
        textSecondary: '#fed7aa',
        textMuted: '#fdc977',
        borderColor: 'rgba(251, 146, 60, 0.3)',
        shadowColor: 'rgba(251, 146, 60, 0.2)',
        accentColor: '#fb923c',
        successColor: '#65a30d',
        warningColor: '#eab308',
        errorColor: '#dc2626'
      },
      business: {
        bgPrimary: 'rgba(248, 250, 252, 0.98)',
        bgSecondary: 'rgba(255, 255, 255, 0.95)',
        bgTertiary: 'rgba(241, 245, 249, 0.95)',
        textPrimary: '#0f172a',
        textSecondary: '#334155',
        textMuted: '#64748b',
        borderColor: 'rgba(59, 130, 246, 0.2)',
        shadowColor: 'rgba(59, 130, 246, 0.15)',
        accentColor: '#2563eb',
        successColor: '#059669',
        warningColor: '#d97706',
        errorColor: '#dc2626'
      },
      nature: {
        bgPrimary: 'rgba(6, 78, 59, 0.95)',
        bgSecondary: 'rgba(6, 95, 70, 0.95)',
        bgTertiary: 'rgba(4, 120, 87, 0.95)',
        textPrimary: '#ecfdf5',
        textSecondary: '#bbf7d0',
        textMuted: '#86efac',
        borderColor: 'rgba(34, 197, 94, 0.3)',
        shadowColor: 'rgba(34, 197, 94, 0.2)',
        accentColor: '#16a34a',
        successColor: '#22c55e',
        warningColor: '#ca8a04',
        errorColor: '#dc2626'
      },
      night: {
        bgPrimary: 'rgba(30, 27, 75, 0.95)',
        bgSecondary: 'rgba(49, 46, 129, 0.95)',
        bgTertiary: 'rgba(67, 56, 202, 0.95)',
        textPrimary: '#f0f4ff',
        textSecondary: '#c7d2fe',
        textMuted: '#a5b4fc',
        borderColor: 'rgba(147, 51, 234, 0.3)',
        shadowColor: 'rgba(147, 51, 234, 0.25)',
        accentColor: '#9333ea',
        successColor: '#10b981',
        warningColor: '#f59e0b',
        errorColor: '#f87171'
      }
    };

    const config = themeConfigs[theme];
    
    root.style.setProperty('--bg-primary', config.bgPrimary);
    root.style.setProperty('--bg-secondary', config.bgSecondary);
    root.style.setProperty('--bg-tertiary', config.bgTertiary);
    root.style.setProperty('--text-primary', config.textPrimary);
    root.style.setProperty('--text-secondary', config.textSecondary);
    root.style.setProperty('--text-muted', config.textMuted);
    root.style.setProperty('--border-color', config.borderColor);
    root.style.setProperty('--shadow-color', config.shadowColor);
    root.style.setProperty('--accent-color', config.accentColor);
    root.style.setProperty('--success-color', config.successColor);
    root.style.setProperty('--warning-color', config.warningColor);
    root.style.setProperty('--error-color', config.errorColor);
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

// Theme display names and descriptions
export const THEME_INFO = {
  dark: { name: 'Întunecat', description: 'Tema întunecată pentru economia bateriei', icon: 'moon' },
  light: { name: 'Luminos', description: 'Tema luminoasă pentru vizibilitate maximă', icon: 'sun' },
  driver: { name: 'Șofer', description: 'Tema caldă pentru șoferi profesioniști', icon: 'truck' },
  business: { name: 'Business', description: 'Tema corporate pentru manageri', icon: 'briefcase' },
  nature: { name: 'Natură', description: 'Tema verde pentru relaxare', icon: 'leaf' },
  night: { name: 'Nocturn', description: 'Tema violet pentru condusul nocturn', icon: 'star' }
};