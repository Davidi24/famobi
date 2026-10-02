import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { DailyStats } from '../api/types';
import { formatDay } from '../utils/format';
import { OUTCOMES } from '../utils/outcomes';
import { ChartTooltip } from './ChartTooltip';
import { OutcomeLegend } from './OutcomeLegend';

export const DailyActivity = ({ daily }: { daily: DailyStats[] }) => (
  <section className="card">
    <header className="card-header">
      <div>
        <h2>Runs per day</h2>
        <p>How much the game gets played, split by how each run ended.</p>
      </div>
      <OutcomeLegend />
    </header>
    <div className="chart">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={daily} margin={{ top: 8, right: 8, bottom: 8, left: 0 }} barCategoryGap="18%">
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDay}
            tickLine={false}
            axisLine={{ stroke: 'var(--axis)' }}
            minTickGap={16}
            tick={{ className: 'tick-muted' }}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} tick={{ className: 'tick-muted' }} />
          <Tooltip cursor={{ fill: 'var(--hover)' }} content={<ChartTooltip title={formatDay} />} />
          {OUTCOMES.map((outcome, index) => (
            <Bar
              key={outcome.key}
              dataKey={outcome.key}
              name={outcome.label}
              stackId="outcomes"
              fill={outcome.color}
              stroke="var(--surface)"
              strokeWidth={1}
              radius={index === OUTCOMES.length - 1 ? [3, 3, 0, 0] : 0}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  </section>
);
