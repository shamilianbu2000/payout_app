import { PayoutLine, PayoutTemplate } from '../types';
import { FeeStrategy, fixedStrategy, flatStrategy, round2, slabStrategy } from './strategies';

export class FeeEngine {
  private strategies = new Map<string, FeeStrategy>();

  constructor(strategies: FeeStrategy[] = [flatStrategy, slabStrategy, fixedStrategy]) {
    strategies.forEach((s) => this.register(s));
  }

  register(s: FeeStrategy): void {
    this.strategies.set(s.type, s);
  }

  calculate(gross: number, template: PayoutTemplate): { lines: PayoutLine[]; payout: number } {
    const strategy = this.strategies.get(template.type);
    if (!strategy) throw new Error(`No strategy for template type "${template.type}"`);
    const lines = strategy.calculate(gross, template);
    return { lines, payout: round2(lines.reduce((sum, l) => sum + l.amount, 0)) };
  }
}
