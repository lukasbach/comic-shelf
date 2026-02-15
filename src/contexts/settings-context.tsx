import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppSettings, DEFAULT_SETTINGS, loadSettings, saveSettings } from '../services/settings-service';

type SettingsContextType = {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  isLoading: boolean;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initSettings = async () => {
      try {
        const loadedSettings = await loadSettings();
        setSettings(loadedSettings);
        applyTheme();
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initSettings();
  }, []);

  const applyTheme = useCallback(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add('dark');
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const updated = await new Promise<AppSettings>((resolve) => {
      setSettings((prev) => {
        const next = { ...prev, ...newSettings };
        resolve(next);
        return next;
      });
    });
    await saveSettings(updated);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
