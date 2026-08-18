/**
 * Single entry point for fraud scoring.
 *
 * Three call sites previously each wrote a temp JSON file, spawned
 * `python predict_batch.py`, and parsed stdout -- the same thirty lines
 * repeated, with the same failure modes to get wrong three times over. They
 * now all call scoreRows().
 *
 * Two transports are supported:
 *
 *   MODEL_API_URL set   -> POST to the FastAPI service (fast: the model stays
 *                          loaded, so a batch costs ~80ms instead of ~4s)
 *   MODEL_API_URL unset -> spawn Python, as before
 *
 * The spawn path is kept deliberately. Local development works with no extra
 * service running, and deployment becomes a matter of setting one variable.
 * It is also the fallback that makes the switch safe to roll back.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

/** One second of observed session behaviour. Mirrors the modelInput columns. */
export interface BehaviorRow {
  device_type?: string | null;
  click_events?: number;
  scroll_events?: number;
  touch_events?: number;
  keyboard_events?: number;
  device_motion?: number;
  time_on_page?: number;
  screen_size?: string | null;
  browser_info?: string | null;
  language?: string | null;
  timezone_offset?: number;
  device_orientation?: string | null;
  geolocation_city?: string | null;
  transaction_amount?: number;
  transaction_date?: string;
  mouse_movement?: number;
}

export interface RiskResult {
  predicted_label: number;
  anomaly_score: number;
  risk_level: 'Low' | 'Medium' | 'High';
  risk_reason: string;
}

const MODEL_DIR = path.join(process.cwd(), 'final_production_model', 'production');

/** Fail rather than hang: a wedged model must not hold a request open. */
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * The Python service validates types but rejects nulls, while the database
 * columns are nullable. Normalising here keeps that mismatch out of every
 * caller, and matches the defaults predict.py would impute anyway.
 */
function normalize(row: BehaviorRow): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  // Absent fields are OMITTED, not defaulted. predict.py imputes missing
  // columns from the training distribution, which is the honest treatment of
  // "we did not observe this". Filling zeroes would instead assert that the
  // user clicked nothing, moved nothing and spent no time on the page -- a
  // profile that looks like a bot, and which the model correctly flags. That
  // is how an endpoint with no behavioural data ends up scoring everything
  // High.
  //
  // Nulls are dropped for the same reason: the database columns are nullable
  // but the API schema is not, and a null is an absence, not a zero.
  for (const [key, value] of Object.entries(row)) {
    if (value !== undefined && value !== null) out[key] = value;
  }

  if (row.transaction_amount !== undefined && row.transaction_amount !== null) {
    // Negative amounts are rejected by the API and never appeared in training.
    out.transaction_amount = Math.max(0, Number(row.transaction_amount));
  }

  return out;
}

async function scoreViaApi(
  rows: BehaviorRow[],
  userHistory: BehaviorRow[] | undefined,
  apiUrl: string,
): Promise<RiskResult[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, '')}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rows: rows.map(normalize),
        user_history: userHistory?.length ? userHistory.map(normalize) : null,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Model API returned ${res.status}: ${await res.text()}`);
    }
    return (await res.json()).results as RiskResult[];
  } finally {
    clearTimeout(timer);
  }
}

async function scoreViaSpawn(
  rows: BehaviorRow[],
  userHistory: BehaviorRow[] | undefined,
): Promise<RiskResult[]> {
  // Unique filename per call: two concurrent requests sharing single_input.json
  // would overwrite each other's input and score the wrong rows.
  const inputPath = path.join(
    os.tmpdir(),
    `model_input_${process.pid}_${Date.now()}_${Math.random().toString(36).slice(2)}.json`,
  );
  fs.writeFileSync(
    inputPath,
    JSON.stringify({
      rows: rows.map(normalize),
      user_history: userHistory?.length ? userHistory.map(normalize) : null,
    }),
  );

  try {
    // predict_batch.py imports predict as a sibling module, so cwd matters.
    const py = spawn('python', ['predict_batch.py', inputPath], { cwd: MODEL_DIR });

    let stdout = '';
    let stderr = '';
    py.stdout.on('data', (c: Buffer) => { stdout += c; });
    py.stderr.on('data', (c: Buffer) => { stderr += c; });

    const exitCode: number = await new Promise((resolve, reject) => {
      py.on('close', resolve);
      py.on('error', reject);
    });

    if (exitCode !== 0) {
      throw new Error(`Model exited ${exitCode}: ${stderr}`);
    }

    try {
      return JSON.parse(stdout) as RiskResult[];
    } catch {
      throw new Error(`Model returned unparseable output: ${stdout.slice(0, 500)} ${stderr}`);
    }
  } finally {
    // Best-effort: a leftover temp file must not mask the real error above.
    try { fs.unlinkSync(inputPath); } catch { /* ignore */ }
  }
}

/**
 * Score behavioural rows. Results align positionally with `rows`.
 *
 * `userHistory` should be that user's OWN earlier sessions, excluding the one
 * being scored -- see getUserHistory(). It powers the deviation features that
 * catch account takeover. Omitting it is safe but weakens detection: those
 * features fall back to 0, meaning "no deviation observed".
 *
 * Throws on failure. Callers decide what that means: blocking a transaction is
 * a different decision from skipping a background batch, and this deliberately
 * does not return a default verdict. An earlier version fell back to 'Low' on
 * error, which made an outage look like a clean result.
 */
export async function scoreRows(
  rows: BehaviorRow[],
  userHistory?: BehaviorRow[],
): Promise<RiskResult[]> {
  if (rows.length === 0) return [];

  const apiUrl = process.env.MODEL_API_URL;
  return apiUrl
    ? scoreViaApi(rows, userHistory, apiUrl)
    : scoreViaSpawn(rows, userHistory);
}

/** Whether scoring will use the API. Useful for logging which path ran. */
export function usingModelApi(): boolean {
  return Boolean(process.env.MODEL_API_URL);
}
