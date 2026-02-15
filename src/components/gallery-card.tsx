import React from 'react';
import { Gallery } from '../types/gallery';
import { RxLayers, RxTrash, RxPencil1 } from 'react-icons/rx';

interface GalleryCardProps {
  gallery: Gallery;
  onClick: () => void;
  onDelete?: () => void;
  onRename?: () => void;
}

export const GalleryCard: React.FC<GalleryCardProps> = ({ gallery, onClick, onDelete, onRename }) => {
  return (
    <div 
      className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-pink-500/50 transition-all cursor-pointer aspect-3/4 flex flex-col shadow-lg hover:shadow-pink-900/10"
      onClick={onClick}
    >
      {/* Stack Effect Placeholder */}
      <div className="flex-1 bg-slate-800 flex items-center justify-center relative">
        <RxLayers size={48} className="text-slate-700 group-hover:text-pink-500/50 transition-colors" />
        
        {/* Info Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex flex-col justify-end p-4">
          <h3 className="text-sm font-bold text-slate-100 truncate group-hover:text-pink-400 transition-colors" title={gallery.name}>
            {gallery.name}
          </h3>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tight">
             <span>{gallery.page_count} Pages</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {onRename && (
          <button
            onClick={(e) => { e.stopPropagation(); onRename(); }}
            className="p-1.5 bg-slate-900/80 hover:bg-blue-600 rounded-lg text-slate-200 transition-all border border-slate-700"
            title="Rename Gallery"
          >
            <RxPencil1 size={14} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 bg-slate-900/80 hover:bg-red-600 rounded-lg text-slate-200 transition-all border border-slate-700"
            title="Delete Gallery"
          >
            <RxTrash size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
