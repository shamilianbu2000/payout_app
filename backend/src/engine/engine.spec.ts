import { FeeEngine } from './engine';
import { PayoutTemplate } from '../types';

const slabs: PayoutTemplate = {
  id: 't', name: 'Tiered', type: 'slabs',
  slabs: [
    { from: 0, to: 50000, rate: 40 },
    { from: 50000, to: 100000, rate: 50 },
    { from: 100000, to: null, rate: 60 },
  ],
};
const engine = new FeeEngine();
const pay = (g: number, t = slabs) => engine.calculate(g, t).payout;

describe('FeeEngine', () => {
  describe('marginal slabs', () => {
    it('zero gross pays nothing', () => expect(pay(0)).toBe(0));
    it('inside first slab', () => expect(pay(30000)).toBe(12000));
    it('exactly at first boundary', () => expect(pay(50000)).toBe(20000));
    it('one rupee over first boundary uses 50% only on the excess', () => expect(pay(50001)).toBe(20000.5));
    it('inside second slab', () => expect(pay(75000)).toBe(32500));
    it('exactly at second boundary', () => expect(pay(100000)).toBe(45000));
    it('one over second boundary', () => expect(pay(100001)).toBe(45000.6));
    it('open-ended top slab', () => expect(pay(150000)).toBe(75000));
    it('returns per-slab lines and omits empty slabs', () => {
      const r = engine.calculate(60000, slabs);
      expect(r.lines.map((l) => [l.base, l.amount])).toEqual([[50000, 20000], [10000, 5000]]);
    });
    it('handles unsorted slabs', () => {
      const t = { ...slabs, slabs: [...slabs.slabs!].reverse() };
      expect(pay(120000, t)).toBe(57000);
    });
  });

  describe('flat', () => {
    const t: PayoutTemplate = { id: 'f', name: 'Flat', type: 'flat', percent: 45 };
    it('applies percent to whole amount', () => expect(pay(80000, t)).toBe(36000));
    it('rounds to 2dp', () => expect(pay(0.07, { ...t, percent: 33 })).toBe(0.02));
  });

  describe('fixed', () => {
    const t: PayoutTemplate = { id: 'x', name: 'Fixed', type: 'fixed', fixedAmount: 25000 };
    it('pays fixed amount regardless of gross', () => {
      expect(pay(0, t)).toBe(25000);
      expect(pay(999999, t)).toBe(25000);
    });
  });

  it('throws for unknown strategy', () => {
    expect(() => engine.calculate(1, { id: 'z', name: 'z', type: 'bogus' as never })).toThrow();
  });
});
