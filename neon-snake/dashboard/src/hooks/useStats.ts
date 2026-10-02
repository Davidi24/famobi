import { useCallback, useEffect, useState } from 'react';

import { fetchStats } from '../api/client';
import type { Stats } from '../api/types';

type State = { data: Stats | null; error: string | null; loading: boolean };

export const useStats = (days: number) => {
  const [state, setState] = useState<State>({ data: null, error: null, loading: true });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((previous) => ({ ...previous, loading: true, error: null }));

    fetchStats(days, controller.signal)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'Something went wrong';
        setState((previous) => ({ ...previous, error: message, loading: false }));
      });

    return () => controller.abort();
  }, [days, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { ...state, reload };
};
