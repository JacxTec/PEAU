// routes/productos.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute('SELECT * FROM productos');
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Registrar un nuevo producto
router.post('/guardar', async (req, res) => {
  const {
    nombre, descripcion, marca, modelo,
    voltaje, potencia, corriente, precio,
    cantidad, imagen_base64, proveedor_id, categoria_id
  } = req.body;

  if (!categoria_id) {
    return res.status(400).json({ error: 'El campo categoria_id es obligatorio' });
  }

  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute(
      `INSERT INTO productos
      (nombre, descripcion, marca, modelo, voltaje, potencia, corriente, precio, cantidad, imagen_base64, categoria_id, proveedor_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, descripcion, marca, modelo, voltaje, potencia, corriente, precio, cantidad, imagen_base64, categoria_id, proveedor_id]
    );
    await conn.end();
    res.json({ mensaje: 'Producto registrado correctamente' });
  } catch (err) {
    console.error('Error al guardar producto:', err);
    res.status(500).json({ error: 'Error al guardar producto' });
  }
});

// Editar un producto existente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    nombre, descripcion, marca, modelo,
    voltaje, potencia, corriente, precio,
    cantidad, imagen_base64, proveedor_id, categoria_id
  } = req.body;

  if (!categoria_id) {
    return res.status(400).json({ error: 'El campo categoria_id es obligatorio' });
  }

  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute(
      `UPDATE productos SET
      nombre = ?, descripcion = ?, marca = ?, modelo = ?,
      voltaje = ?, potencia = ?, corriente = ?, precio = ?,
      cantidad = ?, imagen_base64 = ?, categoria_id = ?, proveedor_id = ?
      WHERE id = ?`,
      [nombre, descripcion, marca, modelo, voltaje, potencia, corriente, precio, cantidad, imagen_base64, categoria_id, proveedor_id, id]
    );
    await conn.end();
    res.json({ mensaje: 'Producto actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// Eliminar un producto
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.execute('DELETE FROM productos WHERE id = ?', [id]);
    await conn.end();
    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

module.exports = router;
