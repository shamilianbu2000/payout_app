import { PayoutHistory } from './history';
import { PayoutResult } from './types';

const res = (gross: number, payout: number): PayoutResult[] => [
  { doctorId: 'D001', doctorName: 'Dr A', templateId: 'T', templateName: 'T', month: 'x', gross, lines: [], payout },
];

describe('payout history', () => {
  it('increments the version per month when recalculated and keeps old runs', () => {
    const h = new PayoutHistory();
    h.record('2026-01', res(40000, 18000), 'admin');
    h.record('2026-01', res(50000, 22500), 'admin');
    h.record('2026-02', res(10000, 4500), 'admin');
    const jan = h.list('2026-01');
    expect(jan.map((r) => r.version)).toEqual([2, 1]);
    expect(jan[1].totalGross).toBe(40000);
    expect(jan[0].totalPayout).toBe(22500);
    expect(h.list('2026-02')[0].version).toBe(1);
    expect(h.list()).toHaveLength(3);
    expect(h.get(jan[1].id)?.createdBy).toBe('admin');
    expect(new Set(h.list().map((r) => r.id)).size).toBe(3);
  });

  it('stores a snapshot unaffected by later mutation of the input', () => {
    const h = new PayoutHistory();
    const input = res(100, 40);
    const run = h.record('2026-01', input, 'admin');
    input[0].gross = 999;
    expect(h.get(run.id)?.results[0].gross).toBe(100);
  });

  it('comparison uses the latest version of each month, oldest month first', () => {
    const h = new PayoutHistory();
    h.record('2026-02', res(1, 1), 'a');
    h.record('2026-01', res(2, 2), 'a');
    h.record('2026-01', res(3, 3), 'a');
    const c = h.comparison();
    expect(c.map((m) => [m.month, m.version, m.doctors[0].gross])).toEqual([['2026-01', 2, 3], ['2026-02', 1, 1]]);
  });
});
