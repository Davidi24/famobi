import { useState } from 'react';

import { DailyActivity } from './components/DailyActivity';
import { LevelTable } from './components/LevelTable';
import { OutcomesByLevel } from './components/OutcomesByLevel';
import { OverviewCards } from './components/OverviewCards';
import { StatusMessage } from './components/StatusMessage';
import { useStats } from './hooks/useStats';

const RANGES = [7, 14, 30];

export const App = () => {
  const [days, setDays] = useState(14);
  const { data, error, loading, reload } = useStats(days);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Neon Snake Analytics</h1>
          <p className="subtitle">Gameplay activity from the last {days} days</p>
        </div>
        <div className="controls">
          <div className="segmented" role="group" aria-label="Time range">
            {RANGES.map((range) => (
              <button
                key={range}
                type="button"
                aria-pressed={range === days}
                className={range === days ? 'active' : undefined}
                onClick={() => setDays(range)}
              >
                {range} days
              </button>
            ))}
          </div>
          <button type="button" className="button" onClick={reload} disabled={loading}>
            Refresh
          </button>
        </div>
      </header>

      {error && !data && (
        <StatusMessage
          title="Couldn't load the analytics"
          message={`${error}. Check that the backend is running on port 3000.`}
          action={{ label: 'Try again', onClick: reload }}
        />
      )}

      {error && data && <div className="banner">Refresh failed: {error}. Showing the last loaded data.</div>}

      {!data && loading && <StatusMessage title="Loading…" message="Fetching gameplay stats from the backend." />}

      {data && data.overview.runs === 0 && (
        <StatusMessage
          title="No gameplay yet"
          message="Play a few runs of the game, or run pnpm seed in the server folder to load demo data."
          action={{ label: 'Refresh', onClick: reload }}
        />
      )}

      {data && data.overview.runs > 0 && (
        <main className={loading ? 'content refreshing' : 'content'} aria-busy={loading}>
          <OverviewCards overview={data.overview} />
          <div className="charts">
            <OutcomesByLevel levels={data.levels} />
            <DailyActivity daily={data.daily} />
          </div>
          <LevelTable levels={data.levels} />
        </main>
      )}
    </div>
  );
};
