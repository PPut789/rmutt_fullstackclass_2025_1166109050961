const express = require('express');
const router = express.Router();
const pool = require('../db');

// API สำหรับเข้าสู่ระบบ (Login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT id, name, position, email FROM users WHERE email = $1 AND password = $2`,
      [email, password]
    );

    if (result.rows.length > 0) {
      res.json({
        success: true,
        message: 'Login successful',
        user: result.rows[0]
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;