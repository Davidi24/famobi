import { OUTCOMES } from '../utils/outcomes';

export const OutcomeLegend = () => (
  <ul className="legend">
    {OUTCOMES.map((outcome) => (
      <li key={outcome.key}>
        <span className="legend-swatch" style={{ background: outcome.color }} />
        {outcome.label}
      </li>
    ))}
  </ul>
);
