import type { LevelStats } from '../api/types';
import { formatDuration, formatNumber, formatPercent } from '../utils/format';

export const LevelTable = ({ levels }: { levels: LevelStats[] }) => (
  <section className="card">
    <header className="card-header">
      <div>
        <h2>Levels in detail</h2>
        <p>The numbers behind the charts.</p>
      </div>
    </header>
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Level</th>
            <th scope="col">Runs</th>
            <th scope="col">Completed</th>
            <th scope="col">Failed</th>
            <th scope="col">Quit</th>
            <th scope="col">Completion rate</th>
            <th scope="col">Avg score</th>
            <th scope="col">Avg run length</th>
          </tr>
        </thead>
        <tbody>
          {levels.map((level) => (
            <tr key={level.level}>
              <th scope="row">Level {level.level}</th>
              <td>{formatNumber(level.runs)}</td>
              <td>{formatNumber(level.completed)}</td>
              <td>{formatNumber(level.failed)}</td>
              <td>{formatNumber(level.quit)}</td>
              <td>{formatPercent(level.completionRate)}</td>
              <td>{formatNumber(level.avgScore)}</td>
              <td>{formatDuration(level.avgDurationMs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);
