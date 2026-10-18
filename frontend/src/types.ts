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
