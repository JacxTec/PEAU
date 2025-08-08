require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Importar rutas
const productosRoutes = require('./routes/productos');
const proveedoresRoutes = require('./routes/proveedores');
const clientesRoutes = require('./routes/clientes');
const importacionesRoutes = require('./routes/importaciones');
const cotizacionesRoutes = require('./routes/cotizaciones');
const categoriasRoutes = require('./routes/categorias');
const ordenesCompraRoutes = require('./routes/ordenesCompra'); 

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Usar rutas
app.use('/api/productos', productosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/importaciones', importacionesRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/ordenes-compra', ordenesCompraRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
