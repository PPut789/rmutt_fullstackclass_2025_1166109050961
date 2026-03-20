const express = require('express');
const router = express.Router();
const pool = require('../db');

// API สำหรับ Global Search
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json({
        products: [],
        suppliers: [],
        orders: [],
        shipments: []
      });
    }

    const searchQuery = `%${q}%`;

    // 1. ค้นหาสินค้า
    const products = await pool.query(
      `SELECT product_id, product_name, category_name, supplier_name, price 
       FROM view_products_list 
       WHERE product_name ILIKE $1 OR category_name ILIKE $1 OR supplier_name ILIKE $1 
       LIMIT 5`,
      [searchQuery]
    );

    // 2. ค้นหาซัพพลายเออร์
    const suppliers = await pool.query(
      `SELECT id, name, contact_person, email 
       FROM suppliers 
       WHERE name ILIKE $1 
       LIMIT 5`,
      [searchQuery]
    );

    // 3. ค้นหาออร์เดอร์
    const orders = await pool.query(
      `SELECT id, order_number, customer_name, total_amount, status 
       FROM orders 
       WHERE order_number ILIKE $1 OR customer_name ILIKE $1 
       LIMIT 5`,
      [searchQuery]
    );

    // 4. ค้นหาการจัดส่ง
    const shipments = await pool.query(
      `SELECT id, tracking_number, carrier_name, status 
       FROM shipments 
       WHERE tracking_number ILIKE $1 
       LIMIT 5`,
      [searchQuery]
    );

    res.json({
      products: products.rows,
      suppliers: suppliers.rows,
      orders: orders.rows,
      shipments: shipments.rows
    });
  } catch (err) {
    console.error('Search Error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;