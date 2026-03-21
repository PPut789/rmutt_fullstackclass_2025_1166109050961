const express = require('express');
const router = express.Router();
const pool = require('../db');

// ดึงข้อมูลการจัดส่งทั้งหมด
router.get('/shipments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id, 
        s.order_id, 
        s.tracking_number, 
        s.carrier_name, 
        s.shipping_date, 
        s.estimated_delivery_date, 
        s.status,
        o.customer_name 
      FROM shipments s
      LEFT JOIN orders o ON s.order_id = o.id
      ORDER BY s.id DESC
    `);
    // เชื่อมกับตาราง stock_levels เพื่อคำนวณจำนวนสินค้าคงเหลือ โดยใช้ LEFT JOIN เพื่อให้แสดงคลังสินค้าที่ไม่มีรายการ stock_levels ด้วย LEFT JOIN จะดึงข้อมูลจากตารางทางซ้าย (warehouses) ทั้งหมด และถ้าไม่มีข้อมูลที่ตรงกันในตารางทางขวา (stock_levels) จะเติมค่า NULL ซึ่งจะถูกจัดการด้วย COALESCE เพื่อให้เป็น 0 แทน

    res.json(result.rows);
  } catch (err) {
    console.error('Shipments Error:', err);
    res.status(500).send('Server error');
  }
});

// สร้างรายการจัดส่งใหม่
router.post('/shipments', async (req, res) => {
  try {
    const {
      order_id,
      tracking_number,
      carrier_name,
      shipping_date,
      estimated_delivery_date,
      status
    } = req.body;

    await pool.query(
      `INSERT INTO shipments 
      (order_id, tracking_number, carrier_name, shipping_date, estimated_delivery_date, status) 
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        order_id,
        tracking_number,
        carrier_name,
        shipping_date,
        estimated_delivery_date,
        status || 'In Transit'
      ]
    );

    res.json({ success: true, message: 'สร้างรายการจัดส่งสำเร็จ' });
  } catch (err) {
    console.error('Create Shipment Error:', err);
    res.status(500).send('Server error');
  }
});

// อัปเดตข้อมูลการจัดส่ง
router.put('/shipments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tracking_number,
      carrier_name,
      shipping_date,
      estimated_delivery_date,
      status
    } = req.body;

    await pool.query(
      `UPDATE shipments 
       SET tracking_number = $1, carrier_name = $2, shipping_date = $3, estimated_delivery_date = $4, status = $5 
       WHERE id = $6`,
      [
        tracking_number,
        carrier_name,
        shipping_date,
        estimated_delivery_date,
        status,
        id
      ]
    );

    res.json({ success: true, message: 'อัปเดตการจัดส่งสำเร็จ' });
  } catch (err) {
    console.error('Update Shipment Error:', err);
    res.status(500).send('Server error');
  }
});

// ลบรายการจัดส่ง
router.delete('/shipments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM shipments WHERE id = $1', [id]);

    res.json({ success: true, message: 'ลบรายการจัดส่งสำเร็จ' });
  } catch (err) {
    console.error('Delete Shipment Error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;