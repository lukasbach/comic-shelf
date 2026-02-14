import { useState, useEffect } from 'react';
import * as indexPathService from '../services/index-path-service';
import type { IndexPath } from '../types/comic';

export const useIndexPaths = () => {
  const [indexPaths, setIndexPaths] = useState<IndexPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    indexPathService.getAllIndexPaths().then(setIndexPaths).finally(() => setLoading(false));
  }, []);

  return { indexPaths, loading };
};
