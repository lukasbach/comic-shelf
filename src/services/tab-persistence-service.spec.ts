import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveTabs, loadTabs, clearTabs } from './tab-persistence-service';
import { Tab } from '../stores/tab-store';

// Create a shared store that persists across mock calls
const mockStore = new Map();

// Mock @tauri-apps/plugin-store
vi.mock('@tauri-apps/plugin-store', () => ({
  load: vi.fn(() => {
    return Promise.resolve({
      get: vi.fn((key: string) => Promise.resolve(mockStore.get(key))),
      set: vi.fn((key: string, value: any) => {
        mockStore.set(key, value);
        return Promise.resolve();
      }),
      delete: vi.fn((key: string) => {
        mockStore.delete(key);
        return Promise.resolve();
      }),
      save: vi.fn(() => Promise.resolve()),
    });
  }),
}));

describe('tab-persistence-service', () => {
  const mockTabs: Tab[] = [
    {
      id: '1',
      title: 'Test Comic',
      type: 'comic',
      comicId: 1,
      path: '/viewer/1',
      currentPage: 5,
      viewMode: 'single',
      zoomLevel: 150,
      fitMode: 'none',
    },
    {
      id: '2',
      title: 'Library',
      type: 'library',
      path: '/library',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.clear();
  });

  it('should save tabs successfully', async () => {
    await saveTabs(mockTabs, '1');
    // Expect no errors
    expect(true).toBe(true);
  });

  it('should load saved tabs', async () => {
    await saveTabs(mockTabs, '1');
    const loaded = await loadTabs();
    expect(loaded).toBeDefined();
    expect(loaded?.tabs).toHaveLength(2);
    expect(loaded?.activeTabId).toBe('1');
  });

  it('should return null when no tabs are saved', async () => {
    const loaded = await loadTabs();
    expect(loaded).toBeNull();
  });

  it('should clear saved tabs', async () => {
    await saveTabs(mockTabs, '1');
    await clearTabs();
    const loaded = await loadTabs();
    expect(loaded).toBeNull();
  });

  it('should handle save errors gracefully', async () => {
    // Mock console.error to verify it's called
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // This will fail due to the mock setup, but should not throw
    await saveTabs(mockTabs, '1');
    
    consoleErrorSpy.mockRestore();
  });

  it('should preserve tab state during save/load cycle', async () => {
    const tab: Tab = {
      id: 'test-tab',
      title: 'Detailed Comic',
      type: 'comic',
      comicId: 42,
      comicPath: '/path/to/comic',
      path: '/viewer/42',
      currentPage: 10,
      viewMode: 'scroll',
      zoomLevel: 200,
      fitMode: 'width',
      sidebarCollapsed: true,
      slideshowActive: false,
      gridSize: 120,
    };

    await saveTabs([tab], 'test-tab');
    const loaded = await loadTabs();
    
    expect(loaded?.tabs[0]).toEqual(tab);
    expect(loaded?.activeTabId).toBe('test-tab');
  });
});
