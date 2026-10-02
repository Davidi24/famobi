import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { LevelStats } from '../api/types';
import { formatPercent } from '../utils/format';
import { OUTCOMES } from '../utils/outcomes';
import { ChartTooltip } from './ChartTooltip';
import { OutcomeLegend } from './OutcomeLegend';

type TickProps = { x?: number | string; y?: number | string; payload?: { value: number } };

export const OutcomesByLevel = ({ levels }: { levels: LevelStats[] }) => {
  const rateByLevel = new Map(levels.map((level) => [level.level, level.completionRate]));

  const LevelTick = ({ x, y, payload }: TickProps) => (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" dy={14} className="tick-strong">
        Level {payload?.value}
      </text>
      <text textAnchor="middle" dy={32} className="tick-muted">
        {formatPercent(rateByLevel.get(payload?.value ?? 0) ?? null)} completed
      </text>
    </g>
  );

  return (
    <section className="card">
      <header className="card-header">
        <div>
          <h2>Outcomes by level</h2>
          <p>How runs on each level ended. Under each bar is that level's completion rate.</p>
        </div>
        <OutcomeLegend />
      </header>
      <div className="chart">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={levels} margin={{ top: 8, right: 8, bottom: 8, left: 0 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="var(--grid)" />
            <XAxis dataKey="level" tickLine={false} axisLine={{ stroke: 'var(--axis)' }} height={44} tick={<LevelTick />} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} tick={{ className: 'tick-muted' }} />
            <Tooltip cursor={{ fill: 'var(--hover)' }} content={<ChartTooltip title={(label) => `Level ${label}`} />} />
            {OUTCOMES.map((outcome, index) => (
              <Bar
                key={outcome.key}
                dataKey={outcome.key}
                name={outcome.label}
                stackId="outcomes"
                fill={outcome.color}
                stroke="var(--surface)"
                strokeWidth={2}
                radius={index === OUTCOMES.length - 1 ? [4, 4, 0, 0] : 0}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
