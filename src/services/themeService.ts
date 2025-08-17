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
    
    // Set status bar style for Android APK based on theme
    this.setStatusBarStyle(theme);
    
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
        bgPrimary: 'rgba(20, 83, 45, 0.95)',      // Verde închis profesional
        bgSecondary: 'rgba(22, 101, 52, 0.95)',   // Verde mediu elegant  
        bgTertiary: 'rgba(21, 128, 61, 0.95)',    // Verde accent subtil
        textPrimary: '#f0fdf4',                   // Alb-verde foarte deschis
        textSecondary: '#dcfce7',                 // Verde foarte deschis
        textMuted: '#bbf7d0',                     // Verde deschis pentru text secundar
        borderColor: 'rgba(34, 197, 94, 0.25)',  // Margini subtile
        shadowColor: 'rgba(21, 128, 61, 0.3)',   // Umbre elegante
        accentColor: '#16a34a',                   // Verde principal
        successColor: '#22c55e',                  // Verde succes
        warningColor: '#f59e0b',                  // Galben pentru avertizări
        errorColor: '#ef4444'                     // Roșu pentru erori
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

  private setStatusBarStyle(theme: Theme): void {
    // For Android APK - set status bar color based on theme
    const statusBarColor = this.getStatusBarColor(theme);
    const isLightContent = this.isLightStatusBarContent(theme);
    
    // Set meta theme-color for browser/webview
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.getElementsByTagName('head')[0].appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', statusBarColor);
    
    // Android Capacitor status bar plugin - dynamic loading for APK only
    if ((window as any).Capacitor?.isNativePlatform()) {
      try {
        // Use dynamic import to avoid build errors in web environment
        import('@capacitor/status-bar').then(module => {
          const { StatusBar } = module;
          StatusBar.setBackgroundColor({ color: statusBarColor });
          StatusBar.setStyle({ 
            style: isLightContent ? StatusBar.Style.Light : StatusBar.Style.Dark
          });
          console.log(`🎨 Status bar updated: ${statusBarColor}, content: ${isLightContent ? 'LIGHT' : 'DARK'}`);
        }).catch(err => {
          console.log('Status bar plugin not available (browser environment):', err);
        });
      } catch (error) {
        console.log('Status bar configuration skipped (not APK environment):', error);
      }
    }
  }

  private getStatusBarColor(theme: Theme): string {
    const statusBarColors = {
      'dark': '#0f172a',      // Dark blue-gray for dark theme
      'light': '#0f172a',     // FIXED: Dark status bar for light theme
      'business': '#0f172a',  // FIXED: Dark status bar for business theme  
      'driver': '#1c1917',    // Dark brown
      'nature': '#14532d',    // Verde închis profesional pentru status bar
      'night': '#1e1b4b'      // Dark blue
    };
    return statusBarColors[theme] || statusBarColors.dark;
  }

  private isLightStatusBarContent(_theme: Theme): boolean {
    // FIXED: All themes now use light content (white icons/text) on dark status bar
    return true; // Always use light content for consistent dark status bar across all themes
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
  dark: { name: 'Întunecată', description: 'Tema întunecată pentru economia bateriei', icon: 'moon' },
  light: { name: 'Luminoasă', description: 'Tema luminoasă pentru vizibilitate maximă', icon: 'sun' },
  driver: { name: 'Șofer', description: 'Tema caldă pentru șoferi profesioniști', icon: 'truck' },
  business: { name: 'Business', description: 'Tema corporate pentru manageri', icon: 'briefcase' },
  nature: { name: 'Natură', description: 'Tema verde profesională pentru calm și eficiență', icon: 'leaf' },
  night: { name: 'Nocturnă', description: 'Tema violet pentru condusul nocturn', icon: 'star' }
};