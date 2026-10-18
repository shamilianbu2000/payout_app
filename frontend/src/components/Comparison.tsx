import { useStore } from '../store';
import { money } from '../format';

/** Month-over-month grouped bars (gross vs payout) per doctor. Plain SVG, no chart library. */
export function Comparison() {
  const comparison = useStore((s) => s.comparison);
  if (!comparison.length) return null;

  const doctors = [...new Map(comparison.flatMap((m) => m.doctors).map((d) => [d.doctorId, d.doctorName])).entries()];
  const max = Math.max(1, ...comparison.flatMap((m) => m.doctors.flatMap((d) => [d.gross, d.payout])));
  const H = 160, bw = 16, groupW = comparison.length * (bw * 2 + 8) + 16, W = doctors.length * groupW + 20;
  const y = (v: number) => (v / max) * H;

  return (
    <section className="card">
      <div className="card-head">
        <strong>Month-over-month comparison</strong>
        <span className="spacer" />
        <span className="legend"><i className="sw gross" /> Gross <i className="sw payout" /> Payout</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 50}`} role="img" aria-label="Gross versus payout per doctor by month" className="chart">
        <line x1="10" x2={W - 10} y1={H + 10} y2={H + 10} stroke="#c4ccd8" />
        {doctors.map(([id, name], di) => (
          <g key={id} transform={`translate(${10 + di * groupW}, 10)`}>
            {comparison.map((m, mi) => {
              const d = m.doctors.find((x) => x.doctorId === id);
              if (!d) return null;
              const x = mi * (bw * 2 + 8);
              return (
                <g key={m.month} transform={`translate(${x}, 0)`}>
                  <rect className="bar gross" x={0} y={H - y(d.gross)} width={bw} height={y(d.gross)}><title>{`${name} ${m.month} gross ${money(d.gross)}`}</title></rect>
                  <rect className="bar payout" x={bw} y={H - y(d.payout)} width={bw} height={y(d.payout)}><title>{`${name} ${m.month} payout ${money(d.payout)}`}</title></rect>
                  <text x={bw} y={H + 22} textAnchor="middle" fontSize="8" fill="#6b7686">{m.month.slice(2)}</text>
                </g>
              );
            })}
            <text x={(comparison.length * (bw * 2 + 8)) / 2} y={H + 38} textAnchor="middle" fontSize="10">{name.replace('Dr. ', '')}</text>
          </g>
        ))}
      </svg>
      <table>
        <thead><tr><th>Doctor</th>{comparison.map((m) => <th key={m.month} className="num">{m.month} (v{m.version}) gross / payout</th>)}</tr></thead>
        <tbody>
          {doctors.map(([id, name]) => (
            <tr key={id}>
              <td>{name}</td>
              {comparison.map((m) => {
                const d = m.doctors.find((x) => x.doctorId === id);
                return <td key={m.month} className="num">{d ? `${money(d.gross)} / ${money(d.payout)}` : '-'}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
