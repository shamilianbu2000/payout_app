import { Collection, Doctor, RowError } from './types';

export interface ParseResult {
  accepted: Omit<Collection, 'id' | 'uploadId'>[];
  errors: RowError[];
  totalRows: number;
  fatal?: string;
}

export const REQUIRED_COLUMNS = ['doctor_id', 'date', 'amount', 'reference'];

function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q;
    } else if (c === ',' && !q) { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const keyOf = (d: string, date: string, ref: string) => `${d}|${date}|${ref}`;

export function parseCollectionsCsv(
  text: string,
  doctors: Doctor[],
  existing: Pick<Collection, 'doctorId' | 'date' | 'reference'>[],
): ParseResult {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return { accepted: [], errors: [], totalRows: 0, fatal: 'File is empty' };
  const header = splitLine(lines[0]).map((h) => h.toLowerCase());
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) {
    return { accepted: [], errors: [], totalRows: 0, fatal: `Missing required column(s): ${missing.join(', ')}` };
  }
  const idx = Object.fromEntries(REQUIRED_COLUMNS.map((c) => [c, header.indexOf(c)]));
  const ids = new Set(doctors.map((d) => d.id));
  const seen = new Set(existing.map((e) => keyOf(e.doctorId, e.date, e.reference)));
  const accepted: ParseResult['accepted'] = [];
  const errors: RowError[] = [];

  lines.slice(1).forEach((line, i) => {
    const row = i + 1;
    const cells = splitLine(line);
    const get = (c: string) => cells[idx[c]] ?? '';
    const before = errors.length;
    const err = (field: string, message: string) => errors.push({ row, field, message });

    const doctorId = get('doctor_id');
    const date = get('date');
    const amountRaw = get('amount');
    const reference = get('reference');

    if (!doctorId) err('doctor_id', 'Required value is empty');
    else if (!ids.has(doctorId)) err('doctor_id', `Unknown doctor ID "${doctorId}"`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date))) err('date', `Invalid date "${date}" (expected YYYY-MM-DD)`);
    const amount = Number(amountRaw);
    if (amountRaw === '') err('amount', 'Required value is empty');
    else if (!Number.isFinite(amount)) err('amount', `Amount "${amountRaw}" is not numeric`);
    else if (amount <= 0) err('amount', 'Amount must be greater than 0');
    if (!reference) err('reference', 'Required value is empty');

    if (errors.length === before) {
      const k = keyOf(doctorId, date, reference);
      if (seen.has(k)) err('reference', `Duplicate collection (${doctorId}, ${date}, ${reference})`);
      else { seen.add(k); accepted.push({ doctorId, date, amount, reference }); }
    }
  });
  return { accepted, errors, totalRows: lines.length - 1 };
}
