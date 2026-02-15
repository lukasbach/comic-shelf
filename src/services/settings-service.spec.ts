import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as settingsService from './settings-service';

// Mock the store plugin
vi.mock('@tauri-apps/plugin-store', () => ({
  load: vi.fn(),
}));

import { load } from '@tauri-apps/plugin-store';

describe('settings-service', () => {
  const mockStore = {
    get: vi.fn(),
    set: vi.fn(),
    save: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (load as any).mockResolvedValue(mockStore);
  });

  it('loadSettings should return default settings when store is empty', async () => {
    mockStore.get.mockResolvedValue(null);

    const settings = await settingsService.loadSettings();

    expect(settings).toEqual(settingsService.DEFAULT_SETTINGS);
    expect(mockStore.get).toHaveBeenCalledWith('settings');
  });

  it('loadSettings should merge saved settings with defaults', async () => {
    const savedSettings = { slideshowDelay: 5000 };
    mockStore.get.mockResolvedValue(savedSettings);

    const settings = await settingsService.loadSettings();

    expect(settings.slideshowDelay).toBe(5000);
    expect(settings.hotkeys.nextPage).toBe(settingsService.DEFAULT_SETTINGS.hotkeys.nextPage);
  });

  it('saveSettings should call set and save', async () => {
    const newSettings = { ...settingsService.DEFAULT_SETTINGS, slideshowDelay: 5000 };
    
    await settingsService.saveSettings(newSettings);

    expect(mockStore.set).toHaveBeenCalledWith('settings', newSettings);
    expect(mockStore.save).toHaveBeenCalled();
  });
});
