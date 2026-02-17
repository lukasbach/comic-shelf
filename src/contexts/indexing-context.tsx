import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { GlobalIndexingProgress, IndexingError, reindexAll } from '../services/indexing-service';
import { useSettings } from './settings-context';

type IndexingContextType = {
  isIndexing: boolean;
  progress: GlobalIndexingProgress | null;
  startIndexing: (mode?: 'quick' | 'full') => Promise<void>;
  lastIndexedAt: string | null;
  errors: IndexingError[];
  clearErrors: () => void;
};

const IndexingContext = createContext<IndexingContextType | undefined>(undefined);

export const IndexingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, updateSettings, isLoading: settingsLoading } = useSettings();
  const [isIndexing, setIsIndexing] = useState(false);
  const [progress, setProgress] = useState<GlobalIndexingProgress | null>(null);
  const [errors, setErrors] = useState<IndexingError[]>([]);
  const hasTriggeredInitial = useRef(false);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const startIndexing = useCallback(async (mode: 'quick' | 'full' = 'quick') => {
    if (isIndexing) return;
    
    setIsIndexing(true);
    setProgress(null);
    setErrors([]); // Clear old errors when starting new indexing
    try {
      await reindexAll(mode, (p) => {
        setProgress(p);
        if (p.errors && p.errors.length > 0) {
            setErrors(p.errors);
        }
      });
      await updateSettings({ lastIndexedAt: new Date().toISOString() });
    } catch (error) {
      console.error('Indexing failed:', error);
      setErrors(prev => [...prev, { path: 'Global', message: error instanceof Error ? error.message : String(error) }]);
    } finally {
      setIsIndexing(false);
      setProgress(null);
    }
  }, [isIndexing, updateSettings]);

  // Initial indexing trigger
  useEffect(() => {
    if (!settingsLoading && !hasTriggeredInitial.current) {
        hasTriggeredInitial.current = true;
        if (settings.autoReindex) {
          startIndexing();
        }
    }
  }, [startIndexing, settingsLoading, settings.autoReindex]);

  return (
    <IndexingContext.Provider value={{ isIndexing, progress, startIndexing, lastIndexedAt: settings.lastIndexedAt, errors, clearErrors }}>
      {children}
    </IndexingContext.Provider>
  );
};

export const useIndexing = () => {
  const context = useContext(IndexingContext);
  if (context === undefined) {
    throw new Error('useIndexing must be used within an IndexingProvider');
  }
  return context;
};
