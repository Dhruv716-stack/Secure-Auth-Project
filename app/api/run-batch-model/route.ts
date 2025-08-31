import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function GET(req: NextRequest) {
    try {
        // Spawn the batch worker script as a child process
        const scriptPath = path.join(process.cwd(), 'scripts', 'batch_model_worker_v2.js');
        const child = spawn('node', [scriptPath], {
            detached: true,
            stdio: 'ignore',
        });
        child.unref();
        return NextResponse.json({ success: true, message: 'Batch worker started.' });
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
} 