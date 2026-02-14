import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { TabProvider, useTabs } from './tab-context';
import { Comic } from '../types/comic';

const mockComic: Comic = {
  id: 1,
  title: 'Test Comic',
  path: '/test/path',
  artist: 'Artist',
  series: 'Series',
  issue: '1',
  cover_image_path: null,
  page_count: 10,
  is_favorite: 0,
  view_count: 0,
  created_at: '',
  updated_at: '',
};

const TestComponent = () => {
  const { tabs, activeTabId, openTab, openLibraryTab, closeTab, nextTab, prevTab } = useTabs();
  return (
    <div>
      <div data-testid="tab-count">{tabs.length}</div>
      <div data-testid="active-tab-id">{activeTabId}</div>
      <button onClick={() => openTab(mockComic)}>Open Tab</button>
      <button onClick={() => openLibraryTab('/library', 'Explorer')}>Open Library Tab</button>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => closeTab(tab.id)}>Close {tab.id}</button>
      ))}
      <button onClick={nextTab}>Next</button>
      <button onClick={prevTab}>Prev</button>
    </div>
  );
};

describe('tab-context', () => {
  it('opens a new generic tab', async () => {
    let capturedTabs: any[] = [];
    const Inspector = () => {
      const { tabs } = useTabs();
      capturedTabs = tabs;
      return null;
    };

    render(
      <TabProvider>
        <TestComponent />
        <Inspector />
      </TabProvider>
    );

    const openButton = screen.getByText('Open Library Tab');
    await act(async () => {
      openButton.click();
    });

    expect(screen.getByTestId('tab-count').textContent).toBe('1');
    expect(capturedTabs[0].type).toBe('library');
  });

  it('does not open duplicate tabs for same comic', async () => {
    render(
      <TabProvider>
        <TestComponent />
      </TabProvider>
    );

    const openButton = screen.getByText('Open Tab');
    await act(async () => {
      openButton.click();
      openButton.click();
    });

    expect(screen.getByTestId('tab-count').textContent).toBe('1');
  });

  it('closes a tab and updates active tab', async () => {
    render(
      <TabProvider>
        <TestComponent />
      </TabProvider>
    );

    const openButton = screen.getByText('Open Tab');
    await act(async () => {
      openButton.click();
    });

    const closeButton = screen.getByText(/Close/);
    await act(async () => {
      closeButton.click();
    });

    expect(screen.getByTestId('tab-count').textContent).toBe('0');
    expect(screen.getByTestId('active-tab-id').textContent).toBe('');
  });
});
