const { exec } = require('child_process');
const cron = require('node-cron');

// Run every 10 seconds
cron.schedule('*/10 * * * * *', () => {
    console.log(`[${new Date().toISOString()}] Running batch worker...`);
    exec('node scripts/batch_model_worker.js', (error, stdout, stderr) => {
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

console.log('Batch worker cron started.'); 