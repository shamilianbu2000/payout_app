# Doctor Payout Automation

Admin tool that turns monthly doctor collections into payouts. Payout rules live in reusable **templates** (flat %, marginal slabs, fixed fee) that are assigned per doctor. Collections arrive as CSV uploads with row-level validation, and a "calculate payouts" action produces a per-doctor, per-slab breakdown.

## Stack

- Frontend: React + TypeScript (Vite), Zustand, Radix UI (Dialog, Tabs, Select), plain CSS
- Backend: NestJS (TypeScript), Jest unit tests
- No database. All data is hard-coded seed data held in memory.
- No Azure MSAL. A mock login screen lets you pick `admin` or `viewer` (the frontend sends an `x-role` header; mutating endpoints require `admin`).

## Run

```bash
npm run install:all
npm run start:backend    # http://localhost:3004
npm run start:frontend   # http://localhost:5174  (in a second terminal)
npm test                 # backend Jest tests
npm run build            # build both
```

Demo flow: Login as Admin -> Collections tab -> upload `sample-data/collections.csv` (intentionally bad rows, see the error report) -> upload `sample-data/collections-good.csv` -> Payouts tab -> month `2026-01` -> Calculate.

## API (base `http://localhost:3004`, CORS enabled)

| Method | Path | Description | Admin only |
|---|---|---|---|
| GET | `/health` | Liveness check | no |
| GET | `/doctors` | List doctors with assigned template | no |
| PATCH | `/doctors/:id/template` | Assign template `{ templateId }` | yes |
| GET | `/templates` | List templates | no |
| POST | `/templates` | Create template | yes |
| PUT | `/templates/:id` | Update template | yes |
| POST | `/collections/upload` | Multipart field `file` (CSV); returns upload record with row errors | yes |
| GET | `/collections?month=YYYY-MM` | Accepted collections | no |
| GET | `/uploads` | Upload history with error reports | no |
| POST | `/payouts/calculate` | `{ month: "YYYY-MM" }` returns per-doctor breakdown | yes |
| GET | `/payouts?month=YYYY-MM` | Last calculated result for the month | no |

CSV columns: `doctor_id,date,amount,reference`. Validation: required columns (otherwise 400), non-empty values, date `YYYY-MM-DD`, numeric amount > 0, known doctor ID, and duplicates (same doctor + date + reference, within the file or already uploaded). Valid rows are kept; invalid rows are reported with row number, field and message.

## Fee engine

`backend/src/engine/` is a strategy pipeline: `FeeEngine` looks up a `FeeStrategy` by template type (`flat`, `slabs`, `fixed`) and returns breakdown lines plus the total. Add a new fee type by implementing `FeeStrategy` and calling `engine.register(...)`.

## How marginal slabs work

Each rate applies only to the part of the gross that falls inside its band, like income-tax brackets, not to the whole amount.

Template: 0-50,000 @ 40%, 50,000-100,000 @ 50%, 100,000+ @ 60%. Gross = 120,000:

| Slab | Portion in slab | Rate | Amount |
|---|---|---|---|
| 0 - 50,000 | 50,000 | 40% | 20,000 |
| 50,000 - 100,000 | 50,000 | 50% | 25,000 |
| 100,000+ | 20,000 | 60% | 12,000 |
| **Payout** | | | **57,000** |

(Applying 60% to the whole 120,000 would wrongly give 72,000.)

## Notes

- Data resets whenever the backend restarts (in-memory only).
- Uploaded files are parsed in memory (2 MB limit) and not stored.
- Mock role header is for demo purposes and is not real security.
