const numberFormat = new Intl.NumberFormat('en-US');

export const formatNumber = (value: number | null): string => (value === null ? '–' : numberFormat.format(value));

export const formatPercent = (value: number | null): string =>
  value === null ? '–' : `${Math.round(value * 100)}%`;

export const formatDuration = (ms: number | null): string => {
  if (ms === null) return '–';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${String(seconds).padStart(2, '0')}s` : `${seconds}s`;
};

export const formatDay = (isoDate: string): string =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
