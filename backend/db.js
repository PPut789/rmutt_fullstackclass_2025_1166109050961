const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'Admin123', // ใส่ password postgres ของคุณ
  database: 'inventory_db'
});

module.exports = pool;