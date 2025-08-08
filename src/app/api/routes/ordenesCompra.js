const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// Obtener todas las órdenes de compra con datos del cliente
router.get('/', async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [ordenes] = await conn.execute(`
      SELECT o.*, c.nombre AS cliente_nombre
      FROM ordenes_compra o
      LEFT JOIN clientes c ON o.cliente_id = c.id
      ORDER BY o.fecha DESC
    `);
    await conn.end();
    res.json(ordenes);
  } catch (err) {
    console.error('Error al obtener órdenes de compra:', err);
    res.status(500).json({ error: 'Error al obtener órdenes de compra' });
  }
});

// Registrar nueva orden de compra
router.post('/', async (req, res) => {
  const { folio, cotizacion_id, cliente_id, fecha, productos, total } = req.body;

  try {
    const conn = await mysql.createConnection(dbConfig);

    // Insertar orden
    const [result] = await conn.execute(`
      INSERT INTO ordenes_compra (folio, cotizacion_id, cliente_id, fecha, total)
      VALUES (?, ?, ?, ?, ?)
    `, [folio, cotizacion_id, cliente_id, fecha, total]);

    const ordenId = result.insertId;

    // Insertar productos de la orden
    for (const p of productos) {
      await conn.execute(`
        INSERT INTO ordenes_productos (orden_id, producto_id, cantidad, precio_unitario)
        VALUES (?, ?, ?, ?)
      `, [ordenId, p.producto_id, p.cantidad, p.precio_unitario]);

      // Descontar del inventario
      await conn.execute(`
        UPDATE productos SET stock = stock - ? WHERE id = ?
      `, [p.cantidad, p.producto_id]);
    }

    await conn.end();
    res.json({ mensaje: 'Orden registrada exitosamente', ordenId });
  } catch (err) {
    console.error('Error al registrar orden de compra:', err);
    res.status(500).json({ error: 'Error al registrar orden de compra' });
  }
});

// Eliminar una orden de compra (opcional)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const conn = await mysql.createConnection(dbConfig);

    // Recuperar productos para regresar al stock
    const [productos] = await conn.execute(`
      SELECT producto_id, cantidad FROM ordenes_productos WHERE orden_id = ?
    `, [id]);

    for (const p of productos) {
      await conn.execute(`
        UPDATE productos SET stock = stock + ? WHERE id = ?
      `, [p.cantidad, p.producto_id]);
    }

    // Eliminar productos asociados y luego la orden
    await conn.execute('DELETE FROM ordenes_productos WHERE orden_id = ?', [id]);
    await conn.execute('DELETE FROM ordenes_compra WHERE id = ?', [id]);

    await conn.end();
    res.json({ mensaje: 'Orden eliminada y stock restaurado' });
  } catch (err) {
    console.error('Error al eliminar orden:', err);
    res.status(500).json({ error: 'Error al eliminar orden de compra' });
  }
});

module.exports = router;
