const express = require('express');
const router = express.Router();
const pool = require('../db');

// API สำหรับหน้า Dashboard
router.get('/dashboard-stats', async (req, res) => {
  try {
    const productsCount = await pool.query('SELECT COUNT(*) FROM products');
    const ordersCount = await pool.query('SELECT COUNT(*) FROM orders');
    const suppliersCount = await pool.query('SELECT COUNT(*) FROM suppliers');
    const lowStockCount = await pool.query(
      'SELECT COUNT(*) FROM stock_levels WHERE current_stock <= min_stock'
    );

    const recentOrders = await pool.query(`
      SELECT order_number, customer_name, total_amount, status, order_date 
      FROM orders 
      ORDER BY order_date DESC 
      LIMIT 5
    `);

    const stockByCategory = await pool.query(`
      SELECT 
        c.name AS category_name, 
        COALESCE(SUM(sl.current_stock), 0) AS total_stock
      FROM categories c
      JOIN products p ON c.id = p.category_id
      JOIN stock_levels sl ON p.id = sl.product_id
      GROUP BY c.id, c.name
      ORDER BY total_stock DESC
      LIMIT 6
    `);

    res.json({
      totalProducts: parseInt(productsCount.rows[0].count),
      totalOrders: parseInt(ordersCount.rows[0].count),
      totalSuppliers: parseInt(suppliersCount.rows[0].count),
      lowStock: parseInt(lowStockCount.rows[0].count),
      recentOrders: recentOrders.rows,
      stockByCategory: stockByCategory.rows
    });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;