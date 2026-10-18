import { parseCollectionsCsv } from './csv';
import { Doctor } from './types';

const docs: Doctor[] = [{ id: 'D1', name: 'A', specialty: 's', templateId: 't' }];

describe('parseCollectionsCsv', () => {
  it('rejects missing columns', () => {
    expect(parseCollectionsCsv('doctor_id,amount\nD1,5', docs, []).fatal).toMatch(/date, reference/);
  });
  it('reports row-level errors and duplicates', () => {
    const csv = 'doctor_id,date,amount,reference\nD1,2026-01-05,100,R1\nD9,2026-01-05,100,R2\nD1,2026-01-06,abc,R3\nD1,2026-01-05,100,R1';
    const r = parseCollectionsCsv(csv, docs, []);
    expect(r.accepted).toHaveLength(1);
    expect(r.errors.map((e) => [e.row, e.field])).toEqual([[2, 'doctor_id'], [3, 'amount'], [4, 'reference']]);
  });
});
