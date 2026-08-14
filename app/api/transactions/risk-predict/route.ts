import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        // Prepare input for the model (same as in transaction POST)
        const rawInput = [{
            device_type: body.device || null,
            click_events: 0,
            scroll_events: 0,
            touch_events: 0,
            keyboard_events: 0,
            device_motion: 0,
            time_on_page: 0,
            screen_size: null,
            browser_info: null,
            language: null,
            timezone_offset: 0,
            device_orientation: null,
            geolocation_city: body.location && typeof body.location === 'string' ? body.location.split(',')[0] : null,
            transaction_amount: Number(body.amount),
            transaction_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
            mouse_movement: 0
        }];
        const input = rawInput;
        // Write input to temp file
        const inputPath = path.join(process.cwd(), 'final_production_model', 'production', 'single_input.json');
        fs.writeFileSync(inputPath, JSON.stringify(input));
        // Run model. predict_batch.py imports predict as a sibling module,
        // so it must run with the model directory as cwd.
        const py = spawn('python', ['predict_batch.py', inputPath], {
            cwd: path.join(process.cwd(), 'final_production_model', 'production')
        });
        let output = '';
        let stderr = '';
        py.stderr.on('data', (chunk) => { stderr += chunk; });
        for await (const chunk of py.stdout) { output += chunk; }
        const exitCode = await new Promise((resolve) => py.on('close', resolve));
        fs.unlinkSync(inputPath);
        if (exitCode !== 0) {
            console.error('Risk model failed with exit code', exitCode, stderr);
            return NextResponse.json({ error: 'Risk model unavailable' }, { status: 503 });
        }
        let result = [];
        try {
            result = JSON.parse(output);
        } catch (e) {
            console.error('Risk model returned unparseable output:', output, stderr);
            return NextResponse.json({ error: 'Risk model unavailable' }, { status: 503 });
        }
        // Return only the risk level/category
        return NextResponse.json({ risk: result[0]?.risk_level || result[0]?.riskCategory || 'Low' });
    } catch (error) {
        console.error('Risk predict error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 