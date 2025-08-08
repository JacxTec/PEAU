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
    const [rows] = await conn.execute('SELECT * FROM clientes');
    conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener clientes:', err);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

router.post('/guardar', async (req, res) => {
  const { nombre, email, telefono, direccion, imagen } = req.body;
  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute(
      'INSERT INTO clientes (nombre, email, telefono, direccion, imagen) VALUES (?, ?, ?, ?, ?)',
      [nombre, email, telefono, direccion, imagen]
    );
    conn.end();
    res.json({ mensaje: 'Cliente guardado' });
  } catch (err) {
    console.error('Error al guardar cliente:', err);
    res.status(500).json({ error: 'Error al guardar cliente' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, email, telefono, direccion, imagen } = req.body;
  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute(
      'UPDATE clientes SET nombre = ?, email = ?, telefono = ?, direccion = ?, imagen = ? WHERE id = ?',
      [nombre, email, telefono, direccion, imagen, id]
    );
    conn.end();
    res.json({ mensaje: 'Cliente actualizado' });
  } catch (err) {
    console.error('Error al actualizar cliente:', err);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute('DELETE FROM clientes WHERE id = ?', [id]);
    conn.end();
    res.json({ mensaje: 'Cliente eliminado' });
  } catch (err) {
    console.error('Error al eliminar cliente:', err);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

module.exports = router;