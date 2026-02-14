import { useState, useEffect, useCallback } from 'react';
import * as indexPathService from '../services/index-path-service';
import type { IndexPath } from '../types/comic';

export const useIndexPaths = () => {
  const [indexPaths, setIndexPaths] = useState<IndexPath[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const paths = await indexPathService.getAllIndexPaths();
      setIndexPaths(paths);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { indexPaths, loading, refresh };
};
