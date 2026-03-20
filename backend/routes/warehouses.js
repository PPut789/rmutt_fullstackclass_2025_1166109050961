const express = require('express');
const router = express.Router();
const pool = require('../db');

// ดึงข้อมูล Warehouses
router.get('/warehouses', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        w.id, 
        w.name, 
        w.location, 
        w.address, 
        w.manager_name, 
        w.status, 
        w.max_capacity,
        COALESCE(SUM(sl.current_stock), 0)::int AS total_current_stock,
        CASE 
          WHEN w.max_capacity > 0 
            THEN ROUND((COALESCE(SUM(sl.current_stock), 0) * 100.0 / w.max_capacity), 2)
          ELSE 0 
        END AS capacity_percentage
      FROM warehouses w
      LEFT JOIN stock_levels sl ON w.id = sl.warehouse_id 
      // เชื่อมกับตาราง stock_levels เพื่อคำนวณจำนวนสินค้าคงเหลือ โดยใช้ LEFT JOIN เพื่อให้แสดงคลังสินค้าที่ไม่มีรายการ stock_levels ด้วย LEFT JOIN จะดึงข้อมูลจากตารางทางซ้าย (warehouses) ทั้งหมด และถ้าไม่มีข้อมูลที่ตรงกันในตารางทางขวา (stock_levels) จะเติมค่า NULL ซึ่งจะถูกจัดการด้วย COALESCE เพื่อให้เป็น 0 แทน
      GROUP BY w.id
      ORDER BY w.id ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Get Warehouses Error:', err);
    res.status(500).send('Server error');
  }
});

// เพิ่มคลังสินค้าใหม่
router.post('/warehouses', async (req, res) => {
  try {
    const { name, location, address, manager_name, max_capacity, status } = req.body;

    await pool.query(
      `INSERT INTO warehouses (name, location, address, manager_name, max_capacity, status) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, location, address, manager_name, max_capacity || 1000, status || 'Active']
    );

    res.json({ success: true, message: 'เพิ่มคลังสินค้าสำเร็จ' });
  } catch (err) {
    console.error('Create Warehouse Error:', err);
    res.status(500).send('Server error'); // status(500) หมายถึงเกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ ซึ่งอาจเกิดจากปัญหาการเชื่อมต่อฐานข้อมูลหรือข้อผิดพลาดในการประมวลผลคำสั่ง SQL
  }
});

// แก้ไขคลังสินค้า
router.put('/warehouses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, address, manager_name, max_capacity, status } = req.body;

    await pool.query(
      `UPDATE warehouses 
       SET name = $1, location = $2, address = $3, manager_name = $4, max_capacity = $5, status = $6 
       WHERE id = $7`,
      [name, location, address, manager_name, max_capacity, status, id]
    );

    res.json({ success: true, message: 'อัปเดตคลังสินค้าสำเร็จ' });
  } catch (err) {
    console.error('Update Warehouse Error:', err);
    res.status(500).send('Server error');
  }
});

// ลบคลังสินค้า
router.delete('/warehouses/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM warehouses WHERE id = $1', [id]);

    res.json({ success: true, message: 'ลบคลังสินค้าสำเร็จ' });
  } catch (err) {
    console.error('Delete Warehouse Error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;