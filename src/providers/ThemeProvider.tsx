import { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { TamaguiProvider, Theme } from 'tamagui';
import tamaguiConfig from '../../tamagui.config';
import { useUIStore } from '@/stores/ui.store';

interface ThemeProviderProps {
  children: React.ReactNode;
}

interface AppThemeContextValue {
  themeMode: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function useAppTheme() {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }

  return context;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemTheme = useColorScheme();
  const themeMode = useUIStore((state) => state.themeMode);
  const setThemeMode = useUIStore((state) => state.setThemeMode);

  const resolvedTheme = themeMode === 'system'
    ? (systemTheme === 'dark' ? 'dark' : 'light')
    : themeMode;

  const value = useMemo(
    () => ({
      themeMode,
      resolvedTheme,
      setThemeMode,
    }),
    [themeMode, resolvedTheme, setThemeMode]
  );

  return (
    <AppThemeContext.Provider value={value}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <Theme name={resolvedTheme}>
          {children}
        </Theme>
      </TamaguiProvider>
    </AppThemeContext.Provider>
  );
}
