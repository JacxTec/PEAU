const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

router.get('/', async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute('SELECT * FROM proveedores');
    conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener proveedores:', err);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
});

router.post('/guardar', async (req, res) => {
  const { nombre, direccion, telefono, rfc, imagen } = req.body;
  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute(
      'INSERT INTO proveedores (nombre, direccion, telefono, rfc, imagen) VALUES (?, ?, ?, ?, ?)',
      [nombre, direccion, telefono, rfc, imagen]
    );
    conn.end();
    res.json({ mensaje: 'Proveedor guardado' });
  } catch (err) {
    console.error('Error al guardar proveedor:', err);
    res.status(500).json({ error: 'Error al guardar proveedor' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, direccion, telefono, rfc, imagen } = req.body;
  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute(
      'UPDATE proveedores SET nombre = ?, direccion = ?, telefono = ?, rfc = ?, imagen = ? WHERE id = ?',
      [nombre, direccion, telefono, rfc, imagen, id]
    );
    conn.end();
    res.json({ mensaje: 'Proveedor actualizado' });
  } catch (err) {
    console.error('Error al actualizar proveedor:', err);
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute('DELETE FROM proveedores WHERE id = ?', [id]);
    conn.end();
    res.json({ mensaje: 'Proveedor eliminado' });
  } catch (err) {
    console.error('Error al eliminar proveedor:', err);
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
});

module.exports = router;