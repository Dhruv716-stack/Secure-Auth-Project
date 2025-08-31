"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function () { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function (o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma = require('../lib/prisma').prisma;
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function fetchModelInputs() {
    return await prisma.modelInput.findMany({
        orderBy: { id: 'asc' },
    });
}

async function runPythonBatchModel(batchData) {
    return new Promise((resolve, reject) => {
        const inputPath = 'batch_input.json';
        const fullInputPath = path.join(process.cwd(), 'final_rf_production', inputPath);
        fs.writeFileSync(fullInputPath, JSON.stringify(batchData));
        const py = spawn('python', ['predict_batch.py', inputPath], {
            cwd: path.join(process.cwd(), 'final_rf_production')
        });
        let output = '';
        py.stdout.on('data', (data) => { output += data; });
        py.stderr.on('data', (err) => { console.error(err.toString()); });
        py.on('close', (code) => {
            fs.unlinkSync(fullInputPath);
            if (code === 0) {
                try {
                    resolve(JSON.parse(output));
                } catch (e) {
                    reject('Failed to parse model output');
                }
            } else {
                reject('Python script failed');
            }
        });
    });
}

async function main() {
    try {
        const inputs = await fetchModelInputs();
        if (inputs.length === 0) {
            console.log('No modelInput records found.');
            return;
        }
        // Prepare batch for model
        const batch = inputs.map(input => ({
            user_id: input.customer_id,
            session_id: input.session_id,
            device_type: input.device_type,
            click_events: input.click_events,
            scroll_events: input.scroll_events,
            touch_events: input.touch_events,
            keyboard_events: input.keyboard_events,
            device_motion: input.device_motion,
            time_on_page: input.time_on_page,
            screen_size: input.screen_size,
            browser_info: input.browser_info,
            language: input.language,
            timezone_offset: input.timezone_offset,
            device_orientation: input.device_orientation,
            geolocation_city: input.geolocation_city,
            transaction_amount: input.transaction_amount,
            transaction_date: input.transaction_date,
            mouse_movement: input.mouse_movement
        }));
        const results = await runPythonBatchModel(batch);
        // Store outputs in modelOutput
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const output = results[i];
            await prisma.modelOutput.create({
                data: {
                    customerId: input.customer_id,
                    sessionId: input.session_id,
                    anomalyScore: output.anomaly_score ?? 0,
                    riskCategory: output.risk_level ?? '',
                    riskReasons: output.risk_reason ?? '',
                }
            });
        }
        console.log(`Batch processed: ${inputs.length} records.`);
    } catch (err) {
        console.error('Error in batch worker:', err);
    }
}

main();
