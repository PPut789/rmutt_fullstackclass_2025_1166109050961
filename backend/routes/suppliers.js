const express = require('express');
const router = express.Router();
const pool = require('../db');

// ดึงข้อมูล Suppliers
router.get('/suppliers', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id, 
        s.name, 
        s.contact_person, 
        s.email, 
        s.phone, 
        s.location, 
        s.status,
        COUNT(p.id)::int AS product_count 
      FROM suppliers s
      LEFT JOIN products p ON s.id = p.supplier_id
      GROUP BY s.id
      ORDER BY s.id ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Get Suppliers Error:', err);
    res.status(500).send('Server error');
  }
});

// เพิ่ม Supplier ใหม่
router.post('/suppliers', async (req, res) => {
  try {
    const { name, contact_person, email, phone, location, status } = req.body;

    await pool.query(
      `INSERT INTO suppliers (name, contact_person, email, phone, location, status) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, contact_person, email, phone, location, status || 'Active']
    );

    res.json({ success: true, message: 'เพิ่มซัพพลายเออร์สำเร็จ' });
  } catch (err) {
    console.error('Create Supplier Error:', err);
    res.status(500).send('Server error');
  }
});

// แก้ไข Supplier
router.put('/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, email, phone, location, status } = req.body;

    await pool.query(
      `UPDATE suppliers 
       SET name = $1, contact_person = $2, email = $3, phone = $4, location = $5, status = $6 
       WHERE id = $7`,
      [name, contact_person, email, phone, location, status, id]
    );

    res.json({ success: true, message: 'อัปเดตซัพพลายเออร์สำเร็จ' });
  } catch (err) {
    console.error('Update Supplier Error:', err);
    res.status(500).send('Server error');
  }
});

// ลบ Supplier
router.delete('/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM suppliers WHERE id = $1', [id]);

    res.json({ success: true, message: 'ลบซัพพลายเออร์สำเร็จ' });
  } catch (err) {
    console.error('Delete Supplier Error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;