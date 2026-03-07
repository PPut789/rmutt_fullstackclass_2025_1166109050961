const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/products', async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        c.name AS category,
        s.name AS supplier,
        p.price,
        p.image_url
      FROM products p
      LEFT JOIN categories c 
        ON p.category_id = c.id
      LEFT JOIN suppliers s 
        ON p.supplier_id = s.id
    `);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// API สำหรับ Global Search (ค้นหาครอบจักรวาล)
app.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({ products: [], suppliers: [], orders: [], shipments: [] });
    }

    const searchQuery = `%${q}%`;

    // 1. ค้นหาสินค้า (จากชื่อ, หมวดหมู่, ซัพพลายเออร์)
    const products = await pool.query(
      `SELECT product_id, product_name, category_name, supplier_name, price 
       FROM view_products_list 
       WHERE product_name ILIKE $1 OR category_name ILIKE $1 OR supplier_name ILIKE $1 LIMIT 5`,
      [searchQuery]
    );

    // 2. ค้นหาซัพพลายเออร์ (จากชื่อบริษัท)
    const suppliers = await pool.query(
      `SELECT id, name, contact_person, email FROM suppliers WHERE name ILIKE $1 LIMIT 5`,
      [searchQuery]
    );

    // 3. ค้นหาออร์เดอร์ (จากรหัสออร์เดอร์ หรือชื่อลูกค้า)
    const orders = await pool.query(
      `SELECT id, order_number, customer_name, total_amount, status FROM orders 
       WHERE order_number ILIKE $1 OR customer_name ILIKE $1 LIMIT 5`,
      [searchQuery]
    );

    // 4. ค้นหาการจัดส่ง (จากเลขแทรคกิ้ง)
    const shipments = await pool.query(
      `SELECT id, tracking_number, carrier, status FROM shipments WHERE tracking_number ILIKE $1 LIMIT 5`,
      [searchQuery]
    );

    // มัดรวมส่งกลับไปเป็นก้อนเดียว
    res.json({
      products: products.rows,
      suppliers: suppliers.rows,
      orders: orders.rows,
      shipments: shipments.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
// ==========================================
// API สำหรับเข้าสู่ระบบ (Login) ที่เราเผลอลบไป
// ==========================================
app.post('/login', async (req, res) => {
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
    console.error(err);
    res.status(500).send('Server error');
  }
});

// API สำหรับหน้า Dashboard
app.get('/dashboard-stats', async (req, res) => {
  try {
    const productsCount = await pool.query('SELECT COUNT(*) FROM products');
    const ordersCount = await pool.query('SELECT COUNT(*) FROM orders');
    const suppliersCount = await pool.query('SELECT COUNT(*) FROM suppliers');
    const lowStockCount = await pool.query('SELECT COUNT(*) FROM stock_levels WHERE current_stock <= min_stock');

    const recentOrders = await pool.query(`
      SELECT order_number, customer_name, total_amount, status, order_date 
      FROM orders ORDER BY order_date DESC LIMIT 5
    `);

    // 🔥 เพิ่มส่วนนี้: ดึงข้อมูลยอดรวมสต็อก แยกตามหมวดหมู่ (เอา 6 หมวดที่ของเยอะสุด)
    const stockByCategory = await pool.query(`
      SELECT c.name as category_name, COALESCE(SUM(sl.current_stock), 0) as total_stock
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
      stockByCategory: stockByCategory.rows // ส่งข้อมูลไปวาดกราฟ
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


app.listen(3000, () => {
  console.log('Server running on port 3000');
});