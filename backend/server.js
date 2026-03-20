const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');
const dashboardRoutes = require('./routes/dashboard');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const supplierRoutes = require('./routes/suppliers');
const warehouseRoutes = require('./routes/warehouses');
const stockLevelRoutes = require('./routes/stockLevels');
const orderRoutes = require('./routes/orders');
const shipmentRoutes = require('./routes/shipments');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/', authRoutes);
app.use('/', searchRoutes);
app.use('/', dashboardRoutes);
app.use('/', productRoutes);
app.use('/', categoryRoutes);
app.use('/', supplierRoutes);
app.use('/', warehouseRoutes);
app.use('/', stockLevelRoutes);
app.use('/', orderRoutes);
app.use('/', shipmentRoutes);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});