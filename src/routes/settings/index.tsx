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
    RxDesktop,
    RxMoon,
    RxSun,
    RxViewHorizontal,
    RxViewVertical,
    RxGrid,
    RxTimer,
    RxKeyboard,
    RxArchive
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

  const form = useForm({
    defaultValues: settings,
    onSubmit: async ({ value }) => {
      setSaveStatus('saving');
      await updateSettings(value);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
  });

  // Sync form values if settings load later
  useEffect(() => {
    if (!loadingSettings) {
      form.setFieldValue('hotkeys', settings.hotkeys);
      form.setFieldValue('defaultZoomLevel', settings.defaultZoomLevel);
      form.setFieldValue('defaultViewMode', settings.defaultViewMode);
      form.setFieldValue('slideshowDelay', settings.slideshowDelay);
      form.setFieldValue('theme', settings.theme);
      form.setFieldValue('slideshowAutoScroll', settings.slideshowAutoScroll);
    }
  }, [loadingSettings, settings, form]);

  // Auto-save changes
  useEffect(() => {
    const unsub = form.subscribe((state) => {
      // If dirty, trigger onSubmit logic via a direct update call
      // We don't call form.handleSubmit() because it has side effects like validation
      // and we want this to be semi-debounceable or at least efficient.
      // For now, we'll just use a simple check.
      if (state.isDirty) {
        updateSettings(state.values as AppSettings);
      }
    });
    return () => unsub();
  }, [form, updateSettings]);

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Comic Library Folder'
      });
      
      if (selected && typeof selected === 'string') {
        await indexPathService.addIndexPath(selected, '{artist}/{series}/{issue}');
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
    } catch (error) {
      console.error('Failed to remove path:', error);
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
            <button
              onClick={() => form.handleSubmit()}
              disabled={saveStatus === 'saving'}
              className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                saveStatus === 'saved' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              } disabled:opacity-50 min-w-[140px] justify-center`}
            >
              {saveStatus === 'saving' ? (
                <RxSymbol className="animate-spin" />
              ) : saveStatus === 'saved' ? (
                <RxCheck />
              ) : null}
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save Changes'}
            </button>
          </div>
        </header>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-12"
        >
          {/* General Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-blue-400">
              <RxDesktop size={20} />
              <h2 className="text-xl font-semibold">General</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-900/50 p-6 rounded-xl border border-slate-800">
              <form.Field name="theme">
                {(field) => (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-300">Theme</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'light', icon: RxSun, label: 'Light' },
                        { value: 'dark', icon: RxMoon, label: 'Dark' },
                        { value: 'system', icon: RxDesktop, label: 'System' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.handleChange(opt.value as any)}
                          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                            field.state.value === opt.value
                              ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <opt.icon />
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </form.Field>

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
                        min="50"
                        max="300"
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
                      <div className="flex-1 min-w-[200px] ml-auto">
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

          {/* Indexing Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-green-400">
              <RxArchive size={20} />
              <h2 className="text-xl font-semibold">Library & Indexing</h2>
            </div>
            
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-slate-200">Index Paths</h3>
                  <p className="text-xs text-slate-500">Directories scanned for comics.</p>
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
                        <div className="text-[10px] text-slate-500 font-mono">{path.pattern}</div>
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
                      <span>{progress.current} / {progress.total}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-green-500 h-full transition-all duration-300"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
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
