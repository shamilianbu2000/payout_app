import { PayoutLine, PayoutTemplate } from '../types';

export interface FeeStrategy {
  readonly type: PayoutTemplate['type'];
  calculate(gross: number, t: PayoutTemplate): PayoutLine[];
}

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export const flatStrategy: FeeStrategy = {
  type: 'flat',
  calculate(gross, t) {
    const rate = t.percent ?? 0;
    return [{ label: `Flat ${rate}%`, base: gross, rate, amount: round2((gross * rate) / 100) }];
  },
};

export const fixedStrategy: FeeStrategy = {
  type: 'fixed',
  calculate(gross, t) {
    return [{ label: 'Fixed fee', base: gross, amount: round2(t.fixedAmount ?? 0) }];
  },
};

/** Marginal slabs: each rate applies only to the portion of gross inside its band. */
export const slabStrategy: FeeStrategy = {
  type: 'slabs',
  calculate(gross, t) {
    const slabs = [...(t.slabs ?? [])].sort((a, b) => a.from - b.from);
    const lines: PayoutLine[] = [];
    for (const s of slabs) {
      const upper = s.to === null ? gross : Math.min(gross, s.to);
      const base = Math.max(0, upper - s.from);
      if (base <= 0) continue;
      const label = s.to === null ? `${s.from}+` : `${s.from} - ${s.to}`;
      lines.push({ label, base, rate: s.rate, amount: round2((base * s.rate) / 100) });
    }
    return lines;
  },
};
