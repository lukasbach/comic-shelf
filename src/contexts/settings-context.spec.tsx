import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SettingsProvider, useSettings } from './settings-context';
import * as settingsService from '../services/settings-service';

vi.mock('../services/settings-service', () => ({
  loadSettings: vi.fn(),
  saveSettings: vi.fn(),
  DEFAULT_SETTINGS: {
    theme: 'dark',
    hotkeys: {},
  },
}));

const TestComponent = () => {
  const { settings, updateSettings, isLoading } = useSettings();
  if (isLoading) return <div>Loading...</div>;
  return (
    <div>
      <div data-testid="theme">{settings.theme}</div>
      <button onClick={() => updateSettings({ theme: 'light' })}>Change Theme</button>
    </div>
  );
};

describe('settings-context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (settingsService.loadSettings as any).mockResolvedValue({
      ...settingsService.DEFAULT_SETTINGS,
      theme: 'dark',
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
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(addSpy).toHaveBeenCalledWith('dark');
  });

  it('updates settings and applies theme', async () => {
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await waitFor(() => expect(screen.queryByText('Loading...')).toBeNull());
    
    const button = screen.getByText('Change Theme');
    button.click();

    await waitFor(() => expect(screen.getByTestId('theme').textContent).toBe('light'));
    expect(settingsService.saveSettings).toHaveBeenCalledWith(expect.objectContaining({ theme: 'light' }));
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });
});
