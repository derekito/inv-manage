const cron = require('node-cron');
const fetch = require('node-fetch');
require('dotenv').config();

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error('CRON_SECRET not found in environment variables');
  process.exit(1);
}

console.log('Starting cron service...');

// Changed from */15 to */1 to run every minute
cron.schedule('*/1 * * * *', async () => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] Running scheduled sync...`);

  try {
    const response = await fetch(`${APP_URL}/api/cron/sync`, {
      headers: {
        'x-cron-token': CRON_SECRET
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`[${timestamp}] Sync completed successfully`);
      console.log('Details:', data.details);
    } else {
      console.error(`[${timestamp}] Sync failed:`, data.error);
    }
  } catch (error) {
    console.error(`[${timestamp}] Cron error:`, error.message);
  }
});

console.log('Cron service started. Running every minute for testing.');
console.log('Press Ctrl+C to stop'); 