import { useRef } from 'react';
import { useStore } from '../store';
import { money } from '../format';

export function Uploads() {
  const { uploads, collections, lastUpload, upload, role } = useStore();
  const ref = useRef<HTMLInputElement>(null);
  const onFile = async (f?: File) => {
    if (!f) return;
    await upload(f);
    if (ref.current) ref.current.value = '';
  };
  return (
    <>
      <div className="toolbar">
        <input ref={ref} type="file" accept=".csv,text/csv" disabled={role !== 'admin'} onChange={(e) => onFile(e.target.files?.[0])} />
        <span className="muted">Columns: doctor_id, date (YYYY-MM-DD), amount, reference</span>
      </div>

      {lastUpload && (
        <section className="card">
          <h3>Latest upload: {lastUpload.filename}</h3>
          <p>{lastUpload.acceptedRows} accepted, {lastUpload.rejectedRows} rejected of {lastUpload.totalRows} rows.</p>
          {lastUpload.errors.length > 0 && (
            <table>
              <thead><tr><th>Row</th><th>Field</th><th>Problem</th></tr></thead>
              <tbody>{lastUpload.errors.map((e, i) => <tr key={i} className="bad"><td>{e.row}</td><td>{e.field}</td><td>{e.message}</td></tr>)}</tbody>
            </table>
          )}
        </section>
      )}

      <h3>Upload history</h3>
      <table>
        <thead><tr><th>File</th><th>When</th><th>Rows</th><th>Accepted</th><th>Rejected</th></tr></thead>
        <tbody>
          {uploads.map((u) => (
            <tr key={u.id}><td>{u.filename}</td><td>{new Date(u.uploadedAt).toLocaleString()}</td><td>{u.totalRows}</td><td>{u.acceptedRows}</td><td>{u.rejectedRows}</td></tr>
          ))}
          {!uploads.length && <tr><td colSpan={5} className="muted">No uploads yet</td></tr>}
        </tbody>
      </table>

      <h3>Collections ({collections.length})</h3>
      <table>
        <thead><tr><th>Doctor</th><th>Date</th><th>Reference</th><th className="num">Amount</th></tr></thead>
        <tbody>
          {collections.map((c) => (
            <tr key={c.id}><td>{c.doctorId}</td><td>{c.date}</td><td>{c.reference}</td><td className="num">{money(c.amount)}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
