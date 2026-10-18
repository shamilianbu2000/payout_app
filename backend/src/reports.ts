import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { PayoutResult, PayoutRun } from './types';

const money = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** One-page payout statement for a doctor in a month. Returns the PDF bytes. */
export function buildStatementPdf(r: PayoutResult, run: PayoutRun, collections: { date: string; reference: string; amount: number }[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const row = (cols: string[], xs: number[], bold = false) => {
      const y = doc.y;
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);
      cols.forEach((c, i) => doc.text(c, xs[i], y, { width: (xs[i + 1] ?? 545) - xs[i] - 6, align: i === 0 ? 'left' : 'right', lineBreak: false }));
      doc.moveDown(0.9);
    };

    doc.font('Helvetica-Bold').fontSize(18).text('Payout Statement');
    doc.font('Helvetica').fontSize(11).moveDown(0.5)
      .text(`Doctor: ${r.doctorName} (${r.doctorId})`)
      .text(`Month: ${r.month}   |   Run: v${run.version}   |   Generated: ${run.createdAt.slice(0, 10)}`)
      .text(`Payout template: ${r.templateName}`).moveDown();

    doc.font('Helvetica-Bold').fontSize(13).text('Collections', 50).moveDown(0.3);
    const cx = [50, 160, 400];
    row(['Date', 'Reference', 'Amount'], cx, true);
    collections.forEach((c) => row([c.date, c.reference, money(c.amount)], cx));
    if (!collections.length) doc.font('Helvetica-Oblique').fontSize(10).text('No collections in this month.', 50);
    row(['Gross', '', money(r.gross)], cx, true);

    doc.moveDown().font('Helvetica-Bold').fontSize(13).text('Payout breakdown', 50).moveDown(0.3);
    const bx = [50, 230, 340, 440];
    row(['Component', 'Base', 'Rate', 'Amount'], bx, true);
    r.lines.forEach((l) => row([l.label, money(l.base), l.rate !== undefined ? `${l.rate}%` : '-', money(l.amount)], bx));
    doc.moveDown(0.5).font('Helvetica-Bold').fontSize(14).text(`Total payout: ${money(r.payout)}`, 50, doc.y, { align: 'right', width: 495 });
    doc.end();
  });
}

/** Excel workbook with a summary sheet and a per-slab breakdown sheet. */
export async function buildPayoutsXlsx(run: PayoutRun): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sum = wb.addWorksheet('Payouts');
  sum.columns = [
    { header: 'Doctor ID', key: 'id', width: 12 }, { header: 'Doctor', key: 'name', width: 24 },
    { header: 'Template', key: 'tpl', width: 24 }, { header: 'Gross', key: 'gross', width: 14 },
    { header: 'Payout', key: 'payout', width: 14 },
  ];
  run.results.forEach((r) => sum.addRow({ id: r.doctorId, name: r.doctorName, tpl: r.templateName, gross: r.gross, payout: r.payout }));
  const total = sum.addRow({ name: `Total (${run.month}, v${run.version})`, gross: run.totalGross, payout: run.totalPayout });
  total.font = { bold: true };
  sum.getRow(1).font = { bold: true };
  ['D', 'E'].forEach((c) => (sum.getColumn(c).numFmt = '#,##0.00'));

  const det = wb.addWorksheet('Breakdown');
  det.columns = [
    { header: 'Doctor', key: 'name', width: 24 }, { header: 'Component', key: 'label', width: 22 },
    { header: 'Base', key: 'base', width: 14 }, { header: 'Rate %', key: 'rate', width: 10 }, { header: 'Amount', key: 'amount', width: 14 },
  ];
  run.results.forEach((r) => r.lines.forEach((l) => det.addRow({ name: r.doctorName, label: l.label, base: l.base, rate: l.rate, amount: l.amount })));
  det.getRow(1).font = { bold: true };
  return Buffer.from(await wb.xlsx.writeBuffer());
}
