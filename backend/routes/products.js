const express = require('express');
const router = express.Router();
const pool = require('../db');

// API สำหรับหน้า Products
router.get('/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        v.product_id, 
        v.product_name, 
        v.category_name, 
        v.supplier_name, 
        v.price, 
        v.image_url,
        COALESCE(SUM(sl.current_stock), 0)::int AS total_stock
      FROM view_products_list v
      LEFT JOIN stock_levels sl ON v.product_id = sl.product_id
      GROUP BY 
        v.product_id, 
        v.product_name, 
        v.category_name, 
        v.supplier_name, 
        v.price, 
        v.image_url
      ORDER BY v.product_id ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Get Products Error:', err);
    res.status(500).send('Server error');
  }
});

// เพิ่มสินค้าใหม่
router.post('/products', async (req, res) => {
  try {
    const { name, category_id, supplier_id, price, image_url } = req.body;

    await pool.query(
      `INSERT INTO products (name, category_id, supplier_id, price, image_url) 
       VALUES ($1, $2, $3, $4, $5)`,
      [name, category_id, supplier_id, price, image_url]
    );

    res.json({ success: true, message: 'เพิ่มสินค้าสำเร็จ' });
  } catch (err) {
    console.error('Create Product Error:', err);
    res.status(500).send('Server error');
  }
});

// แก้ไขสินค้า
router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, supplier_id, price, image_url } = req.body;

    await pool.query(
      `UPDATE products 
       SET name = $1, category_id = $2, supplier_id = $3, price = $4, image_url = $5 
       WHERE id = $6`,
      [name, category_id, supplier_id, price, image_url, id]
    );

    res.json({ success: true, message: 'อัปเดตสินค้าสำเร็จ' });
  } catch (err) {
    console.error('Update Product Error:', err);
    res.status(500).send('Server error');
  }
});

// ลบสินค้า
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM products WHERE id = $1', [id]);

    res.json({ success: true, message: 'ลบสินค้าสำเร็จ' });
  } catch (err) {
    console.error('Delete Product Error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;