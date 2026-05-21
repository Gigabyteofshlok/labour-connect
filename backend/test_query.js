const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const walletRes = await pool.query('SELECT * FROM wallets LIMIT 1');
    if (walletRes.rows.length > 0) {
      const walletId = walletRes.rows[0].id;
      console.log('Using Wallet ID:', walletId);
      
      try {
        const res = await pool.query(
          `SELECT DATE_TRUNC('month', created_at) as month, SUM(amount) as amount 
           FROM transactions 
           WHERE wallet_id = $1 AND (type = 'credit')
           GROUP BY month 
           ORDER BY month DESC LIMIT 6`,
          [walletId]
        );
        console.log('Success! Results:', res.rows);
      } catch (err) {
        console.error('Error running select query:', err);
      }
    } else {
      console.log('No wallets found to query!');
    }
  } catch (err) {
    console.error('Connection/Query error:', err);
  } finally {
    await pool.end();
  }
}

run();
