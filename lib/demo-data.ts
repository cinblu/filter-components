// Synthetic "document processing queue" dataset for the docs site and demo (SPEC §12).
//
// Everything here is invented and generated from a fixed seed, so the same seed always
// produces the same rows. No real names, no real email domains, no patient-like fields.
//
// Dates are generated as offsets back from a reference `now`, which defaults to the start
// of today. That keeps the date presets ("Last 7 days" etc.) meaningful on any day the demo
// is opened, while the rest of each row stays identical across runs.

import { startOfDay, subMonths } from "date-fns";

export const DEMO_SEED = 20260418;
export const DEMO_ROW_COUNT = 2000;

export const QUEUES = [
  "Intake",
  "Billing",
  "Legal Review",
  "Claims",
  "Archive",
  "Compliance",
  "Underwriting",
  "Correspondence",
  "Vendor Invoices",
  "Contracts",
  "Returns",
  "Exceptions",
] as const;

export const WORKFLOWS = [
  "Standard Review",
  "Two-step Approval",
  "Auto-classify",
  "Manual Indexing",
  "OCR Verification",
  "Redaction",
  "Escalation",
  "Bulk Import",
] as const;

export const STATUSES = ["Initial", "In Review", "Committed", "Failed"] as const;

export const SOURCES = ["Upload", "Email", "Fax", "API"] as const;

// Invented first names only.
export const ASSIGNEES = [
  "Avrel",
  "Bexa",
  "Corvan",
  "Dessa",
  "Elvar",
  "Fenna",
  "Grell",
  "Halvi",
  "Isko",
  "Jorvi",
  "Kessa",
  "Lumen",
  "Mirro",
  "Nyra",
  "Oskel",
  "Pell",
  "Quessa",
  "Rhosk",
  "Sefa",
  "Tavren",
] as const;

export type Queue = (typeof QUEUES)[number];
export type Workflow = (typeof WORKFLOWS)[number];
export type Status = (typeof STATUSES)[number];
export type Source = (typeof SOURCES)[number];
export type Assignee = (typeof ASSIGNEES)[number];

export interface DemoRow {
  batchId: string;
  queue: Queue;
  workflow: Workflow;
  status: Status;
  assignee: Assignee;
  pages: number;
  /** ISO 8601 timestamp, within the 18 months before `now`. */
  createdAt: string;
  source: Source;
}

/** Mulberry32: a tiny, fast, seedable PRNG. Returns floats in [0, 1). */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)];
}

/** Picks from `items` using relative `weights` (same length). */
function pickWeighted<T>(rand: () => number, items: readonly T[], weights: readonly number[]): T {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r < 0) return items[i];
  }
  return items[items.length - 1];
}

// Most batches end up committed; a minority are still moving or have failed.
const STATUS_WEIGHTS = [15, 25, 50, 10];
// Uploads and email dominate; fax is rare.
const SOURCE_WEIGHTS = [40, 30, 8, 22];

export interface GenerateDemoRowsOptions {
  count?: number;
  seed?: number;
  /** Reference point for Created Date. Defaults to the start of today (local time). */
  now?: Date;
}

export function generateDemoRows({
  count = DEMO_ROW_COUNT,
  seed = DEMO_SEED,
  now = startOfDay(new Date()),
}: GenerateDemoRowsOptions = {}): DemoRow[] {
  const rand = mulberry32(seed);
  const end = now.getTime();
  const span = end - subMonths(now, 18).getTime();

  const rows: DemoRow[] = [];
  for (let i = 0; i < count; i++) {
    // Skew page counts towards small batches, with a long tail up to 400.
    const pages = 1 + Math.floor(rand() ** 2.5 * 400);
    rows.push({
      batchId: `B-${String(10001 + i)}`,
      queue: pick(rand, QUEUES),
      workflow: pick(rand, WORKFLOWS),
      status: pickWeighted(rand, STATUSES, STATUS_WEIGHTS),
      assignee: pick(rand, ASSIGNEES),
      pages,
      createdAt: new Date(end - Math.floor(rand() * span)).toISOString(),
      source: pickWeighted(rand, SOURCES, SOURCE_WEIGHTS),
    });
  }
  return rows;
}
