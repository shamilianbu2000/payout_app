export type TemplateType = 'flat' | 'slabs' | 'fixed';

export interface Slab {
  from: number;
  to: number | null; // null = open-ended
  rate: number; // percent, e.g. 40
}

export interface PayoutTemplate {
  id: string;
  name: string;
  type: TemplateType;
  percent?: number;
  slabs?: Slab[];
  fixedAmount?: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  templateId: string;
}

export interface Collection {
  id: string;
  uploadId: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  reference: string;
}

export interface RowError {
  row: number; // 1-based data row (header excluded)
  field: string;
  message: string;
}

export interface UploadRecord {
  id: string;
  filename: string;
  uploadedAt: string;
  totalRows: number;
  acceptedRows: number;
  rejectedRows: number;
  errors: RowError[];
}

export interface PayoutLine {
  label: string;
  base: number;
  rate?: number;
  amount: number;
}

export interface PayoutResult {
  doctorId: string;
  doctorName: string;
  templateId: string;
  templateName: string;
  month: string;
  gross: number;
  lines: PayoutLine[];
  payout: number;
}

export interface PayoutRun {
  id: string;
  month: string;
  version: number; // 1, 2, ... per month; recalculating creates a new version
  createdAt: string;
  createdBy: string;
  totalGross: number;
  totalPayout: number;
  results: PayoutResult[];
}

export interface TemplateChange {
  id: string;
  templateId: string;
  templateName: string;
  action: 'created' | 'updated';
  at: string;
  by: string;
  changes: string[]; // human-readable, e.g. "percent: 45 -> 50"
}

export interface MonthSummary {
  month: string;
  version: number;
  runId: string;
  doctors: { doctorId: string; doctorName: string; gross: number; payout: number }[];
}
