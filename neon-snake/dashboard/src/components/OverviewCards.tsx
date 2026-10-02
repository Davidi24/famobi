import type { Stats } from '../api/types';
import { formatDuration, formatNumber, formatPercent } from '../utils/format';

type Card = { label: string; value: string; detail: string };

export const OverviewCards = ({ overview }: { overview: Stats['overview'] }) => {
  const ended = overview.completed + overview.failed + overview.quit;
  const cards: Card[] = [
    {
      label: 'Runs',
      value: formatNumber(overview.runs),
      detail:
        overview.unfinished > 0 ? `${formatNumber(overview.unfinished)} without an end event` : 'All runs have an end event'
    },
    { label: 'Sessions', value: formatNumber(overview.sessions), detail: 'Page loads with at least one run' },
    {
      label: 'Completion rate',
      value: formatPercent(overview.completionRate),
      detail: `${formatNumber(overview.completed)} of ${formatNumber(ended)} finished runs`
    },
    {
      label: 'Quit rate',
      value: formatPercent(ended === 0 ? null : overview.quit / ended),
      detail: `${formatNumber(overview.quit)} runs left early`
    },
    { label: 'Average score', value: formatNumber(overview.avgScore), detail: `Best score ${formatNumber(overview.bestScore)}` },
    { label: 'Average run length', value: formatDuration(overview.avgDurationMs), detail: 'From start to end of a run' }
  ];

  return (
    <section className="overview" aria-label="Overview">
      {cards.map((card) => (
        <div className="stat" key={card.label}>
          <div className="stat-label">{card.label}</div>
          <div className="stat-value">{card.value}</div>
          <div className="stat-detail">{card.detail}</div>
        </div>
      ))}
    </section>
  );
};
