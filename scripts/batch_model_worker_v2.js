"use strict";

/**
 * Scores queued behavioural rows and records the results.
 *
 * Runs on a 10s cron (scripts/batch_model_cron_v2.js). Each pass takes up to
 * BATCH_SIZE unscored rows, scores them, writes modelOutput, and marks the
 * rows scored.
 *
 * Rows are marked, not deleted. They are the user's behavioural history -- the
 * baseline the model compares new sessions against -- and the raw material for
 * future retraining. `scoredAt` is also what advances the queue: the fetch
 * selects `scoredAt: null`, so without it the same oldest rows would be read
 * forever.
 *
 * Scoring goes through the model API when MODEL_API_URL is set, and otherwise
 * spawns Python, mirroring lib/model-client.ts. This file is CommonJS and
 * cannot import the TypeScript client directly, so the two transports are
 * reimplemented here; predict_batch.py accepts the same payload shape as the
 * API so both paths score identically.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

const prisma = require('../lib/prisma').prisma;

const BATCH_SIZE = 10;

/** Past rows per user handed to the model as their personal baseline. */
const HISTORY_LIMIT = 50;

const MODEL_DIR = path.join(process.cwd(), 'final_production_model', 'production');

async function fetchModelInputs() {
    return prisma.modelInput.findMany({
        where: { scoredAt: null },
        orderBy: { id: 'asc' },
        take: BATCH_SIZE,
    });
}

/**
 * Fetch each user's prior behaviour, excluding the sessions in this batch.
 *
 * Excluding them matters: the "is this device new for this user" features
 * compare against the devices seen in history, so if the current session is
 * present its device is trivially familiar and the account-takeover signal
 * silently evaluates to zero.
 *
 * Rows are grouped by customer because history is per-user; scoring one user's
 * session against another's baseline would be meaningless.
 */
async function fetchHistories(inputs) {
    const byCustomer = new Map();
    for (const input of inputs) {
        if (!byCustomer.has(input.customer_id)) byCustomer.set(input.customer_id, new Set());
        byCustomer.get(input.customer_id).add(input.session_id);
    }

    const histories = new Map();
    for (const [customerId, sessionIds] of byCustomer) {
        try {
            histories.set(
                customerId,
                await prisma.modelInput.findMany({
                    where: {
                        customer_id: customerId,
                        session_id: { notIn: Array.from(sessionIds) },
                    },
                    orderBy: { id: 'desc' },
                    take: HISTORY_LIMIT,
                    select: {
                        click_events: true,
                        keyboard_events: true,
                        time_on_page: true,
                        device_type: true,
                        browser_info: true,
                        geolocation_city: true,
                    },
                }),
            );
        } catch (err) {
            // History is an enhancement. Losing it weakens detection for this
            // batch but must not stop the batch from being scored.
            console.error(`History lookup failed for ${customerId}:`, err.message);
            histories.set(customerId, []);
        }
    }
    return histories;
}

function toModelRow(input) {
    return {
        device_type: input.device_type ?? 'unknown',
        click_events: input.click_events ?? 0,
        scroll_events: input.scroll_events ?? 0,
        touch_events: input.touch_events ?? 0,
        keyboard_events: input.keyboard_events ?? 0,
        device_motion: input.device_motion ?? 0,
        time_on_page: input.time_on_page ?? 0,
        screen_size: input.screen_size ?? 'unknown',
        browser_info: input.browser_info ?? 'unknown',
        language: input.language ?? 'unknown',
        timezone_offset: input.timezone_offset ?? 0,
        device_orientation: input.device_orientation ?? 'unknown',
        geolocation_city: input.geolocation_city ?? 'unknown',
        transaction_amount: Math.max(0, Number(input.transaction_amount ?? 0)),
        transaction_date:
            input.transaction_date instanceof Date
                ? input.transaction_date.toISOString().replace('T', ' ').slice(0, 19)
                : String(input.transaction_date ?? ''),
        mouse_movement: input.mouse_movement ?? 0,
    };
}

async function scoreViaApi(rows, history, apiUrl) {
    const res = await fetch(`${apiUrl.replace(/\/$/, '')}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, user_history: history.length ? history : null }),
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
        throw new Error(`Model API returned ${res.status}: ${await res.text()}`);
    }
    return (await res.json()).results;
}

function scoreViaSpawn(rows, history) {
    return new Promise((resolve, reject) => {
        // Unique filename: concurrent runs sharing one path would overwrite
        // each other's input and score the wrong rows.
        const inputPath = path.join(os.tmpdir(), `batch_${process.pid}_${Date.now()}.json`);
        fs.writeFileSync(
            inputPath,
            JSON.stringify({ rows, user_history: history.length ? history : null }),
        );

        const py = spawn('python', ['predict_batch.py', inputPath], { cwd: MODEL_DIR });
        let stdout = '';
        let stderr = '';
        py.stdout.on('data', (d) => { stdout += d; });
        py.stderr.on('data', (d) => { stderr += d; });
        py.on('error', reject);
        py.on('close', (code) => {
            try { fs.unlinkSync(inputPath); } catch { /* best effort */ }
            if (code !== 0) return reject(new Error(`Model exited ${code}: ${stderr}`));
            try {
                resolve(JSON.parse(stdout));
            } catch {
                reject(new Error(`Unparseable model output: ${stdout.slice(0, 300)}`));
            }
        });
    });
}

/**
 * Score one user's rows. Split per user so each batch is compared against its
 * own owner's baseline.
 */
async function scoreForCustomer(rows, history) {
    const apiUrl = process.env.MODEL_API_URL;
    return apiUrl ? scoreViaApi(rows, history, apiUrl) : scoreViaSpawn(rows, history);
}

async function main() {
    try {
        const inputs = await fetchModelInputs();
        if (inputs.length === 0) {
            console.log('No unscored modelInput records.');
            return;
        }

        console.log(
            `Scoring ${inputs.length} rows via ${process.env.MODEL_API_URL ? 'model API' : 'python spawn'}...`,
        );

        const histories = await fetchHistories(inputs);

        // Group by customer so each user's rows are scored against their own
        // history, then reassemble results in the original order.
        const groups = new Map();
        inputs.forEach((input, index) => {
            if (!groups.has(input.customer_id)) groups.set(input.customer_id, []);
            groups.get(input.customer_id).push(index);
        });

        const results = new Array(inputs.length);
        for (const [customerId, indices] of groups) {
            const scored = await scoreForCustomer(
                indices.map((i) => toModelRow(inputs[i])),
                histories.get(customerId) || [],
            );
            indices.forEach((inputIndex, position) => {
                results[inputIndex] = scored[position];
            });
        }

        await prisma.modelOutput.createMany({
            data: inputs.map((input, i) => ({
                customerId: input.customer_id,
                sessionId: input.session_id,
                anomalyScore: results[i]?.anomaly_score ?? 0,
                riskCategory: results[i]?.risk_level ?? '',
                riskReasons: results[i]?.risk_reason ?? '',
            })),
        });

        // Mark scored only after the outputs are safely stored. If the process
        // dies between the two, the rows stay unscored and are retried, which
        // is preferable to losing them silently.
        await prisma.modelInput.updateMany({
            where: { id: { in: inputs.map((i) => i.id) } },
            data: { scoredAt: new Date() },
        });

        const counts = results.reduce((acc, r) => {
            const level = r?.risk_level ?? 'unknown';
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {});
        console.log(`Scored ${inputs.length} rows:`, counts);
    } catch (err) {
        // Rows remain unscored, so the next tick retries them.
        console.error('Batch worker failed:', err.message);
        process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
    }
}

main();
