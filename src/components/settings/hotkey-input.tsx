import React, { useState, useEffect, useRef } from 'react';
import { RxKeyboard, RxReset, RxCross2 } from 'react-icons/rx';
import { formatKeyEvent, getDisplayKey } from '../../utils/hotkey-utils';

type HotkeyInputProps = {
  value: string;
  onChange: (newKey: string) => void;
  label: string;
  isDuplicate?: boolean;
};

export const HotkeyInput: React.FC<HotkeyInputProps> = ({ value, onChange, label, isDuplicate }) => {
  const [isRecording, setIsRecording] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Don't record modifier-only presses
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        return;
      }

      const keyString = formatKeyEvent(e);
      if (keyString) {
        onChange(keyString);
        setIsRecording(false);
      }
    };

    const handleMouseDownOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsRecording(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('mousedown', handleMouseDownOutside);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('mousedown', handleMouseDownOutside);
    };
  }, [isRecording, onChange]);

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>
      <div className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
        isRecording 
          ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/20' 
          : isDuplicate
            ? 'bg-red-500/5 border-red-500/50'
            : 'bg-slate-800 border-slate-700 hover:border-slate-600'
      }`}>
        <div className="flex-1 font-mono text-sm min-h-[1.5rem] flex items-center">
          {isRecording ? (
            <span className="text-blue-400 animate-pulse">Press a key...</span>
          ) : (
            <span className={isDuplicate ? 'text-red-400' : 'text-slate-200'}>
              {getDisplayKey(value) || 'None'}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {isRecording ? (
            <button
              type="button"
              onClick={() => setIsRecording(false)}
              className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 transition-colors"
              title="Cancel"
            >
              <RxCross2 size={16} />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsRecording(true)}
                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 transition-colors"
                title="Record Hotkey"
              >
                <RxKeyboard size={16} />
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 transition-colors"
                  title="Clear Hotkey"
                >
                  <RxReset size={16} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {isDuplicate && !isRecording && (
        <span className="text-[10px] text-red-400">Duplicate hotkey assignment</span>
      )}
    </div>
  );
};
