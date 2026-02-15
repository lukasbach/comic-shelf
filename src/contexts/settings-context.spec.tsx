import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SettingsProvider, useSettings } from './settings-context';
import * as settingsService from '../services/settings-service';

vi.mock('../services/settings-service', () => ({
  loadSettings: vi.fn(),
  saveSettings: vi.fn(),
  DEFAULT_SETTINGS: {
    hotkeys: {},
    defaultZoomLevel: 100,
  },
}));

const TestComponent = () => {
  const { settings, updateSettings, isLoading } = useSettings();
  if (isLoading) return <div>Loading...</div>;
  return (
    <div>
      <div data-testid="zoom">{settings.defaultZoomLevel}</div>
      <button onClick={() => updateSettings({ defaultZoomLevel: 150 })}>Change Zoom</button>
    </div>
  );
};

describe('settings-context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (settingsService.loadSettings as any).mockResolvedValue({
      ...settingsService.DEFAULT_SETTINGS,
      defaultZoomLevel: 100,
    });
    (settingsService.saveSettings as any).mockResolvedValue(undefined);
  });

  it('provides settings after loading', async () => {
    // Mock classList.add/remove because jsdom is used
    const addSpy = vi.spyOn(document.documentElement.classList, 'add');
    vi.spyOn(document.documentElement.classList, 'remove');

    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    expect(screen.getByText('Loading...')).toBeTruthy();

    await waitFor(() => expect(screen.queryByText('Loading...')).toBeNull());
    expect(screen.getByTestId('zoom').textContent).toBe('100');
    expect(addSpy).toHaveBeenCalledWith('dark');
  });

  it('updates settings', async () => {
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await waitFor(() => expect(screen.queryByText('Loading...')).toBeNull());
    
    const button = screen.getByText('Change Zoom');
    button.click();

    await waitFor(() => expect(screen.getByTestId('zoom').textContent).toBe('150'));
    expect(settingsService.saveSettings).toHaveBeenCalledWith(expect.objectContaining({ defaultZoomLevel: 150 }));
  });
});
