// WALLET AND SIMULATED TRANSACTION CONTROLLER
// Implements secure balances, mock payment inputs, full transacting audit, and earner ledger breakdowns.

const db = require('../config/db');

// Get User Wallet details
const getWallet = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
    const wallet = result.rows[0];

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found.' });
    }

    res.status(200).json(wallet);
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ error: 'Server error. Failed to retrieve wallet.' });
  }
};

// Get User Wallet Transactions ledger
const getTransactions = async (req, res) => {
  const userId = req.user.id;

  try {
    const walletRes = await db.query('SELECT id FROM wallets WHERE user_id = $1', [userId]);
    const wallet = walletRes.rows[0];

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found.' });
    }

    const result = await db.query(
      `SELECT t.* 
       FROM transactions t 
       WHERE t.wallet_id = $1 
       ORDER BY t.created_at DESC`,
      [wallet.id]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Server error. Failed to load transaction histories.' });
  }
};

// Simulate wallet top-up (UPI Deposit)
const depositFunds = async (req, res) => {
  const { amount, paymentMethod } = req.body;
  const userId = req.user.id;

  const depositAmt = parseFloat(amount);

  if (isNaN(depositAmt) || depositAmt <= 0) {
    return res.status(400).json({ error: 'Please enter a valid deposit amount greater than zero.' });
  }

  try {
    const walletRes = await db.query('SELECT id, balance FROM wallets WHERE user_id = $1', [userId]);
    const wallet = walletRes.rows[0];

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found.' });
    }

    const newBalance = parseFloat(wallet.balance) + depositAmt;

    // Update wallet balance
    await db.query('UPDATE wallets SET balance = $1 WHERE id = $2', [newBalance, wallet.id]);

    // Record Deposit Transaction
    const transactionRes = await db.query(
      `INSERT INTO transactions (wallet_id, type, amount, description, status) 
       VALUES ($1, 'deposit', $2, $3, 'completed') RETURNING *`,
      [wallet.id, depositAmt, `Deposited funds via simulated ${paymentMethod || 'UPI Mock Gateway'}`]
    );

    // Send a push notification
    await db.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)',
      [userId, 'Wallet Top-up Successful', `₹${depositAmt} has been credited to your simulated wallet.`, 'payment_received']
    );

    // Dynamic transient sync broadcast fallback
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${userId}`).emit('db-sync-refresh', { type: 'wallet' });
      io.to(`user:${userId}`).emit('db-sync-refresh', { type: 'notifications' });
    }

    res.status(200).json({
      message: 'Deposit simulated successfully!',
      balance: newBalance,
      transaction: transactionRes.rows[0]
    });
  } catch (error) {
    console.error('Deposit funds error:', error);
    res.status(500).json({ error: 'Server error. Deposit simulation failed.' });
  }
};

// Worker earnings breakdown statistics
const getEarningsAnalytics = async (req, res) => {
  const workerId = req.user.id;

  try {
    const walletRes = await db.query('SELECT id, balance FROM wallets WHERE user_id = $1', [workerId]);
    const wallet = walletRes.rows[0];

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found.' });
    }

    // Retrieve monthly credits log
    const creditsRes = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_earnings, COUNT(*) as jobs_count
       FROM transactions 
       WHERE wallet_id = $1 AND (type = 'credit')`,
      [wallet.id]
    );

    const stats = creditsRes.rows[0];

    // Weekly earnings projection
    const monthlyListRes = await db.query(
      `SELECT DATE_TRUNC('month', created_at) as month, SUM(amount) as amount 
       FROM transactions 
       WHERE wallet_id = $1 AND (type = 'credit')
       GROUP BY month 
       ORDER BY month DESC LIMIT 6`,
      [wallet.id]
    );

    res.status(200).json({
      balance: parseFloat(wallet.balance),
      totalEarnings: parseFloat(stats.total_earnings),
      jobsCount: parseInt(stats.jobs_count),
      monthlyHistory: monthlyListRes.rows
    });
  } catch (error) {
    console.error('Earnings analytics error:', error);
    res.status(500).json({ error: 'Server error. Failed to build earnings analytics.' });
  }
};

module.exports = {
  getWallet,
  getTransactions,
  depositFunds,
  getEarningsAnalytics
};
