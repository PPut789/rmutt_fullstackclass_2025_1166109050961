const express = require('express');
const router = express.Router();
const pool = require('../db');

// ดึงข้อมูลสต็อกทั้งหมด
router.get('/stock-levels', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        sl.id, 
        sl.product_id, 
        sl.warehouse_id, 
        sl.current_stock,
        p.name AS product_name,
        w.name AS warehouse_name
      FROM stock_levels sl
      JOIN products p ON sl.product_id = p.id
      JOIN warehouses w ON sl.warehouse_id = w.id
      ORDER BY sl.id ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Get Stock Levels Error:', err);
    res.status(500).send('Server error');
  }
});

// รับของเข้า / ปรับปรุงสต็อก
router.post('/stock-levels', async (req, res) => {
  try {
    const { product_id, warehouse_id, quantity } = req.body;

    const check = await pool.query(
      'SELECT id FROM stock_levels WHERE product_id = $1 AND warehouse_id = $2',
      [product_id, warehouse_id]
    );

    if (check.rows.length > 0) {
      await pool.query(
        'UPDATE stock_levels SET current_stock = $1 WHERE id = $2',
        [quantity, check.rows[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO stock_levels (product_id, warehouse_id, current_stock) VALUES ($1, $2, $3)',
        [product_id, warehouse_id, quantity]
      );
    }

    res.json({ success: true, message: 'อัปเดตสต็อกสำเร็จ' });
  } catch (err) {
    console.error('Stock Update Error:', err);
    res.status(500).send('Server error');
  }
});

// ลบข้อมูลสต็อก
router.delete('/stock-levels/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM stock_levels WHERE id = $1', [id]);

    res.json({ success: true, message: 'ลบข้อมูลสต็อกสำเร็จ' });
  } catch (err) {
    console.error('Delete Stock Error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;