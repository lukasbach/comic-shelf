import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { useSettings } from '../../contexts/settings-context';
import { useIndexing } from '../../contexts/indexing-context';
import { useIndexPaths } from '../../hooks/use-index-paths';
import * as indexPathService from '../../services/index-path-service';
import { HotkeyInput } from '../../components/settings/hotkey-input';
import { AppSettings, DEFAULT_SETTINGS } from '../../services/settings-service';
import {
    RxSymbol,
    RxReload,
    RxCheck,
    RxPlus,
    RxTrash,
    RxCross2,
    RxDesktop,
    RxViewHorizontal,
    RxViewVertical,
    RxGrid,
    RxTimer,
    RxKeyboard,
    RxArchive,
    RxLayers
} from 'react-icons/rx';
import { open } from '@tauri-apps/plugin-dialog';

export const Route = createFileRoute('/settings/')({
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, updateSettings, isLoading: loadingSettings } = useSettings();
  const { isIndexing, startIndexing, lastIndexedAt, progress } = useIndexing();
  const { indexPaths, refresh: refreshPaths } = useIndexPaths();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [editingPathId, setEditingPathId] = useState<number | null>(null);
  const [editingPattern, setEditingPattern] = useState('');

  const form = useForm({
    defaultValues: settings as AppSettings,
    listeners: {
      onChangeDebounceMs: 1000,
      onChange: async ({ formApi }) => {
        if (formApi.state.isDirty) {
          setSaveStatus('saving');
          await updateSettings(formApi.state.values as AppSettings);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        }
      }
    }
  });

  // Sync form values if settings load later (e.g. from disk)
  useEffect(() => {
    if (!loadingSettings) {
      form.reset(settings);
    }
  }, [loadingSettings, settings, form]);

  // handleRemovePath etc.

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Comic Library Folder'
      });
      
      if (selected && typeof selected === 'string') {
        await indexPathService.addIndexPath(selected, '{author}/**/{series}');
        await refreshPaths();
        // Trigger indexing for new path
        startIndexing();
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const handleRemovePath = async (id: number) => {
    try {
      await indexPathService.removeIndexPath(id);
      await refreshPaths();
      // Trigger indexing to clean up stale entries
      startIndexing();
    } catch (error) {
      console.error('Failed to remove path:', error);
    }
  };

  const handleUpdatePattern = async (id: number) => {
    try {
      await indexPathService.updateIndexPath(id, editingPattern);
      setEditingPathId(null);
      await refreshPaths();
      // Trigger indexing to refresh metadata with new pattern
      startIndexing();
    } catch (error) {
      console.error('Failed to update pattern:', error);
    }
  };

  const checkDuplicateHotkey = (key: string, name: string) => {
    if (!key) return false;
    const hotkeys = form.getFieldValue('hotkeys') as AppSettings['hotkeys'];
    if (!hotkeys) return false;
    return Object.entries(hotkeys).some(([k, v]) => v === key && k !== name);
  };

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-950">
        <RxSymbol className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto bg-slate-950 text-slate-200">
      <div className="max-w-4xl mx-auto w-full p-8 pb-24 space-y-12">
        <header className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-slate-400 mt-1">Configure your reading experience and library.</p>
          </div>
          <div className="flex items-center gap-4">
            {saveStatus !== 'idle' && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                saveStatus === 'saving' ? 'bg-blue-600/10 text-blue-400' : 'bg-green-600/10 text-green-400'
              }`}>
                {saveStatus === 'saving' ? <RxSymbol className="animate-spin" /> : <RxCheck />}
                {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
              </div>
            )}
          </div>
        </header>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className="space-y-12"
        >
          {/* Indexing Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-green-400">
              <RxArchive size={20} />
              <h2 className="text-xl font-semibold">Library & Indexing</h2>
            </div>
            
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <form.Field name="autoReindex">
                  {(field) => (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={field.state.value}
                        onClick={() => field.handleChange(!field.state.value)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                          field.state.value ? 'bg-blue-600' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            field.state.value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <div>
                        <span className="text-sm font-medium text-slate-200">Auto-reindex on startup</span>
                        <p className="text-[10px] text-slate-500">Scan for new comics when the application opens.</p>
                      </div>
                    </div>
                  )}
                </form.Field>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-slate-200">Index Paths</h3>
                  <p className="text-xs text-slate-500">Directories scanned for comics. Use patterns to extract metadata.</p>
                  <div className="flex gap-4 mt-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span className="bg-slate-800 px-1 rounded font-mono text-blue-400">{"{author}"}</span>
                      <span>Author</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span className="bg-slate-800 px-1 rounded font-mono text-blue-400">{"{series}"}</span>
                      <span>Series</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSelectFolder}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition-colors"
                >
                  <RxPlus /> Add Path
                </button>
              </div>

              <div className="space-y-2">
                {indexPaths.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-800 rounded-lg text-slate-600">
                    <RxArchive size={32} className="mb-2 opacity-50" />
                    <p className="text-sm">No index paths configured.</p>
                  </div>
                ) : (
                  indexPaths.map((path) => (
                    <div key={path.id} className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-800 rounded-lg">
                      <div className="truncate flex-1 mr-4">
                        <div className="text-sm text-slate-200 truncate">{path.path}</div>
                        {editingPathId === path.id ? (
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="text"
                              value={editingPattern}
                              onChange={(e) => setEditingPattern(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdatePattern(path.id!);
                                if (e.key === 'Escape') setEditingPathId(null);
                              }}
                              className="bg-slate-900 border border-blue-500 rounded px-2 py-0.5 text-[10px] text-slate-200 font-mono w-full max-w-xs focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdatePattern(path.id!)}
                              className="text-green-500 hover:text-green-400"
                              title="Save pattern"
                            >
                              <RxCheck size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPathId(null)}
                              className="text-slate-500 hover:text-red-400"
                              title="Cancel"
                            >
                              <RxCross2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPathId(path.id!);
                              setEditingPattern(path.pattern);
                            }}
                            className="text-[10px] text-slate-500 font-mono hover:text-blue-400 transition-colors block mt-1"
                            title="Click to edit pattern"
                          >
                            {path.pattern}
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePath(path.id!)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                      >
                        <RxTrash size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                   {lastIndexedAt ? `Last indexed: ${new Date(lastIndexedAt).toLocaleString()}` : 'Never indexed'}
                </div>
                
                {isIndexing && progress && (
                  <div className="flex-1 max-w-md space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 uppercase">
                      <span>{progress.status === 'scanning' ? 'Scanning...' : 'Indexing...'}</span>
                      <span>{(progress.current ?? 0)} / {(progress.total ?? 0)}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate" title={progress.currentTask || ''}>
                      {progress.currentTask || 'Working...'}
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-green-500 h-full transition-all duration-300"
                        style={{ width: `${progress.percentage ?? (((progress.current ?? 0) / (progress.total ?? 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={startIndexing}
                  disabled={isIndexing}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600/10 hover:bg-green-600/20 border border-green-600/30 rounded-lg text-sm font-medium text-green-400 transition-all disabled:opacity-50"
                >
                  {isIndexing ? <RxSymbol className="animate-spin" /> : <RxReload />}
                  {isIndexing ? 'Indexing...' : 'Force Re-index All'}
                </button>
              </div>
            </div>
          </section>

          {/* Modules Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-pink-400">
              <RxLayers size={20} />
              <h2 className="text-xl font-semibold">Modules</h2>
            </div>
            
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 space-y-6">
              <div className="flex flex-col gap-6">
                <form.Field name="enableGalleries">
                  {(field) => (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={field.state.value}
                        onClick={() => field.handleChange(!field.state.value)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                          field.state.value ? 'bg-pink-600' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            field.state.value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <div>
                        <span className="text-sm font-medium text-slate-200">Enable Galleries</span>
                        <p className="text-[10px] text-slate-500">Create custom collections of pages from different comics.</p>
                      </div>
                    </div>
                  )}
                </form.Field>

                <form.Field name="showViewCount">
                  {(field) => (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={field.state.value}
                        onClick={() => field.handleChange(!field.state.value)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                          field.state.value ? 'bg-pink-600' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            field.state.value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <div>
                        <span className="text-sm font-medium text-slate-200">Viewed Count</span>
                        <p className="text-[10px] text-slate-500">Show how many times you have viewed a comic or page.</p>
                      </div>
                    </div>
                  )}
                </form.Field>
              </div>
            </div>
          </section>

          {/* General Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-blue-400">
              <RxDesktop size={20} />
              <h2 className="text-xl font-semibold">General</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-900/50 p-6 rounded-xl border border-slate-800">
              <form.Field name="defaultViewMode">
                {(field) => (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-300">Default View Mode</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'overview', icon: RxGrid, label: 'Overview' },
                        { value: 'single', icon: RxViewVertical, label: 'Single' },
                        { value: 'scroll', icon: RxViewHorizontal, label: 'Scroll' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.handleChange(opt.value as any)}
                          className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all ${
                            field.state.value === opt.value
                              ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <opt.icon size={18} />
                          <span className="text-[10px] uppercase font-bold tracking-tighter">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </form.Field>

              <form.Field name="defaultFitMode">
                {(field) => (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-300">Default Fit Mode</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'width', label: 'Fit Width' },
                        { value: 'both', label: 'Fit' },
                        { value: 'none', label: 'None (Zoom)' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.handleChange(opt.value as any)}
                          className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all ${
                            field.state.value === opt.value
                              ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-tighter">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </form.Field>

              <form.Field name="defaultZoomLevel">
                {(field) => (
                  <div className="space-y-3 col-span-full">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-slate-300">Default Zoom Level</label>
                      <span className="text-blue-400 font-mono font-bold">{field.state.value}%</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="10"
                        max="500"
                        step="10"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(Number(e.target.value))}
                        className="flex-1 accent-blue-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </form.Field>
            </div>
          </section>

          {/* Slideshow Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-purple-400">
              <RxTimer size={20} />
              <h2 className="text-xl font-semibold">Slideshow</h2>
            </div>
            
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 space-y-8">
              <form.Field name="slideshowDelay">
                {(field) => (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-slate-300">Auto-advance Delay</label>
                      <span className="text-purple-400 font-mono font-bold">{(field.state.value / 1000).toFixed(1)}s</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {[3000, 5000, 8000, 10000, 15000].map((ms) => (
                        <button
                          key={ms}
                          type="button"
                          onClick={() => field.handleChange(ms)}
                          className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${
                            field.state.value === ms
                              ? 'bg-purple-600 border-purple-500 text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          {ms / 1000}s
                        </button>
                      ))}
                      <div className="flex-1 min-w-50 ml-auto">
                        <input
                          type="range"
                          min="1000"
                          max="30000"
                          step="500"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(Number(e.target.value))}
                          className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </form.Field>
            </div>
          </section>

          {/* Hotkeys Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-yellow-400">
              <RxKeyboard size={20} />
              <h2 className="text-xl font-semibold">Hotkeys</h2>
            </div>
            
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'nextPage', label: 'Next Page' },
                { name: 'prevPage', label: 'Previous Page' },
                { name: 'scrollUp', label: 'Scroll Up' },
                { name: 'scrollDown', label: 'Scroll Down' },
                { name: 'zoomIn', label: 'Zoom In' },
                { name: 'zoomOut', label: 'Zoom Out' },
                { name: 'toggleSlideshow', label: 'Toggle Slideshow' },
                { name: 'toggleViewMode', label: 'Cycle View Mode' },
                { name: 'closeTab', label: 'Close Tab' },
                { name: 'nextTab', label: 'Next Tab' },
                { name: 'prevTab', label: 'Previous Tab' },
              ].map((hk) => (
                <form.Field key={hk.name} name={`hotkeys.${hk.name}` as any}>
                  {(field) => (
                    <HotkeyInput
                      label={hk.label}
                      value={field.state.value as string}
                      onChange={(val) => field.handleChange(val)}
                      isDuplicate={checkDuplicateHotkey(field.state.value as string, hk.name)}
                    />
                  )}
                </form.Field>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 italic">Hotkeys are automatically disabled when typing in input fields.</p>
          </section>
        </form>

        <footer className="pt-12 border-t border-slate-800 flex gap-4">
           <button
             type="button"
             onClick={() => {
                if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
                  form.reset(DEFAULT_SETTINGS);
                  updateSettings(DEFAULT_SETTINGS);
                }
             }}
             className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
           >
             Reset to Defaults
           </button>
        </footer>
      </div>
    </div>
  );
}
