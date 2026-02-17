import { load } from '@tauri-apps/plugin-store';
import { Tab } from '../stores/tab-store';

const STORE_PATH = 'tabs.json';

export type PersistedTabState = {
  tabs: Tab[];
  activeTabId: string | null;
};

/**
 * Save tabs to persistent storage
 */
export const saveTabs = async (tabs: Tab[], activeTabId: string | null): Promise<void> => {
  try {
    const store = await load(STORE_PATH, { autoSave: 100, defaults: {} });
    const state: PersistedTabState = { tabs, activeTabId };
    await store.set('tabState', state);
    await store.save();
  } catch (error) {
    console.error('Failed to save tabs:', error);
  }
};

/**
 * Load tabs from persistent storage
 */
export const loadTabs = async (): Promise<PersistedTabState | null> => {
  try {
    const store = await load(STORE_PATH, { autoSave: 100, defaults: {} });
    const state = await store.get<PersistedTabState>('tabState');
    return state || null;
  } catch (error) {
    console.error('Failed to load tabs:', error);
    return null;
  }
};

/**
 * Clear saved tab state
 */
export const clearTabs = async (): Promise<void> => {
  try {
    const store = await load(STORE_PATH, { autoSave: 100, defaults: {} });
    await store.delete('tabState');
    await store.save();
  } catch (error) {
    console.error('Failed to clear tabs:', error);
  }
};
