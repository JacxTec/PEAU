// routes/categorias.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Obtener todas las categorías
router.get('/', async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute('SELECT * FROM categorias ORDER BY nombre');
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener categorías:', err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// Registrar una nueva categoría
router.post('/guardar', async (req, res) => {
  const { nombre } = req.body;
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  try {
    const conn = await mysql.createConnection(dbConfig);
    const [result] = await conn.execute('INSERT INTO categorias (nombre) VALUES (?)', [nombre]);
    const insertedId = result.insertId;
    await conn.end();
    res.json({ id: insertedId, nombre }); // ✅ Ahora devuelve el id insertado
  } catch (err) {
    console.error('Error al guardar categoría:', err);
    res.status(500).json({ error: 'Error al guardar categoría' });
  }
});

module.exports = router;
