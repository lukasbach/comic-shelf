import React, { useState, useEffect } from 'react';
import { RxPlus, RxLayers, RxSymbol, RxCheck } from 'react-icons/rx';
import * as galleryService from '../services/gallery-service';
import { Gallery } from '../types/gallery';

interface AddToGalleryDialogProps {
  comicPageId: number;
  onClose: () => void;
  onAdded?: () => void;
}

export const AddToGalleryDialog: React.FC<AddToGalleryDialogProps> = ({ comicPageId, onClose, onAdded }) => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGalleryIds, setSelectedGalleryIds] = useState<number[]>([]);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allGalleries, pageGalleries] = await Promise.all([
          galleryService.getGalleries(),
          galleryService.getPageGalleries(comicPageId)
        ]);
        setGalleries(allGalleries);
        setSelectedGalleryIds(pageGalleries.map(g => g.id));
      } catch (err) {
        console.error('Failed to fetch galleries for dialog:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [comicPageId]);

  const handleToggleGallery = async (galleryId: number) => {
    const isSelected = selectedGalleryIds.includes(galleryId);
    try {
      if (isSelected) {
        await galleryService.removePageFromGallery(galleryId, comicPageId);
        setSelectedGalleryIds(prev => prev.filter(id => id !== galleryId));
      } else {
        await galleryService.addPageToGallery(galleryId, comicPageId);
        setSelectedGalleryIds(prev => [...prev, galleryId]);
      }
      onAdded?.();
    } catch (err) {
      console.error('Failed to toggle gallery:', err);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newGalleryName.trim()) return;
    setIsCreating(true);
    try {
      const gId = await galleryService.createGallery(newGalleryName.trim());
      await galleryService.addPageToGallery(gId, comicPageId);
      
      // Update local state
      const newGalleries = await galleryService.getGalleries();
      setGalleries(newGalleries);
      setSelectedGalleryIds(prev => [...prev, gId]);
      setNewGalleryName('');
      onAdded?.();
    } catch (err) {
      alert('Failed to create gallery. Name might already exist.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <RxLayers className="text-pink-500" />
            Add to Gallery
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <RxPlus className="rotate-45 size-6" />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <RxSymbol className="animate-spin text-pink-500" size={24} />
            </div>
          ) : galleries.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No galleries yet.</p>
            </div>
          ) : (
            galleries.map(g => (
              <button
                key={g.id}
                onClick={() => handleToggleGallery(g.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  selectedGalleryIds.includes(g.id)
                    ? 'bg-pink-600/10 border-pink-500 text-pink-400'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex flex-col items-start px-1">
                  <span className="font-bold text-sm tracking-tight">{g.name}</span>
                  <span className="text-[10px] opacity-70 uppercase font-black">{g.page_count} Pages</span>
                </div>
                {selectedGalleryIds.includes(g.id) && <RxCheck size={20} />}
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New gallery name..."
              value={newGalleryName}
              onChange={e => setNewGalleryName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateAndAdd();
              }}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all font-medium"
            />
            <button
              onClick={handleCreateAndAdd}
              disabled={!newGalleryName.trim() || isCreating}
              className="bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white rounded-lg px-3 py-2 text-sm font-bold transition-all shadow-lg shadow-pink-900/20 flex items-center gap-1 shrink-0"
            >
              {isCreating ? <RxSymbol className="animate-spin" /> : <RxPlus />}
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
