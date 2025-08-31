const { exec } = require('child_process');
const cron = require('node-cron');

// Run every 10 seconds
cron.schedule('*/10 * * * * *', () => {
    console.log(`[${new Date().toISOString()}] Running new batch worker (v2)...`);
    exec('node scripts/batch_model_worker_v2.js', (error, stdout, stderr) => {
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