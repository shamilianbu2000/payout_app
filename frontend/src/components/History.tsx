import { useState } from 'react';
import { useStore } from '../store';
import { money } from '../format';

export function History() {
  const { runs, download } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = runs.find((r) => r.id === openId);
  return (
    <>
      <table>
        <thead><tr><th>Month</th><th>Version</th><th>Calculated at</th><th>By</th><th className="num">Gross</th><th className="num">Payout</th><th /></tr></thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.id}>
              <td>{r.month}</td><td>v{r.version}</td><td>{new Date(r.createdAt).toLocaleString()}</td><td>{r.createdBy}</td>
              <td className="num">{money(r.totalGross)}</td><td className="num">{money(r.totalPayout)}</td>
              <td><button onClick={() => setOpenId(r.id === openId ? null : r.id)}>{r.id === openId ? 'Close' : 'Open'}</button></td>
            </tr>
          ))}
          {!runs.length && <tr><td colSpan={7} className="muted">No payout runs yet. Calculate a month in the Payouts tab.</td></tr>}
        </tbody>
      </table>
      {open && (
        <section className="card">
          <div className="card-head">
            <strong>{open.month} - version {open.version}</strong>
            <span className="spacer" />
            <button onClick={() => download(`/payouts/export?runId=${open.id}`, `payouts-${open.month}-v${open.version}.xlsx`)}>Export Excel</button>
          </div>
          <table>
            <thead><tr><th>Doctor</th><th>Template</th><th className="num">Gross</th><th className="num">Payout</th><th /></tr></thead>
            <tbody>
              {open.results.map((p) => (
                <tr key={p.doctorId}>
                  <td>{p.doctorName}</td><td>{p.templateName}</td><td className="num">{money(p.gross)}</td><td className="num">{money(p.payout)}</td>
                  <td><button onClick={() => download(`/payouts/statement?doctorId=${p.doctorId}&runId=${open.id}`, `statement-${p.doctorId}-${open.month}.pdf`)}>PDF statement</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
