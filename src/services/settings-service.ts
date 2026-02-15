import { load } from '@tauri-apps/plugin-store';

export type AppSettings = {
  hotkeys: {
    nextPage: string;
    prevPage: string;
    scrollUp: string;
    scrollDown: string;
    zoomIn: string;
    zoomOut: string;
    toggleSlideshow: string;
    toggleViewMode: string;
    closeTab: string;
    nextTab: string;
    prevTab: string;
  };
  defaultZoomLevel: number;       // percentage, e.g. 100
  defaultFitMode: 'width' | 'both' | 'none';
  defaultViewMode: 'single' | 'scroll' | 'overview';
  slideshowDelay: number;         // milliseconds
  slideshowAutoScroll: boolean;
  autoReindex: boolean;
  lastIndexedAt: string | null;
  enableGalleries: boolean;
  showViewCount: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  hotkeys: {
    nextPage: 'ArrowRight',
    prevPage: 'ArrowLeft',
    scrollUp: 'ArrowUp',
    scrollDown: 'ArrowDown',
    zoomIn: '+',
    zoomOut: '-',
    toggleSlideshow: 's',
    toggleViewMode: 'v',
    closeTab: 'w',
    nextTab: 'ctrl+Tab',
    prevTab: 'ctrl+shift+Tab',
  },
  defaultZoomLevel: 100,
  defaultFitMode: 'width',
  defaultViewMode: 'overview',
  slideshowDelay: 5000,
  slideshowAutoScroll: true,
  autoReindex: true,
  lastIndexedAt: null,
  enableGalleries: false,
  showViewCount: false,
};

const STORE_PATH = 'settings.json';

export const loadSettings = async (): Promise<AppSettings> => {
  const store = await load(STORE_PATH, { autoSave: 100, defaults: {} });
  const settings = await store.get<AppSettings>('settings');
  return { ...DEFAULT_SETTINGS, ...settings };
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  const store = await load(STORE_PATH, { autoSave: 100, defaults: {} });
  await store.set('settings', settings);
  await store.save();
};

export const getSetting = async <K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> => {
  const settings = await loadSettings();
  return settings[key];
};

export const setSetting = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> => {
  const settings = await loadSettings();
  settings[key] = value;
  await saveSettings(settings);
};
