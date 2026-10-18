import { create } from 'zustand';
import { api } from './api';
import type { Collection, Doctor, Payout, Role, Template, Upload } from './types';

interface State {
  role: Role | null;
  doctors: Doctor[];
  templates: Template[];
  uploads: Upload[];
  collections: Collection[];
  payouts: Payout[];
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
}

export const useStore = create<State>((set, get) => {
  const call = <T,>(path: string, init?: RequestInit) => api<T>(path, get().role ?? 'viewer', init);
  const guard = async (fn: () => Promise<void>) => {
    try { set({ error: null }); await fn(); } catch (e) { set({ error: (e as Error).message }); }
  };
  return {
    role: null, doctors: [], templates: [], uploads: [], collections: [], payouts: [],
    month: '2026-01', lastUpload: null, error: null,
    login: (role) => set({ role, error: null }),
    setMonth: (month) => set({ month }),
    clearError: () => set({ error: null }),
    loadAll: () => guard(async () => {
      const [doctors, templates, uploads, collections] = await Promise.all([
        call<Doctor[]>('/doctors'), call<Template[]>('/templates'),
        call<Upload[]>('/uploads'), call<Collection[]>('/collections'),
      ]);
      set({ doctors, templates, uploads, collections });
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
    }),
  };
});
