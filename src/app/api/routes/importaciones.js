const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// Obtener todas las importaciones con nombre del proveedor
router.get('/', async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(`
      SELECT i.*, p.nombre AS proveedor_nombre
      FROM importaciones i
      LEFT JOIN proveedores p ON i.proveedor_id = p.id
      ORDER BY i.fecha DESC
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener importaciones:', err);
    res.status(500).json({ error: 'Error al obtener importaciones' });
  }
});

// Registrar nueva importación
router.post('/', async (req, res) => {
  const { producto, proveedor_id, cantidad, fecha, descripcion } = req.body;

  try {
    const conn = await mysql.createConnection(dbConfig);
    const [result] = await conn.execute(`
      INSERT INTO importaciones (producto, proveedor_id, cantidad, fecha, descripcion)
      VALUES (?, ?, ?, ?, ?)
    `, [producto, proveedor_id, cantidad, fecha, descripcion]);

    const [nueva] = await conn.execute(`
      SELECT i.*, p.nombre AS proveedor_nombre
      FROM importaciones i
      LEFT JOIN proveedores p ON i.proveedor_id = p.id
      WHERE i.id = ?
    `, [result.insertId]);

    await conn.end();
    res.json(nueva[0]);
  } catch (err) {
    console.error('Error al registrar importación:', err);
    res.status(500).json({ error: 'Error al registrar importación' });
  }
});

// Actualizar importación existente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { producto, proveedor_id, cantidad, fecha, descripcion } = req.body;

  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute(`
      UPDATE importaciones
      SET producto = ?, proveedor_id = ?, cantidad = ?, fecha = ?, descripcion = ?
      WHERE id = ?
    `, [producto, proveedor_id, cantidad, fecha, descripcion, id]);

    const [actualizada] = await conn.execute(`
      SELECT i.*, p.nombre AS proveedor_nombre
      FROM importaciones i
      LEFT JOIN proveedores p ON i.proveedor_id = p.id
      WHERE i.id = ?
    `, [id]);

    await conn.end();
    res.json(actualizada[0]);
  } catch (err) {
    console.error('Error al actualizar importación:', err);
    res.status(500).json({ error: 'Error al actualizar importación' });
  }
});

// Eliminar importación
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute('DELETE FROM importaciones WHERE id = ?', [id]);
    await conn.end();
    res.json({ mensaje: 'Importación eliminada correctamente' });
  } catch (err) {
    console.error('Error al eliminar importación:', err);
    res.status(500).json({ error: 'Error al eliminar importación' });
  }
});

module.exports = router;
