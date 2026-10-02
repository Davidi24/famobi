import type { Outcome } from '../api/types';

export const OUTCOMES: { key: Outcome; label: string; color: string }[] = [
  { key: 'completed', label: 'Completed', color: 'var(--outcome-completed)' },
  { key: 'failed', label: 'Failed', color: 'var(--outcome-failed)' },
  { key: 'quit', label: 'Quit', color: 'var(--outcome-quit)' }
];
