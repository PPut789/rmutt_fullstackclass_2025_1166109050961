const express = require('express');
const router = express.Router();
const pool = require('../db');

// ดึงข้อมูล Categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id, 
        c.name, 
        c.description, 
        COUNT(p.id)::int AS product_count 
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.id ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Get Categories Error:', err);
    res.status(500).send('Server error');
  }
});

// เพิ่มหมวดหมู่ใหม่
router.post('/categories', async (req, res) => {
  try {
    const { name, description } = req.body;

    await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2)',
      [name, description]
    );

    res.json({ success: true, message: 'เพิ่มหมวดหมู่สำเร็จ' });
  } catch (err) {
    console.error('Create Category Error:', err);
    res.status(500).send('Server error');
  }
});

// แก้ไขหมวดหมู่
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    await pool.query(
      'UPDATE categories SET name = $1, description = $2 WHERE id = $3',
      [name, description, id]
    );

    res.json({ success: true, message: 'อัปเดตหมวดหมู่สำเร็จ' });
  } catch (err) {
    console.error('Update Category Error:', err);
    res.status(500).send('Server error');
  }
});

// ลบหมวดหมู่
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM categories WHERE id = $1', [id]);

    res.json({ success: true, message: 'ลบหมวดหมู่สำเร็จ' });
  } catch (err) {
    console.error('Delete Category Error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;