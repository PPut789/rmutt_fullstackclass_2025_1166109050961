const express = require('express');
const router = express.Router();
const pool = require('../db');

// ดึงข้อมูลออร์เดอร์ทั้งหมด
router.get('/orders', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders ORDER BY order_date DESC'
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Orders Error:', err);
    res.status(500).send('Server error');
  }
});

// อัปเดตสถานะออร์เดอร์
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      [status, id]
    );

    res.json({ success: true, message: 'อัปเดตสถานะสำเร็จ' });
  } catch (err) {
    console.error('Update Order Status Error:', err);
    res.status(500).send('Server error');
  }
});

// ลบออร์เดอร์
router.delete('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM orders WHERE id = $1', [id]);

    res.json({ success: true, message: 'ลบคำสั่งซื้อสำเร็จ' });
  } catch (err) {
    console.error('Delete Order Error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;