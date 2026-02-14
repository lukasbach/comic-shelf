import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { TabProvider, useTabs } from './tab-context';
import { Comic } from '../types/comic';

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  useRouterState: () => ({
    location: {
      pathname: '/library',
    },
  }),
  useNavigate: () => vi.fn(),
}));

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
  is_viewed: 0,
  view_count: 0,
  last_opened_at: null,
  created_at: '',
  updated_at: '',
};

const TestComponent = () => {
  const { tabs, activeTabId, openTab, closeTab, reorderTabs } = useTabs();
  return (
    <div>
      <div data-testid="tab-count">{tabs.length}</div>
      <div data-testid="active-tab-id">{activeTabId ?? ''}</div>
      <div data-testid="tab-ids">{tabs.map(t => t.id).join(',')}</div>
      <button onClick={() => openTab(mockComic)}>Open Tab</button>
      <button onClick={() => reorderTabs(0, 1)}>Reorder 0 to 1</button>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => closeTab(tab.id)}>Close {tab.id}</button>
      ))}
    </div>
  );
};

describe('tab-context', () => {
  it('automatically creates a tab for current route', async () => {
    render(
      <TabProvider>
        <TestComponent />
      </TabProvider>
    );

    // Wait for initial tab creation
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(screen.getByTestId('tab-count').textContent).toBe('1');
  });

  it('opens a new tab for comic', async () => {
    render(
      <TabProvider>
        <TestComponent />
      </TabProvider>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    const openButton = screen.getByText('Open Tab');
    await act(async () => {
      openButton.click();
    });

    // Should have initial tab + comic tab
    expect(screen.getByTestId('tab-count').textContent).toBe('2');
  });

  it('creates new tabs when opening comics', async () => {
    render(
      <TabProvider>
        <TestComponent />
      </TabProvider>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    const openButton = screen.getByText('Open Tab');
    await act(async () => {
      openButton.click();
      openButton.click();
    });

    // Should have initial tab + 2 comic tabs (openTab always creates new tabs)
    expect(screen.getByTestId('tab-count').textContent).toBe('3');
  });

  it('reorders tabs', async () => {
    render(
      <TabProvider>
        <TestComponent />
      </TabProvider>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    const openButton = screen.getByText('Open Tab');
    await act(async () => {
      openButton.click();
    });

    const initialOrder = screen.getByTestId('tab-ids').textContent?.split(',') || [];
    expect(initialOrder.length).toBe(2);

    const reorderButton = screen.getByText('Reorder 0 to 1');
    await act(async () => {
      reorderButton.click();
    });

    const newOrder = screen.getByTestId('tab-ids').textContent?.split(',') || [];
    expect(newOrder[0]).toBe(initialOrder[1]);
    expect(newOrder[1]).toBe(initialOrder[0]);
  });
});
