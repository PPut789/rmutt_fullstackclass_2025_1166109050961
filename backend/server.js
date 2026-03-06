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

app.listen(3000, () => {
  console.log('Server running on port 3000');
});