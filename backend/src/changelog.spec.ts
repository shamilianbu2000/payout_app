import { TemplateChangeLog, diffTemplate } from './changelog';
import { SEED_TEMPLATES } from './data';
import { PayoutTemplate } from './types';

const tier = SEED_TEMPLATES.find((t) => t.id === 'T-TIER')!;
const flat = SEED_TEMPLATES.find((t) => t.id === 'T-FLAT45')!;

describe('template change log', () => {
  it('records who/when/what for create and update, newest first', () => {
    const log = new TemplateChangeLog();
    const a: PayoutTemplate = { id: 'T1', name: 'Flat 50', type: 'flat', percent: 50 };
    log.record(undefined, a, 'admin');
    log.record(a, { ...a, name: 'Flat 55', percent: 55 }, 'admin');
    const l = log.list();
    expect(l).toHaveLength(2);
    expect(l[0].action).toBe('updated');
    expect(l[0].by).toBe('admin');
    expect(l[0].changes).toEqual(['name: "Flat 50" -> "Flat 55"', 'percent: 50 -> 55']);
    expect(l[1].action).toBe('created');
    expect(Date.parse(l[0].at)).not.toBeNaN();
  });

  it('diffs slabs and type changes, and an identical template has no diff', () => {
    const d = diffTemplate(tier, { ...flat, id: tier.id, name: tier.name });
    expect(d).toContain('type: slabs -> flat');
    expect(d.some((x) => x.startsWith('slabs:'))).toBe(true);
    expect(diffTemplate(tier, tier)).toEqual([]);
    expect(diffTemplate(tier, { ...tier, slabs: tier.slabs!.map((s, i) => (i === 0 ? { ...s, rate: 41 } : s)) })[0]).toContain('0-50000@41%');
  });

  it('notes no-op saves', () => {
    const log = new TemplateChangeLog();
    expect(log.record(flat, flat, 'admin').changes).toEqual(['no changes']);
  });
});
