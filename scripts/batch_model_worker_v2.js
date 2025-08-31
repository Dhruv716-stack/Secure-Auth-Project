"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](e)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma = require('../lib/prisma').prisma;
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Batch size configuration
const BATCH_SIZE = 10;

// Required columns and their expected data types for the model
const REQUIRED_COLUMNS = {
    device_type: 'string',
    click_events: 'number',
    scroll_events: 'number',
    touch_events: 'number',
    keyboard_events: 'number',
    device_motion: 'number',
    time_on_page: 'number',
    screen_size: 'string',
    browser_info: 'string',
    language: 'string',
    timezone_offset: 'number',
    device_orientation: 'string',
    geolocation_city: 'string',
    transaction_amount: 'number',
    transaction_date: 'string',
    mouse_movement: 'number'
};

// Data validation and type conversion function
function validateAndConvertInput(input) {
    const validated = {};

    for (const [column, expectedType] of Object.entries(REQUIRED_COLUMNS)) {
        let value = input[column];

        // Handle missing values
        if (value === undefined || value === null) {
            // Set default values based on column type
            if (expectedType === 'number') {
                value = 0;
            } else if (expectedType === 'string') {
                value = '';
            }
        } else {
            // Type conversion
            try {
                switch (expectedType) {
                    case 'number':
                        value = Number(value);
                        if (isNaN(value)) {
                            console.warn(`Invalid number for ${column}: ${input[column]}, setting to 0`);
                            value = 0;
                        }
                        break;
                    case 'string':
                        value = String(value);
                        // Special handling for transaction_date
                        if (column === 'transaction_date') {
                            try {
                                // Convert JavaScript Date string to expected format
                                const date = new Date(value);
                                if (!isNaN(date.getTime())) {
                                    value = date.toISOString().replace('T', ' ').slice(0, 19);
                                } else {
                                    console.warn(`Invalid date format for transaction_date: ${value}, setting to current time`);
                                    value = new Date().toISOString().replace('T', ' ').slice(0, 19);
                                }
                            } catch (dateError) {
                                console.warn(`Error converting transaction_date: ${dateError.message}, setting to current time`);
                                value = new Date().toISOString().replace('T', ' ').slice(0, 19);
                            }
                        }
                        break;
                }
            } catch (error) {
                console.warn(`Error converting ${column} to ${expectedType}: ${error.message}`);
                // Set default value
                if (expectedType === 'number') {
                    value = 0;
                } else if (expectedType === 'string') {
                    value = '';
                }
            }
        }

        validated[column] = value;
    }

    return validated;
}

async function fetchModelInputs() {
    return await prisma.modelInput.findMany({
        orderBy: { id: 'asc' },
        take: BATCH_SIZE, // Only fetch batch_size records
    });
}

async function runPythonBatchModel(batchData) {
    return new Promise((resolve, reject) => {
        const inputPath = 'batch_input.json';
        const fullInputPath = path.join(process.cwd(), 'final_production_model', inputPath);
        const pythonDir = path.join(process.cwd(), 'final_production_model');

        console.log('Writing batch data to:', fullInputPath);
        console.log('Python working directory:', pythonDir);
        console.log('Batch data sample:', JSON.stringify(batchData[0], null, 2));

        fs.writeFileSync(fullInputPath, JSON.stringify(batchData));
        const py = spawn('python', ['predict_batch.py', inputPath], {
            cwd: pythonDir
        });
        let output = '';
        let stderr = '';
        py.stdout.on('data', (data) => {
            output += data;
            console.log('Python stdout chunk:', data.toString());
        });
        py.stderr.on('data', (err) => {
            stderr += err;
            console.error('Python stderr chunk:', err.toString());
        });
        py.on('close', (code) => {
            fs.unlinkSync(fullInputPath);
            console.log('Python process exited with code:', code);
            console.log('Raw Python output length:', output.length);
            console.log('Raw Python output (first 500 chars):', output.substring(0, 500));
            if (stderr) {
                console.log('Python stderr:', stderr);
            }
            if (code === 0) {
                try {
                    // Try to parse the entire output as JSON
                    const cleanOutput = output.trim();
                    console.log('Attempting to parse JSON from:', cleanOutput.substring(0, 200) + '...');
                    const result = JSON.parse(cleanOutput);
                    console.log('Successfully parsed JSON with', result.length, 'items');
                    resolve(result);
                } catch (e) {
                    console.error('JSON parse error:', e.message);
                    console.error('Full output that failed to parse:', output);
                    reject('Failed to parse model output: ' + e.message);
                }
            } else {
                reject('Python script failed with code: ' + code);
            }
        });
    });
}

async function deleteProcessedInputs(inputIds) {
    if (inputIds.length > 0) {
        await prisma.modelInput.deleteMany({
            where: {
                id: { in: inputIds }
            }
        });
    }
}

async function main() {
    try {
        const inputs = await fetchModelInputs();
        if (inputs.length === 0) {
            console.log('No modelInput records found.');
            return;
        }

        console.log(`Processing batch of ${inputs.length} records...`);

        // Prepare batch for model with validation and type conversion
        const batch = inputs.map((input, index) => {
            const rawInput = {
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
            };

            const validatedInput = validateAndConvertInput(rawInput);
            console.log(`Input ${index + 1} validated and converted:`, validatedInput);

            return validatedInput;
        });

        const results = await runPythonBatchModel(batch);

        // Store outputs in modelOutput
        const inputIds = [];
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const output = results[i];
            inputIds.push(input.id);

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

        // Delete processed inputs
        await deleteProcessedInputs(inputIds);

        console.log(`Batch processed: ${inputs.length} records. Inputs deleted from modelInput table.`);
    } catch (err) {
        console.error('Error in batch worker:', err);
    }
}

main(); 