import { PayoutTemplate, Slab, TemplateChange } from './types';

const slabText = (s: Slab[] = []) => s.map((x) => `${x.from}-${x.to ?? 'open'}@${x.rate}%`).join(', ');

/** Human-readable list of differences between two templates (before = undefined for a new template). */
export function diffTemplate(before: PayoutTemplate | undefined, after: PayoutTemplate): string[] {
  if (!before) {
    const rule = after.type === 'flat' ? `${after.percent}%` : after.type === 'fixed' ? `${after.fixedAmount}` : slabText(after.slabs);
    return [`created as ${after.type} (${rule})`];
  }
  const out: string[] = [];
  if (before.name !== after.name) out.push(`name: "${before.name}" -> "${after.name}"`);
  if (before.type !== after.type) out.push(`type: ${before.type} -> ${after.type}`);
  if (before.percent !== after.percent) out.push(`percent: ${before.percent ?? '-'} -> ${after.percent ?? '-'}`);
  if (before.fixedAmount !== after.fixedAmount) out.push(`fixedAmount: ${before.fixedAmount ?? '-'} -> ${after.fixedAmount ?? '-'}`);
  if (slabText(before.slabs) !== slabText(after.slabs)) out.push(`slabs: [${slabText(before.slabs) || '-'}] -> [${slabText(after.slabs) || '-'}]`);
  return out;
}

export class TemplateChangeLog {
  private entries: TemplateChange[] = [];
  private seq = 0;

  record(before: PayoutTemplate | undefined, after: PayoutTemplate, by: string): TemplateChange {
    const entry: TemplateChange = {
      id: `L-${this.seq++}`, templateId: after.id, templateName: after.name,
      action: before ? 'updated' : 'created', at: new Date().toISOString(), by,
      changes: diffTemplate(before, after),
    };
    if (before && !entry.changes.length) entry.changes = ['no changes'];
    this.entries.push(entry);
    return entry;
  }

  /** Newest first. */
  list(): TemplateChange[] {
    return [...this.entries].reverse();
  }
}
