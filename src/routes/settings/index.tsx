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
    defaultValues: settings as AppSettings,
    onSubmit: async ({ value }) => {
      setSaveStatus('saving');
      await updateSettings(value);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    listeners: {
      onChangeDebounceMs: 1000,
      onChange: ({ formApi }) => {
        if (formApi.state.isDirty) {
          updateSettings(formApi.state.values as AppSettings);
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
      // Trigger indexing to clean up stale entries
      startIndexing();
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
      <div className="flex items-center justify-center h-full bg-white dark:bg-gray-900">
        <RxSymbol className="animate-spin text-gray-500" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto w-full p-8 pb-24 space-y-12">
        <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Settings</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Configure your reading experience and library.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => form.handleSubmit()}
              disabled={saveStatus === 'saving'}
              className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                saveStatus === 'saved' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
              } disabled:opacity-50 min-w-35 justify-center cursor-pointer`}
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
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <RxDesktop size={20} />
              <h2 className="text-xl font-semibold">General</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <form.Field name="theme">
                {(field) => (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
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
                              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 cursor-pointer'
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
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Default View Mode</label>
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
                              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 cursor-pointer'
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
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Default Fit Mode</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'width', label: 'Fit Width' },
                        { value: 'none', label: 'None (Zoom)' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.handleChange(opt.value as any)}
                          className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all ${
                            field.state.value === opt.value
                              ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 cursor-pointer'
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
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Default Zoom Level</label>
                      <span className="text-blue-600 dark:text-blue-400 font-mono font-bold">{field.state.value}%</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="10"
                        max="500"
                        step="10"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(Number(e.target.value))}
                        className="flex-1 accent-blue-500 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </form.Field>
            </div>
          </section>

          {/* Slideshow Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <RxTimer size={20} />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Slideshow</h2>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 space-y-8">
              <form.Field name="slideshowDelay">
                {(field) => (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-advance Delay</label>
                      <span className="text-purple-600 dark:text-purple-400 font-mono font-bold">{(field.state.value / 1000).toFixed(1)}s</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {[3000, 5000, 8000, 10000, 15000].map((ms) => (
                        <button
                          key={ms}
                          type="button"
                          onClick={() => field.handleChange(ms)}
                          className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-all cursor-pointer ${
                            field.state.value === ms
                              ? 'bg-purple-600 border-purple-500 text-white'
                              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
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
                          className="w-full accent-purple-500 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
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
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <RxKeyboard size={20} />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Hotkeys</h2>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <p className="text-[10px] text-gray-500 dark:text-gray-400 italic">Hotkeys are automatically disabled when typing in input fields.</p>
          </section>

          {/* Indexing Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <RxArchive size={20} />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Library & Indexing</h2>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                <form.Field name="autoReindex">
                  {(field) => (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={field.state.value}
                        onClick={() => field.handleChange(!field.state.value)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white ${
                          field.state.value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            field.state.value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Auto-reindex on startup</span>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Scan for new comics when the application opens.</p>
                      </div>
                    </div>
                  )}
                </form.Field>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Index Paths</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Directories scanned for comics.</p>
                </div>
                <button
                  type="button"
                  onClick={handleSelectFolder}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                >
                  <RxPlus /> Add Path
                </button>
              </div>

              <div className="space-y-2">
                {indexPaths.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-gray-400 dark:text-gray-600">
                    <RxArchive size={32} className="mb-2 opacity-50" />
                    <p className="text-sm">No index paths configured.</p>
                  </div>
                ) : (
                  indexPaths.map((path) => (
                    <div key={path.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="truncate flex-1 mr-4">
                        <div className="text-sm text-gray-700 dark:text-gray-200 truncate">{path.path}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">{path.pattern}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePath(path.id!)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all cursor-pointer"
                      >
                        <RxTrash size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                   {lastIndexedAt ? `Last indexed: ${new Date(lastIndexedAt).toLocaleString()}` : 'Never indexed'}
                </div>
                
                {isIndexing && progress && (
                  <div className="flex-1 max-w-md space-y-1">
                    <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 uppercase">
                      <span>{progress.status === 'scanning' ? 'Scanning...' : 'Indexing...'}</span>
                      <span>{(progress.current ?? 0)} / {(progress.total ?? 0)}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate" title={progress.currentTask || ''}>
                      {progress.currentTask || 'Working...'}
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
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
                  className="flex items-center gap-2 px-4 py-2 bg-green-600/10 hover:bg-green-600/20 border border-green-200 dark:border-green-800 rounded-lg text-sm font-medium text-green-600 dark:text-green-400 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isIndexing ? <RxSymbol className="animate-spin" /> : <RxReload />}
                  {isIndexing ? 'Indexing...' : 'Force Re-index All'}
                </button>
              </div>
            </div>
          </section>
        </form>

        <footer className="pt-12 border-t border-gray-200 dark:border-gray-800 flex gap-4">
           <button
             type="button"
             onClick={() => {
                if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
                  form.reset(DEFAULT_SETTINGS);
                  updateSettings(DEFAULT_SETTINGS);
                }
             }}
             className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
           >
             Reset to Defaults
           </button>
        </footer>
      </div>
    </div>
  );
}
