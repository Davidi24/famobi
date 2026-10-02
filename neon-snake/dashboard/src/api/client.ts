import type { Stats } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const fetchStats = async (days: number, signal?: AbortSignal): Promise<Stats> => {
  const response = await fetch(`${API_URL}/api/stats?days=${days}`, { signal });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed with status ${response.status}`);
  }
  return response.json();
};
