import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { GlobalIndexingProgress, reindexAll } from '../services/reindex-service';

type IndexingContextType = {
  isIndexing: boolean;
  progress: GlobalIndexingProgress | null;
  startIndexing: () => Promise<void>;
  lastIndexedAt: string | null;
};

const IndexingContext = createContext<IndexingContextType | undefined>(undefined);

export const IndexingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isIndexing, setIsIndexing] = useState(false);
  const [progress, setProgress] = useState<GlobalIndexingProgress | null>(null);
  const [lastIndexedAt, setLastIndexedAt] = useState<string | null>(null);
  const hasTriggeredInitial = useRef(false);

  const startIndexing = useCallback(async () => {
    if (isIndexing) return;
    
    setIsIndexing(true);
    setProgress(null);
    try {
      await reindexAll((p) => {
        setProgress(p);
      });
      setLastIndexedAt(new Date().toISOString());
    } catch (error) {
      console.error('Indexing failed:', error);
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
    <IndexingContext.Provider value={{ isIndexing, progress, startIndexing, lastIndexedAt }}>
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
