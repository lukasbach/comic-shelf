import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { GlobalIndexingProgress, IndexingError, reindexAll } from '../services/indexing-service';

type IndexingContextType = {
  isIndexing: boolean;
  progress: GlobalIndexingProgress | null;
  startIndexing: () => Promise<void>;
  lastIndexedAt: string | null;
  errors: IndexingError[];
  clearErrors: () => void;
};

const IndexingContext = createContext<IndexingContextType | undefined>(undefined);

export const IndexingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isIndexing, setIsIndexing] = useState(false);
  const [progress, setProgress] = useState<GlobalIndexingProgress | null>(null);
  const [lastIndexedAt, setLastIndexedAt] = useState<string | null>(null);
  const [errors, setErrors] = useState<IndexingError[]>([]);
  const hasTriggeredInitial = useRef(false);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const startIndexing = useCallback(async () => {
    if (isIndexing) return;
    
    setIsIndexing(true);
    setProgress(null);
    setErrors([]); // Clear old errors when starting new indexing
    try {
      await reindexAll((p) => {
        setProgress(p);
        if (p.errors && p.errors.length > 0) {
            setErrors(p.errors);
        }
      });
      setLastIndexedAt(new Date().toISOString());
    } catch (error) {
      console.error('Indexing failed:', error);
      setErrors(prev => [...prev, { path: 'Global', message: error instanceof Error ? error.message : String(error) }]);
    } finally {
      setIsIndexing(false);
      setProgress(null);
    }
  }, [isIndexing]);

  // Initial indexing trigger
  useEffect(() => {
    if (!hasTriggeredInitial.current) {
        hasTriggeredInitial.current = true;
        startIndexing();
    }
  }, [startIndexing]);

  return (
    <IndexingContext.Provider value={{ isIndexing, progress, startIndexing, lastIndexedAt, errors, clearErrors }}>
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
