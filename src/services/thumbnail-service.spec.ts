import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as thumbnailService from './thumbnail-service';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('thumbnail-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generateThumbnail should invoke Rust path thumbnail command', async () => {
    vi.mocked(invoke).mockResolvedValue('thumb/path.jpg');

    const path = await thumbnailService.generateThumbnail('source.jpg', 1, 1);

    expect(path).toBe('thumb/path.jpg');
    expect(invoke).toHaveBeenCalledWith('generate_thumbnail_from_path', {
      sourceImagePath: 'source.jpg',
      comicId: 1,
      pageNumber: 1,
    });
  });

  it('generateThumbnailFromBytes should invoke Rust bytes thumbnail command', async () => {
    vi.mocked(invoke).mockResolvedValue('thumb/path.jpg');

    const path = await thumbnailService.generateThumbnailFromBytes(new Uint8Array([1, 2, 3]), 1, 2);

    expect(path).toBe('thumb/path.jpg');
    expect(invoke).toHaveBeenCalledWith('generate_thumbnail_from_bytes', {
      imageBytes: [1, 2, 3],
      comicId: 1,
      pageNumber: 2,
    });
  });

  it('cleanupOrphans should invoke orphan cleanup command', async () => {
    await thumbnailService.cleanupOrphans([1, '2']);

    expect(invoke).toHaveBeenCalledWith('cleanup_orphan_thumbnails', {
      activeComicIds: [1, 2],
    });
  });
});
