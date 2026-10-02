export type Outcome = 'completed' | 'failed' | 'quit';

export type Summary = {
  runs: number;
  completed: number;
  failed: number;
  quit: number;
  unfinished: number;
  completionRate: number | null;
  avgScore: number | null;
  bestScore: number | null;
  avgDurationMs: number | null;
};

export type LevelStats = Summary & { level: number };

export type DailyStats = {
  date: string;
  runs: number;
  completed: number;
  failed: number;
  quit: number;
  unfinished: number;
};

export type Stats = {
  range: { days: number; from: string; to: string };
  overview: Summary & { sessions: number };
  levels: LevelStats[];
  daily: DailyStats[];
};
