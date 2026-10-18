import { create } from 'zustand';
import { api, download } from './api';
import type { Collection, Doctor, MonthSummary, Payout, PayoutRun, Role, Template, TemplateChange, Upload } from './types';

interface State {
  role: Role | null;
  doctors: Doctor[];
  templates: Template[];
  uploads: Upload[];
  collections: Collection[];
  payouts: Payout[];
  runs: PayoutRun[];
  comparison: MonthSummary[];
  changes: TemplateChange[];
  month: string;
  lastUpload: Upload | null;
  error: string | null;
  login: (r: Role | null) => void;
  setMonth: (m: string) => void;
  clearError: () => void;
  loadAll: () => Promise<void>;
  saveTemplate: (t: Partial<Template>) => Promise<void>;
  assign: (doctorId: string, templateId: string) => Promise<void>;
  upload: (f: File) => Promise<void>;
  calculate: () => Promise<void>;
  loadPayouts: () => Promise<void>;
  download: (path: string, fallbackName: string) => Promise<void>;
}

export const useStore = create<State>((set, get) => {
  const call = <T,>(path: string, init?: RequestInit) => api<T>(path, get().role ?? 'viewer', init);
  const guard = async (fn: () => Promise<void>) => {
    try { set({ error: null }); await fn(); } catch (e) { set({ error: (e as Error).message }); }
  };
  return {
    role: null, doctors: [], templates: [], uploads: [], collections: [], payouts: [], runs: [], comparison: [], changes: [],
    month: '2026-01', lastUpload: null, error: null,
    login: (role) => set({ role, error: null }),
    setMonth: (month) => {
      set({ month });
      void get().loadPayouts();
    },
    // Show the latest saved calculation for the selected month (none yet -> empty).
    loadPayouts: async () => {
      const month = get().month;
      const payouts = await call<Payout[]>(`/payouts?month=${month}`).catch(() => [] as Payout[]);
      if (get().month === month) set({ payouts });
    },
    clearError: () => set({ error: null }),
    loadAll: () => guard(async () => {
      const [doctors, templates, uploads, collections, runs, comparison, changes] = await Promise.all([
        call<Doctor[]>('/doctors'), call<Template[]>('/templates'),
        call<Upload[]>('/uploads'), call<Collection[]>('/collections'),
        call<PayoutRun[]>('/payouts/history'), call<MonthSummary[]>('/payouts/comparison'),
        call<TemplateChange[]>('/templates/changelog'),
      ]);
      set({ doctors, templates, uploads, collections, runs, comparison, changes });
      await get().loadPayouts();
    }),
    saveTemplate: (t) => guard(async () => {
      await call(t.id ? `/templates/${t.id}` : '/templates', { method: t.id ? 'PUT' : 'POST', body: JSON.stringify(t) });
      await get().loadAll();
    }),
    assign: (doctorId, templateId) => guard(async () => {
      await call(`/doctors/${doctorId}/template`, { method: 'PATCH', body: JSON.stringify({ templateId }) });
      await get().loadAll();
    }),
    upload: (f) => guard(async () => {
      const fd = new FormData();
      fd.append('file', f);
      const lastUpload = await call<Upload>('/collections/upload', { method: 'POST', body: fd });
      set({ lastUpload });
      await get().loadAll();
    }),
    calculate: () => guard(async () => {
      set({ payouts: await call<Payout[]>('/payouts/calculate', { method: 'POST', body: JSON.stringify({ month: get().month }) }) });
      await get().loadAll();
    }),
    download: (path, fallbackName) => guard(() => download(path, get().role ?? 'viewer', fallbackName)),
  };
});
