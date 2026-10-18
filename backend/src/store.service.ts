import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SEED_DOCTORS, SEED_TEMPLATES } from './data';
import { parseCollectionsCsv } from './csv';
import { FeeEngine } from './engine/engine';
import { PayoutHistory } from './history';
import { TemplateChangeLog } from './changelog';
import { Collection, Doctor, PayoutResult, PayoutRun, PayoutTemplate, UploadRecord } from './types';

let seq = 0;
const nid = (p: string) => `${p}-${Date.now().toString(36)}${(seq++).toString(36)}`;

@Injectable()
export class StoreService {
  private doctors: Doctor[] = structuredClone(SEED_DOCTORS);
  private templates: PayoutTemplate[] = structuredClone(SEED_TEMPLATES);
  private collections: Collection[] = [];
  private uploads: UploadRecord[] = [];
  private payouts = new Map<string, PayoutResult[]>();
  private engine = new FeeEngine();
  readonly history = new PayoutHistory();
  readonly changeLog = new TemplateChangeLog();

  // doctors
  listDoctors = () => this.doctors;
  assignTemplate(doctorId: string, templateId: string): Doctor {
    const d = this.doctors.find((x) => x.id === doctorId);
    if (!d) throw new NotFoundException('Doctor not found');
    this.getTemplate(templateId);
    d.templateId = templateId;
    return d;
  }

  // templates
  listTemplates = () => this.templates;
  getTemplate(id: string): PayoutTemplate {
    const t = this.templates.find((x) => x.id === id);
    if (!t) throw new NotFoundException(`Template ${id} not found`);
    return t;
  }
  createTemplate(body: Partial<PayoutTemplate>, by = 'unknown'): PayoutTemplate {
    const t = this.validateTemplate({ ...body, id: nid('T') });
    this.templates.push(t);
    this.changeLog.record(undefined, t, by);
    return t;
  }
  updateTemplate(id: string, body: Partial<PayoutTemplate>, by = 'unknown'): PayoutTemplate {
    const before = this.getTemplate(id);
    const t = this.validateTemplate({ ...body, id });
    this.templates = this.templates.map((x) => (x.id === id ? t : x));
    this.changeLog.record(before, t, by);
    return t;
  }
  listTemplateChanges = () => this.changeLog.list();

  private validateTemplate(b: Partial<PayoutTemplate>): PayoutTemplate {
    const bad = (m: string) => { throw new BadRequestException(m); };
    if (!b.name?.trim()) bad('name is required');
    const base = { id: b.id!, name: b.name!.trim(), type: b.type! };
    if (b.type === 'flat') {
      if (typeof b.percent !== 'number' || b.percent < 0 || b.percent > 100) bad('percent must be 0-100');
      return { ...base, percent: b.percent };
    }
    if (b.type === 'fixed') {
      if (typeof b.fixedAmount !== 'number' || b.fixedAmount < 0) bad('fixedAmount must be >= 0');
      return { ...base, fixedAmount: b.fixedAmount };
    }
    if (b.type === 'slabs') {
      const s = [...(b.slabs ?? [])].sort((x, y) => x.from - y.from);
      if (!s.length) bad('at least one slab is required');
      s.forEach((x, i) => {
        if (typeof x.from !== 'number' || typeof x.rate !== 'number' || x.rate < 0 || x.rate > 100) bad(`slab ${i + 1}: invalid from/rate`);
        if (x.to !== null && (typeof x.to !== 'number' || x.to <= x.from)) bad(`slab ${i + 1}: "to" must be greater than "from"`);
        if (i > 0 && s[i - 1].to !== x.from) bad(`slab ${i + 1}: must start where the previous slab ends`);
        if (x.to === null && i !== s.length - 1) bad('only the last slab can be open-ended');
      });
      if (s[0].from !== 0) bad('first slab must start at 0');
      return { ...base, slabs: s };
    }
    return bad('type must be flat, slabs or fixed');
  }

  // uploads & collections
  ingestCsv(filename: string, text: string): UploadRecord {
    const r = parseCollectionsCsv(text, this.doctors, this.collections);
    if (r.fatal) throw new BadRequestException({ message: r.fatal, errors: [] });
    const id = nid('U');
    this.collections.push(...r.accepted.map((c) => ({ ...c, id: nid('C'), uploadId: id })));
    const rec: UploadRecord = {
      id, filename, uploadedAt: new Date().toISOString(), totalRows: r.totalRows,
      acceptedRows: r.accepted.length, rejectedRows: r.totalRows - r.accepted.length, errors: r.errors,
    };
    this.uploads.unshift(rec);
    return rec;
  }
  listUploads = () => this.uploads;
  listCollections = (month?: string) =>
    this.collections.filter((c) => !month || c.date.startsWith(month));

  // payouts
  calculate(month: string, by = 'unknown'): PayoutResult[] {
    if (!/^\d{4}-\d{2}$/.test(month ?? '')) throw new BadRequestException('month must be YYYY-MM');
    const results = this.doctors.map((d): PayoutResult => {
      const gross = this.collections
        .filter((c) => c.doctorId === d.id && c.date.startsWith(month))
        .reduce((s, c) => s + c.amount, 0);
      const t = this.getTemplate(d.templateId);
      const { lines, payout } = this.engine.calculate(gross, t);
      return { doctorId: d.id, doctorName: d.name, templateId: t.id, templateName: t.name, month, gross, lines, payout };
    });
    this.payouts.set(month, results);
    this.history.record(month, results, by);
    return results;
  }
  getPayouts = (month: string) => this.payouts.get(month) ?? [];

  // history & reports
  listRuns = (month?: string) => this.history.list(month);
  getRun(id: string): PayoutRun {
    const r = this.history.get(id);
    if (!r) throw new NotFoundException(`Run ${id} not found`);
    return r;
  }
  /** Run by id, else latest run of the month; 404 if none. */
  resolveRun(month?: string, runId?: string): PayoutRun {
    if (runId) return this.getRun(runId);
    if (!/^\d{4}-\d{2}$/.test(month ?? '')) throw new BadRequestException('month must be YYYY-MM (or pass runId)');
    const r = this.history.latest(month!);
    if (!r) throw new NotFoundException(`No payouts calculated for ${month} yet`);
    return r;
  }
  comparison = () => this.history.comparison();
}
