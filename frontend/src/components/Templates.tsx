import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useStore } from '../store';
import { money } from '../format';
import type { Slab, Template, TemplateType } from '../types';

const blank: Template = {
  id: '', name: '', type: 'slabs',
  slabs: [{ from: 0, to: 50000, rate: 40 }, { from: 50000, to: null, rate: 50 }],
};

const describe = (t: Template) =>
  t.type === 'flat' ? `${t.percent}% of gross`
  : t.type === 'fixed' ? `Fixed ${money(t.fixedAmount ?? 0)}`
  : (t.slabs ?? []).map((s) => `${money(s.from)}-${s.to === null ? '∞' : money(s.to)} @ ${s.rate}%`).join(' | ');

export function Templates() {
  const { templates, saveTemplate, role } = useStore();
  const [draft, setDraft] = useState<Template | null>(null);
  const admin = role === 'admin';
  const set = (p: Partial<Template>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const setSlab = (i: number, p: Partial<Slab>) =>
    set({ slabs: draft!.slabs!.map((s, j) => (j === i ? { ...s, ...p } : s)) });

  const save = async () => {
    if (!draft) return;
    const { id, name, type } = draft;
    const body: Partial<Template> = { id: id || undefined, name, type };
    if (type === 'flat') body.percent = draft.percent ?? 0;
    if (type === 'fixed') body.fixedAmount = draft.fixedAmount ?? 0;
    if (type === 'slabs') body.slabs = draft.slabs;
    await saveTemplate(body);
    if (!useStore.getState().error) setDraft(null);
  };

  return (
    <>
      <div className="toolbar">
        <button className="primary" disabled={!admin} onClick={() => setDraft(structuredClone(blank))}>New template</button>
      </div>
      <table>
        <thead><tr><th>Name</th><th>Type</th><th>Rule</th><th /></tr></thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id}>
              <td>{t.name}</td><td>{t.type}</td><td>{describe(t)}</td>
              <td><button disabled={!admin} onClick={() => setDraft(structuredClone(t))}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog.Root open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="overlay" />
          <Dialog.Content className="dialog">
            <Dialog.Title>{draft?.id ? 'Edit template' : 'New template'}</Dialog.Title>
            <Dialog.Description>Slabs are applied marginally: each rate only covers its own band.</Dialog.Description>
            {draft && (
              <div className="form">
                <label>Name<input value={draft.name} onChange={(e) => set({ name: e.target.value })} /></label>
                <label>Type
                  <select value={draft.type} onChange={(e) => set({ type: e.target.value as TemplateType, slabs: draft.slabs ?? blank.slabs })}>
                    <option value="slabs">Marginal slabs</option>
                    <option value="flat">Flat percentage</option>
                    <option value="fixed">Fixed fee</option>
                  </select>
                </label>
                {draft.type === 'flat' && (
                  <label>Percent<input type="number" value={draft.percent ?? ''} onChange={(e) => set({ percent: Number(e.target.value) })} /></label>
                )}
                {draft.type === 'fixed' && (
                  <label>Fixed amount<input type="number" value={draft.fixedAmount ?? ''} onChange={(e) => set({ fixedAmount: Number(e.target.value) })} /></label>
                )}
                {draft.type === 'slabs' && (
                  <div>
                    {draft.slabs!.map((s, i) => (
                      <div className="slab-row" key={i}>
                        <input type="number" aria-label="from" value={s.from} onChange={(e) => setSlab(i, { from: Number(e.target.value) })} />
                        <input type="number" aria-label="to (blank = open)" placeholder="open" value={s.to ?? ''}
                          onChange={(e) => setSlab(i, { to: e.target.value === '' ? null : Number(e.target.value) })} />
                        <input type="number" aria-label="rate %" value={s.rate} onChange={(e) => setSlab(i, { rate: Number(e.target.value) })} />
                        <span>%</span>
                        <button onClick={() => set({ slabs: draft.slabs!.filter((_, j) => j !== i) })}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => {
                      const last = draft.slabs![draft.slabs!.length - 1];
                      const from = last?.to ?? last?.from ?? 0;
                      set({ slabs: [...draft.slabs!.map((s, j, a) => (j === a.length - 1 && s.to === null ? { ...s, to: from + 50000 } : s)), { from: last?.to ?? (last?.from ?? 0) + 50000, to: null, rate: last?.rate ?? 50 }] });
                    }}>+ Add slab</button>
                  </div>
                )}
                <div className="actions">
                  <Dialog.Close asChild><button>Cancel</button></Dialog.Close>
                  <button className="primary" onClick={save}>Save</button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
