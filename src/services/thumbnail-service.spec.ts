import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as thumbnailService from './thumbnail-service';
import { exists, mkdir, writeFile, stat } from '@tauri-apps/plugin-fs';

vi.mock('@tauri-apps/plugin-fs', () => ({
  exists: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  remove: vi.fn(),
  stat: vi.fn(),
  readDir: vi.fn(),
}));

vi.mock('@tauri-apps/api/path', () => ({
  appDataDir: vi.fn().mockResolvedValue('app-data'),
  join: vi.fn().mockImplementation((...args) => args.join('/')),
}));

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: vi.fn().mockImplementation((p) => `asset://${p}`),
}));

describe('thumbnail-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Canvas and Image
    const mockCanvas = {
      getContext: vi.fn().mockReturnValue({
        drawImage: vi.fn(),
      }),
      toBlob: vi.fn().mockImplementation((cb) => cb(new Blob(['test'], { type: 'image/jpeg' }))),
      width: 0,
      height: 0,
    };

    vi.stubGlobal('document', {
      createElement: vi.fn().mockImplementation((tag) => {
        if (tag === 'canvas') return mockCanvas;
        return {};
      }),
    });

    vi.stubGlobal('Image', class {
      onload: () => void = () => {};
      onerror: () => void = () => {};
      width: number = 1000;
      height: number = 1000;
      src: string = '';
      constructor() {
        setTimeout(() => this.onload(), 0);
      }
    });

    vi.stubGlobal('Blob', class {
      constructor() {}
      async arrayBuffer() {
        return new ArrayBuffer(0);
      }
    });
  });

  it('getThumbnailDir should create directory if it does not exist', async () => {
    (exists as any).mockResolvedValue(false);
    
    await thumbnailService.getThumbnailDir();
    
    expect(mkdir).toHaveBeenCalledWith('app-data/thumbnails', { recursive: true });
  });

  it('generateThumbnail should skip if cache is valid', async () => {
    (exists as any).mockResolvedValue(true);
    (stat as any).mockImplementation((path: string) => {
        if (path.includes('source')) return Promise.resolve({ mtime: 100 });
        if (path.includes('thumb')) return Promise.resolve({ mtime: 200 });
        return Promise.reject();
    });

    const path = await thumbnailService.generateThumbnail('source.jpg', 1, 1);
    
    expect(path).toBe('app-data/thumbnails/1/1.jpg');
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('generateThumbnail should generate if cache is missing', async () => {
    (exists as any).mockResolvedValue(false);
    
    await thumbnailService.generateThumbnail('source.jpg', 1, 1);
    
    expect(writeFile).toHaveBeenCalled();
  });
});
