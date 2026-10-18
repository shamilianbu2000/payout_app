import { PayoutResult, PayoutRun, MonthSummary } from './types';
import { round2 } from './engine/strategies';

/** In-memory payout run history. Each calculation of a month is a new, immutable version. */
export class PayoutHistory {
  private runs: PayoutRun[] = [];
  private seq = 0;

  record(month: string, results: PayoutResult[], createdBy: string): PayoutRun {
    const version = this.runs.filter((r) => r.month === month).length + 1;
    const run: PayoutRun = {
      id: `R-${month}-v${version}-${(this.seq++).toString(36)}`,
      month, version, createdAt: new Date().toISOString(), createdBy,
      totalGross: round2(results.reduce((s, r) => s + r.gross, 0)),
      totalPayout: round2(results.reduce((s, r) => s + r.payout, 0)),
      results: structuredClone(results),
    };
    this.runs.push(run);
    return run;
  }

  /** Newest first; optionally filtered by month. */
  list(month?: string): PayoutRun[] {
    return this.runs.filter((r) => !month || r.month === month).reverse();
  }

  get(id: string): PayoutRun | undefined {
    return this.runs.find((r) => r.id === id);
  }

  latest(month: string): PayoutRun | undefined {
    return this.list(month)[0];
  }

  /** Latest version of every month that has been calculated, oldest month first. */
  comparison(): MonthSummary[] {
    const months = [...new Set(this.runs.map((r) => r.month))].sort();
    return months.map((m) => {
      const r = this.latest(m)!;
      return {
        month: m, version: r.version, runId: r.id,
        doctors: r.results.map((x) => ({ doctorId: x.doctorId, doctorName: x.doctorName, gross: x.gross, payout: x.payout })),
      };
    });
  }
}
