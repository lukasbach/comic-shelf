import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as comicPageService from './comic-page-service';
import * as dbModule from './database';

vi.mock('./database', () => ({
  getDb: vi.fn(),
}));

describe('comic-page-service', () => {
  const mockDb = {
    select: vi.fn(),
    execute: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (dbModule.getDb as any).mockResolvedValue(mockDb);
  });

  it('updatePageLastOpened should call execute with datetime', async () => {
    await comicPageService.updatePageLastOpened(1);
    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE comic_pages SET last_opened_at = datetime(\'now\') WHERE id = $1'),
      [1]
    );
  });
});
