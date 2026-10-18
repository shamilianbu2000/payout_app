export type TemplateType = 'flat' | 'slabs' | 'fixed';
export interface Slab { from: number; to: number | null; rate: number }
export interface Template { id: string; name: string; type: TemplateType; percent?: number; slabs?: Slab[]; fixedAmount?: number }
export interface Doctor { id: string; name: string; specialty: string; templateId: string }
export interface RowError { row: number; field: string; message: string }
export interface Upload { id: string; filename: string; uploadedAt: string; totalRows: number; acceptedRows: number; rejectedRows: number; errors: RowError[] }
export interface Collection { id: string; uploadId: string; doctorId: string; date: string; amount: number; reference: string }
export interface PayoutLine { label: string; base: number; rate?: number; amount: number }
export interface Payout { doctorId: string; doctorName: string; templateName: string; month: string; gross: number; lines: PayoutLine[]; payout: number }
export type Role = 'admin' | 'viewer';
export interface PayoutRun { id: string; month: string; version: number; createdAt: string; createdBy: string; totalGross: number; totalPayout: number; results: Payout[] }
export interface TemplateChange { id: string; templateId: string; templateName: string; action: 'created' | 'updated'; at: string; by: string; changes: string[] }
export interface MonthSummary { month: string; version: number; runId: string; doctors: { doctorId: string; doctorName: string; gross: number; payout: number }[] }
