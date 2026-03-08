const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

app.use(cors());
app.use(express.json());


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


// ==========================================
// API สำหรับหน้า Products (ตารางสินค้า)
// ==========================================
// ==========================================
// API สำหรับหน้า Products (ดึงข้อมูล + ยอดสต็อกรวม)
// ==========================================
// ==========================================
// API สำหรับหน้า Products (ดึงข้อมูล + ยอดสต็อกรวม)
// ==========================================
app.get('/products', async (req, res) => {
  try {
    // ใช้ ::int เพื่อบังคับให้ผลรวมออกมาเป็นตัวเลขชัวร์ๆ
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
      GROUP BY v.product_id, v.product_name, v.category_name, v.supplier_name, v.price, v.image_url
      ORDER BY v.product_id ASC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ==========================================
// API สำหรับลบสินค้า (DELETE)
// ==========================================
app.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // ระบบจะไปลบใน products และ DB จะลบใน stock_levels ให้อัตโนมัติ (เพราะ CASCADE)
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ success: true, message: 'ลบสินค้าสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ==========================================
// API เพิ่มสินค้าใหม่ (Create)
// ==========================================
app.post('/products', async (req, res) => {
  try {
    const { name, category_id, supplier_id, price, image_url } = req.body;
    await pool.query(
      `INSERT INTO products (name, category_id, supplier_id, price, image_url) 
       VALUES ($1, $2, $3, $4, $5)`,
      [name, category_id, supplier_id, price, image_url]
    );
    res.json({ success: true, message: 'เพิ่มสินค้าสำเร็จ' });
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// ==========================================
// API แก้ไขสินค้า (Update)
// ==========================================
app.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, supplier_id, price, image_url } = req.body;
    await pool.query(
      `UPDATE products SET name = $1, category_id = $2, supplier_id = $3, price = $4, image_url = $5 
       WHERE id = $6`,
      [name, category_id, supplier_id, price, image_url, id]
    );
    res.json({ success: true, message: 'อัปเดตสินค้าสำเร็จ' });
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// ==========================================
// API สำหรับดึงข้อมูล Categories (พร้อมนับจำนวนสินค้า)
// ==========================================
app.get('/categories', async (req, res) => {
  try {
    // ใช้ LEFT JOIN ไปหาตาราง products แล้วนับจำนวน (COUNT)
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
  } catch (err) { res.status(500).send('Server error'); }
});

// ==========================================
// API สำหรับ เพิ่ม/แก้ไข/ลบ Categories
// ==========================================

// 1. เพิ่มหมวดหมู่ใหม่ (POST)
app.post('/categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2)',
      [name, description]
    );
    res.json({ success: true, message: 'เพิ่มหมวดหมู่สำเร็จ' });
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// 2. แก้ไขหมวดหมู่ (PUT)
app.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    await pool.query(
      'UPDATE categories SET name = $1, description = $2 WHERE id = $3',
      [name, description, id]
    );
    res.json({ success: true, message: 'อัปเดตหมวดหมู่สำเร็จ' });
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// 3. ลบหมวดหมู่ (DELETE)
app.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ success: true, message: 'ลบหมวดหมู่สำเร็จ' });
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// ==========================================
// API สำหรับดึงข้อมูล Suppliers (พร้อมนับจำนวนสินค้า)
// ==========================================
app.get('/suppliers', async (req, res) => {
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
  } catch (err) { res.status(500).send('Server error'); }
});

// ==========================================
// API สำหรับหน้า Suppliers (จัดการซัพพลายเออร์)
// ==========================================

// 1. ดึงข้อมูล Suppliers (พร้อมนับจำนวนสินค้า)
app.get('/suppliers', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id, s.name, s.contact_person, s.email, s.phone, s.location, s.status,
        COUNT(p.id)::int AS product_count 
      FROM suppliers s
      LEFT JOIN products p ON s.id = p.supplier_id
      GROUP BY s.id
      ORDER BY s.id ASC
    `);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// 2. เพิ่ม Supplier ใหม่
app.post('/suppliers', async (req, res) => {
  try {
    const { name, contact_person, email, phone, location, status } = req.body;
    await pool.query(
      'INSERT INTO suppliers (name, contact_person, email, phone, location, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [name, contact_person, email, phone, location, status || 'Active']
    );
    res.json({ success: true, message: 'เพิ่มซัพพลายเออร์สำเร็จ' });
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// 3. แก้ไข Supplier
app.put('/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, email, phone, location, status } = req.body;
    await pool.query(
      'UPDATE suppliers SET name=$1, contact_person=$2, email=$3, phone=$4, location=$5, status=$6 WHERE id=$7',
      [name, contact_person, email, phone, location, status, id]
    );
    res.json({ success: true, message: 'อัปเดตซัพพลายเออร์สำเร็จ' });
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// 4. ลบ Supplier
app.delete('/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM suppliers WHERE id = $1', [id]);
    res.json({ success: true, message: 'ลบซัพพลายเออร์สำเร็จ' });
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// ==========================================
// API สำหรับหน้า Warehouses (คำนวณเปอร์เซ็นต์อัตโนมัติ!)
// ==========================================

// 1. ดึงข้อมูล (รวมยอดสต็อกปัจจุบัน และคำนวณ Capacity %)
app.get('/warehouses', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        w.id, w.name, w.location, w.address, w.manager_name, w.status, w.max_capacity,
        COALESCE(SUM(sl.current_stock), 0)::int AS total_current_stock,
        -- 🚨 ไฮไลท์: คำนวณเปอร์เซ็นต์ (สต็อกรวม / ความจุสูงสุด) * 100
        CASE 
          WHEN w.max_capacity > 0 THEN ROUND((COALESCE(SUM(sl.current_stock), 0) * 100.0 / w.max_capacity), 2)
          ELSE 0 
        END AS capacity_percentage
      FROM warehouses w
      LEFT JOIN stock_levels sl ON w.id = sl.warehouse_id
      GROUP BY w.id
      ORDER BY w.id ASC
    `);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// 2. เพิ่มคลังสินค้าใหม่ (เปลี่ยนไปรับค่า max_capacity แทน)
app.post('/warehouses', async (req, res) => {
  try {
    const { name, location, address, manager_name, max_capacity, status } = req.body;
    await pool.query(
      'INSERT INTO warehouses (name, location, address, manager_name, max_capacity, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [name, location, address, manager_name, max_capacity || 1000, status || 'Active']
    );
    res.json({ success: true, message: 'เพิ่มคลังสินค้าสำเร็จ' });
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// 3. แก้ไขคลังสินค้า
app.put('/warehouses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, address, manager_name, max_capacity, status } = req.body;
    await pool.query(
      'UPDATE warehouses SET name=$1, location=$2, address=$3, manager_name=$4, max_capacity=$5, status=$6 WHERE id=$7',
      [name, location, address, manager_name, max_capacity, status, id]
    );
    res.json({ success: true, message: 'อัปเดตคลังสินค้าสำเร็จ' });
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// 4. ลบคลังสินค้า
app.delete('/warehouses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM warehouses WHERE id = $1', [id]);
    res.json({ success: true, message: 'ลบคลังสินค้าสำเร็จ' });
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});
// ==========================================
// API สำหรับหน้า Stock Levels (จัดการรับของเข้าคลัง)
// ==========================================

// 1. ดึงข้อมูลสต็อกทั้งหมด
app.get('/stock-levels', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        sl.id, sl.product_id, sl.warehouse_id, sl.current_stock,
        p.name AS product_name,
        w.name AS warehouse_name
      FROM stock_levels sl
      JOIN products p ON sl.product_id = p.id
      JOIN warehouses w ON sl.warehouse_id = w.id
      ORDER BY sl.id ASC
    `);
    res.json(result.rows);
  } catch (err) { 
    // 💡 ตรงนี้แหละครับที่มันจะฟ้องว่า Error อะไร
    console.error("Database Error:", err); 
    res.status(500).send('Server error'); 
  }
});

// 2. รับของเข้า / ปรับปรุงสต็อก (Upsert Logic)
// 2. รับของเข้า / ปรับปรุงสต็อก (Upsert Logic)
app.post('/stock-levels', async (req, res) => {
  try {
    const { product_id, warehouse_id, quantity } = req.body;
    
    // เช็คว่าเคยมีสินค้านี้ในโกดังนี้หรือยัง?
    const check = await pool.query(
      'SELECT id FROM stock_levels WHERE product_id = $1 AND warehouse_id = $2',
      [product_id, warehouse_id]
    );

    if (check.rows.length > 0) {
      // 🚨 แก้ตรงนี้: ลบ last_updated ออก เพราะ DB เราไม่มีคอลัมน์นี้
      await pool.query(
        'UPDATE stock_levels SET current_stock = $1 WHERE id = $2',
        [quantity, check.rows[0].id]
      );
    } else {
      // ถ้ายังไม่มี -> เพิ่มแถวใหม่
      await pool.query(
        'INSERT INTO stock_levels (product_id, warehouse_id, current_stock) VALUES ($1, $2, $3)',
        [product_id, warehouse_id, quantity]
      );
    }
    res.json({ success: true, message: 'อัปเดตสต็อกสำเร็จ' });
  } catch (err) { 
    console.error("Stock Update Error:", err); 
    res.status(500).send('Server error'); 
  }
});

// 3. ลบข้อมูลสต็อก (เอาสินค้านั้นออกจากโกดังนี้ไปเลย)
app.delete('/stock-levels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM stock_levels WHERE id = $1', [id]);
    res.json({ success: true, message: 'ลบข้อมูลสต็อกสำเร็จ' });
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// ==========================================
// API สำหรับหน้า Orders (จัดการคำสั่งซื้อ)
// ==========================================

// 1. ดึงข้อมูลออร์เดอร์ทั้งหมด (เรียงจากวันที่สั่งล่าสุด)
app.get('/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY order_date DESC');
    res.json(result.rows);
  } catch (err) { console.error("Orders Error:", err); res.status(500).send('Server error'); }
});

// 2. อัปเดตสถานะออร์เดอร์ (เช่น เปลี่ยนจาก Pending เป็น Shipped)
app.put('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true, message: 'อัปเดตสถานะสำเร็จ' });
  } catch (err) { console.error("Update Status Error:", err); res.status(500).send('Server error'); }
});

// 3. ลบออร์เดอร์ (ยกเลิก/ลบข้อมูล)
app.delete('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    res.json({ success: true, message: 'ลบคำสั่งซื้อสำเร็จ' });
  } catch (err) { console.error("Delete Order Error:", err); res.status(500).send('Server error'); }
});


// ==========================================
// API สำหรับหน้า Shipments (จัดการการจัดส่ง)
// ==========================================

// 1. ดึงข้อมูลการจัดส่งทั้งหมด (พร้อมดึงชื่อลูกค้าจากตาราง orders มาโชว์)
app.get('/shipments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id, s.order_id, s.tracking_number, s.carrier_name, 
        s.shipping_date, s.estimated_delivery_date, s.status,
        o.customer_name 
      FROM shipments s
      LEFT JOIN orders o ON s.order_id = o.id
      ORDER BY s.id DESC
    `);
    res.json(result.rows);
  } catch (err) { console.error("Shipments Error:", err); res.status(500).send('Server error'); }
});

// 2. สร้างรายการจัดส่งใหม่
app.post('/shipments', async (req, res) => {
  try {
    const { order_id, tracking_number, carrier_name, shipping_date, estimated_delivery_date, status } = req.body;
    await pool.query(
      `INSERT INTO shipments 
      (order_id, tracking_number, carrier_name, shipping_date, estimated_delivery_date, status) 
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [order_id, tracking_number, carrier_name, shipping_date, estimated_delivery_date, status || 'In Transit']
    );
    res.json({ success: true, message: 'สร้างรายการจัดส่งสำเร็จ' });
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// 3. อัปเดตข้อมูลการจัดส่ง (เช่น อัปเดตสถานะ หรือ เลขพัสดุ)
app.put('/shipments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tracking_number, carrier_name, shipping_date, estimated_delivery_date, status } = req.body;
    await pool.query(
      `UPDATE shipments 
       SET tracking_number=$1, carrier_name=$2, shipping_date=$3, estimated_delivery_date=$4, status=$5 
       WHERE id=$6`,
      [tracking_number, carrier_name, shipping_date, estimated_delivery_date, status, id]
    );
    res.json({ success: true, message: 'อัปเดตการจัดส่งสำเร็จ' });
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// 4. ลบรายการจัดส่ง
app.delete('/shipments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM shipments WHERE id = $1', [id]);
    res.json({ success: true, message: 'ลบรายการจัดส่งสำเร็จ' });
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// ==========================================
// อันนี้ไม่เกี่ยวอย่าวางโค้ดหลังจากนี้ ให้วางข้างบนอันนี้นะ ไม่งั้นมันจะไม่ทำงาน
// ==========================================
app.listen(3000, () => {
  console.log('Server running on port 3000');
});