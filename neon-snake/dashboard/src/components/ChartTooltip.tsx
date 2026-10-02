import type { TooltipContentProps } from 'recharts';

import { formatNumber } from '../utils/format';
import { OUTCOMES } from '../utils/outcomes';

type Props = Partial<TooltipContentProps<number, string>> & { title: (label: string) => string };

export const ChartTooltip = ({ active, payload, label, title }: Props) => {
  if (!active || !payload?.length) return null;
  const values = payload[0].payload as Record<string, number>;
  const total = OUTCOMES.reduce((sum, outcome) => sum + (values[outcome.key] ?? 0), 0);

  return (
    <div className="tooltip">
      <div className="tooltip-title">{title(String(label))}</div>
      {OUTCOMES.map((outcome) => (
        <div className="tooltip-row" key={outcome.key}>
          <span className="tooltip-key" style={{ background: outcome.color }} />
          <strong>{formatNumber(values[outcome.key] ?? 0)}</strong>
          <span>{outcome.label}</span>
        </div>
      ))}
      <div className="tooltip-total">
        <strong>{formatNumber(total)}</strong> runs
      </div>
    </div>
  );
};
