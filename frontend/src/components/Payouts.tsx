import { useStore } from '../store';
import { money } from '../format';

export function Payouts() {
  const { payouts, month, setMonth, calculate, role } = useStore();
  const total = payouts.reduce((s, p) => s + p.payout, 0);
  return (
    <>
      <div className="toolbar">
        <label>Month <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label>
        <button className="primary" disabled={role !== 'admin'} onClick={calculate}>Calculate payouts</button>
      </div>
      {payouts.map((p) => (
        <section className="card" key={p.doctorId}>
          <div className="card-head">
            <strong>{p.doctorName}</strong> <span className="muted">({p.templateName})</span>
            <span className="spacer" />
            Gross {money(p.gross)} &rarr; <strong>Payout {money(p.payout)}</strong>
          </div>
          <table>
            <thead><tr><th>Component</th><th className="num">Base</th><th className="num">Rate</th><th className="num">Amount</th></tr></thead>
            <tbody>
              {p.lines.map((l, i) => (
                <tr key={i}><td>{l.label}</td><td className="num">{money(l.base)}</td><td className="num">{l.rate !== undefined ? `${l.rate}%` : '-'}</td><td className="num">{money(l.amount)}</td></tr>
              ))}
              {!p.lines.length && <tr><td colSpan={4} className="muted">No collections in this month</td></tr>}
            </tbody>
          </table>
        </section>
      ))}
      {payouts.length > 0 && <p className="total">Total payout for {month}: <strong>{money(total)}</strong></p>}
      {!payouts.length && <p className="muted">Upload collections, then calculate payouts for a month.</p>}
    </>
  );
}
