import { Doctor, PayoutTemplate } from './types';

export const SEED_TEMPLATES: PayoutTemplate[] = [
  {
    id: 'T-TIER', name: 'Tiered 40/50/60', type: 'slabs',
    slabs: [
      { from: 0, to: 50000, rate: 40 },
      { from: 50000, to: 100000, rate: 50 },
      { from: 100000, to: null, rate: 60 },
    ],
  },
  { id: 'T-FLAT45', name: 'Flat 45%', type: 'flat', percent: 45 },
  { id: 'T-FIXED', name: 'Fixed retainer 30,000', type: 'fixed', fixedAmount: 30000 },
];

export const SEED_DOCTORS: Doctor[] = [
  { id: 'D001', name: 'Dr. Asha Rao', specialty: 'Cardiology', templateId: 'T-TIER' },
  { id: 'D002', name: 'Dr. Vikram Shah', specialty: 'Orthopedics', templateId: 'T-FLAT45' },
  { id: 'D003', name: 'Dr. Meera Iyer', specialty: 'Dermatology', templateId: 'T-FIXED' },
  { id: 'D004', name: 'Dr. Karan Mehta', specialty: 'Neurology', templateId: 'T-TIER' },
];
