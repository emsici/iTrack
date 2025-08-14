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
        bgPrimary: '#1c1917',
        bgSecondary: '#292524',
        bgTertiary: '#3f3f46',
        textPrimary: '#fef3c7',
        textSecondary: '#fed7aa',
        textMuted: '#fdba74',
        borderColor: 'rgba(251, 146, 60, 0.2)',
        shadowColor: 'rgba(0, 0, 0, 0.4)',
        accentColor: '#f97316',
        successColor: '#22c55e',
        warningColor: '#eab308',
        errorColor: '#ef4444'
      },
      business: {
        bgPrimary: '#f8fafc',
        bgSecondary: '#ffffff',
        bgTertiary: '#f1f5f9',
        textPrimary: '#1e293b',
        textSecondary: '#475569',
        textMuted: '#64748b',
        borderColor: 'rgba(59, 130, 246, 0.15)',
        shadowColor: 'rgba(59, 130, 246, 0.1)',
        accentColor: '#3b82f6',
        successColor: '#10b981',
        warningColor: '#f59e0b',
        errorColor: '#ef4444'
      },
      nature: {
        bgPrimary: '#064e3b',
        bgSecondary: '#065f46',
        bgTertiary: '#047857',
        textPrimary: '#d1fae5',
        textSecondary: '#a7f3d0',
        textMuted: '#6ee7b7',
        borderColor: 'rgba(16, 185, 129, 0.2)',
        shadowColor: 'rgba(0, 0, 0, 0.4)',
        accentColor: '#10b981',
        successColor: '#22c55e',
        warningColor: '#f59e0b',
        errorColor: '#ef4444'
      },
      night: {
        bgPrimary: '#1e1b4b',
        bgSecondary: '#312e81',
        bgTertiary: '#4338ca',
        textPrimary: '#e0e7ff',
        textSecondary: '#c7d2fe',
        textMuted: '#a5b4fc',
        borderColor: 'rgba(139, 92, 246, 0.2)',
        shadowColor: 'rgba(0, 0, 0, 0.5)',
        accentColor: '#8b5cf6',
        successColor: '#22c55e',
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