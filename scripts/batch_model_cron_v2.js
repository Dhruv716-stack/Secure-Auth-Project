const { execFile } = require('child_process');
const path = require('path');
const cron = require('node-cron');

const WORKER = path.join(__dirname, 'batch_model_worker_v2.js');

// Guard against overlapping runs. A batch that takes longer than the
// interval would otherwise stack up behind itself.
let running = false;

// Run every 10 seconds. execFile (not exec) avoids going through a shell,
// which on Windows spawns a visible console window per invocation.
cron.schedule('*/10 * * * * *', () => {
    if (running) {
        console.log('Previous batch still running, skipping this tick.');
        return;
    }
    running = true;
    console.log(`[${new Date().toISOString()}] Running new batch worker (v2)...`);
    execFile(process.execPath, [WORKER], { windowsHide: true }, (error, stdout, stderr) => {
        running = false;
        if (error) {
            console.error(`Batch worker error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Batch worker stderr: ${stderr}`);
            return;
        }
        if (stdout.trim()) {
            console.log(`Batch worker output: ${stdout}`);
        }
    });
});

console.log('New batch worker cron (v2) started. Processing batches of 10 every 10 seconds.'); 