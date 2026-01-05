import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createDatabaseLoader, type PhageRepository, type DatabaseLoadProgress } from '../db';

const DEFAULT_DATABASE_URL = '/phage.db';

export interface UseDatabaseQueryOptions {
  databaseUrl?: string;
  /** When false, the query will not auto-run; call `load()` manually. */
  enabled?: boolean;
}

export interface UseDatabaseQueryResult {
  repository: PhageRepository | null;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  progress: DatabaseLoadProgress | null;
  isCached: boolean;
  /** Trigger initial load when `enabled` is false. */
  load: () => Promise<void>;
  reload: () => Promise<void>;
}

export function useDatabaseQuery(
  options: UseDatabaseQueryOptions = {}
): UseDatabaseQueryResult {
  const { databaseUrl = DEFAULT_DATABASE_URL, enabled = true } = options;
  const [progress, setProgress] = useState<DatabaseLoadProgress | null>(null);
  const [isCached, setIsCached] = useState(false);
  const loaderRef = useRef<ReturnType<typeof createDatabaseLoader> | null>(null);
  const queryClient = useQueryClient();

  const query = useQuery<PhageRepository>({
    queryKey: ['database', databaseUrl],
    queryFn: async () => {
      await loaderRef.current?.close().catch(() => {});
      loaderRef.current = createDatabaseLoader(databaseUrl, (p) => {
        setProgress(p);
        if (p.cached !== undefined) {
          setIsCached(p.cached);
        }
      });
      return loaderRef.current.load();
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    enabled,
  });

  useEffect(() => {
    return () => {
      loaderRef.current?.close().catch(() => {});
      loaderRef.current = null;
    };
  }, [databaseUrl]);

  const load = useCallback(async () => {
    await query.refetch();
  }, [query.refetch]);

  const reload = useCallback(async () => {
    if (loaderRef.current) {
      await loaderRef.current.clearCache();
    }
    await queryClient.invalidateQueries({ queryKey: ['database', databaseUrl] });
    await query.refetch();
  }, [databaseUrl, query.refetch, queryClient]);

  return {
    repository: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
    progress,
    isCached,
    load,
    reload,
  };
}

export default useDatabaseQuery;
