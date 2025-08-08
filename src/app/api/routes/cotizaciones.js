const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const PDFDocument = require('pdfkit');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// 🔹 Generar folio automáticamente
async function generarFolio(connection) {
  const [rows] = await connection.query(`SELECT folio FROM cotizaciones ORDER BY id DESC LIMIT 1`);
  if (rows.length === 0) return 'COT-0001';
  const ultimoFolio = rows[0].folio;
  const numero = parseInt(ultimoFolio.replace('COT-', '')) + 1;
  return `COT-${numero.toString().padStart(4, '0')}`;
}

// 🔹 Obtener cotizaciones con adeudo
router.get('/adeudos', async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [cotizaciones] = await connection.query(`
      SELECT c.id, c.folio, cl.nombre AS cliente, c.fecha
      FROM cotizaciones c
      JOIN clientes cl ON c.cliente_id = cl.id
      ORDER BY c.fecha DESC
    `);

    const resultado = [];
    for (let cot of cotizaciones) {
      const [productos] = await connection.query(`
        SELECT p.precio, cp.cantidad
        FROM cotizacion_productos cp
        JOIN productos p ON cp.producto_id = p.id
        WHERE cp.cotizacion_id = ?
      `, [cot.id]);

      const total = productos.reduce((sum, p) => sum + parseFloat(p.precio) * parseFloat(p.cantidad), 0);

      const [pagos] = await connection.query(`
        SELECT SUM(monto) AS totalPagado
        FROM pagos
        WHERE cotizacion_id = ?
      `, [cot.id]);

      const pagado = parseFloat(pagos[0].totalPagado || 0);
      const adeudo = total - pagado;

      if (adeudo > 0) {
        resultado.push({
          ...cot,
          total,
          pagado,
          adeudo,
          estado: 'Pendiente'
        });
      }
    }

    res.json(resultado);
  } catch (err) {
    console.error('Error al obtener adeudos:', err);
    res.status(500).json({ error: 'Error al obtener adeudos' });
  } finally {
    connection.end();
  }
});

// 🔹 Obtener todas las cotizaciones
router.get('/', async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [cotizaciones] = await connection.query(`
      SELECT c.id, c.folio, cl.nombre AS cliente, c.fecha
      FROM cotizaciones c
      JOIN clientes cl ON c.cliente_id = cl.id
      ORDER BY c.fecha DESC
    `);

    for (let cot of cotizaciones) {
      const [productos] = await connection.query(`
        SELECT p.nombre, cp.cantidad, p.precio
        FROM cotizacion_productos cp
        JOIN productos p ON cp.producto_id = p.id
        WHERE cp.cotizacion_id = ?
      `, [cot.id]);

      cot.productos = productos;

      const total = productos.reduce((sum, p) => sum + parseFloat(p.precio) * parseFloat(p.cantidad), 0);
      const [pagos] = await connection.query(`
        SELECT SUM(monto) AS totalPagado
        FROM pagos
        WHERE cotizacion_id = ?
      `, [cot.id]);

      const pagado = parseFloat(pagos[0].totalPagado || 0);
      const adeudo = total - pagado;

      cot.total = total;
      cot.pagado = pagado;
      cot.adeudo = adeudo;
      cot.estado = adeudo <= 0 ? 'Pagado' : 'Pendiente';
    }

    res.json(cotizaciones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener cotizaciones' });
  } finally {
    connection.end();
  }
});

// 🔹 Registrar cotización
router.post('/', async (req, res) => {
  const { cliente, fecha, productos, abono = 0 } = req.body;
  const connection = await mysql.createConnection(dbConfig);
  try {
    await connection.beginTransaction();

    let [rows] = await connection.query(`SELECT id FROM clientes WHERE nombre = ?`, [cliente]);
    let clienteId;
    if (rows.length > 0) {
      clienteId = rows[0].id;
    } else {
      const [result] = await connection.query(`INSERT INTO clientes (nombre) VALUES (?)`, [cliente]);
      clienteId = result.insertId;
    }

    const folio = await generarFolio(connection);

    let total = 0;
    for (const prod of productos) {
      const [result] = await connection.query(`SELECT precio, cantidad FROM productos WHERE id = ?`, [prod.id]);
      const precio = parseFloat(result[0]?.precio || 0);
      const stock = parseFloat(result[0]?.cantidad || 0);
      if (stock < prod.cantidad) {
        await connection.rollback();
        return res.status(400).json({ error: `No hay suficiente stock para el producto ID ${prod.id}` });
      }
      total += precio * prod.cantidad;
    }

    const [cotizacionResult] = await connection.query(`
      INSERT INTO cotizaciones (cliente_id, fecha, total, folio) VALUES (?, ?, ?, ?)
    `, [clienteId, fecha, total, folio]);

    const cotizacionId = cotizacionResult.insertId;

    for (const prod of productos) {
      await connection.query(`
        INSERT INTO cotizacion_productos (cotizacion_id, producto_id, cantidad)
        VALUES (?, ?, ?)
      `, [cotizacionId, prod.id, prod.cantidad]);

      await connection.query(`UPDATE productos SET cantidad = cantidad - ? WHERE id = ?`, [prod.cantidad, prod.id]);
    }

    if (abono > 0) {
      await connection.query(`INSERT INTO pagos (cotizacion_id, monto) VALUES (?, ?)`, [cotizacionId, abono]);
    }

    await connection.commit();
    res.status(201).json({ mensaje: 'Cotización registrada correctamente', folio });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al registrar cotización' });
  } finally {
    connection.end();
  }
});

// 🔹 Registrar abono
router.post('/compras/pagar', async (req, res) => {
  const { folio, monto } = req.body;
  if (!folio || !monto || monto <= 0) {
    return res.status(400).json({ error: 'Folio y monto válidos son requeridos' });
  }

  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.query(`SELECT id FROM cotizaciones WHERE folio = ?`, [folio]);
    if (rows.length === 0) return res.status(404).json({ error: 'Cotización no encontrada' });

    const cotizacionId = rows[0].id;
    await connection.query(`INSERT INTO pagos (cotizacion_id, monto) VALUES (?, ?)`, [cotizacionId, monto]);

    res.json({ mensaje: 'Pago registrado correctamente' });
  } catch (err) {
    console.error('Error al registrar pago:', err);
    res.status(500).json({ error: 'Error al registrar el pago' });
  } finally {
    connection.end();
  }
});

// 🔹 Eliminar cotización
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  const connection = await mysql.createConnection(dbConfig);
  try {
    await connection.beginTransaction();

    const [productos] = await connection.query(`SELECT producto_id, cantidad FROM cotizacion_productos WHERE cotizacion_id = ?`, [id]);

    for (const prod of productos) {
      await connection.query(`UPDATE productos SET cantidad = cantidad + ? WHERE id = ?`, [prod.cantidad, prod.producto_id]);
    }

    await connection.query(`DELETE FROM pagos WHERE cotizacion_id = ?`, [id]);
    await connection.query(`DELETE FROM cotizacion_productos WHERE cotizacion_id = ?`, [id]);
    await connection.query(`DELETE FROM cotizaciones WHERE id = ?`, [id]);

    await connection.commit();
    res.json({ mensaje: 'Cotización eliminada correctamente' });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar cotización' });
  } finally {
    connection.end();
  }
});

// 🔹 Generar PDF de cotización
router.get('/:id/pdf', async (req, res) => {
  const cotizacionId = req.params.id;
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [cotizaciones] = await connection.query(`
      SELECT c.folio, c.fecha, cl.nombre AS cliente
      FROM cotizaciones c
      JOIN clientes cl ON c.cliente_id = cl.id
      WHERE c.id = ?
    `, [cotizacionId]);

    if (cotizaciones.length === 0) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    const cotizacion = cotizaciones[0];

    const [productos] = await connection.query(`
      SELECT p.nombre, cp.cantidad, p.precio
      FROM cotizacion_productos cp
      JOIN productos p ON cp.producto_id = p.id
      WHERE cp.cotizacion_id = ?
    `, [cotizacionId]);

    const total = productos.reduce((sum, p) => sum + parseFloat(p.precio) * parseFloat(p.cantidad), 0);

    const [pagos] = await connection.query(`
      SELECT SUM(monto) AS totalPagado
      FROM pagos
      WHERE cotizacion_id = ?
    `, [cotizacionId]);

    const pagado = parseFloat(pagos[0].totalPagado || 0);
    const adeudo = total - pagado;

    // 🔹 Generar PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="cotizacion-${cotizacion.folio}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).text('Cotización', { align: 'center' }).moveDown();
    doc.fontSize(12).text(`Folio: ${cotizacion.folio}`);
    doc.text(`Cliente: ${cotizacion.cliente}`);
    doc.text(`Fecha: ${new Date(cotizacion.fecha).toLocaleDateString()}`).moveDown();

    doc.text('Productos:', { underline: true });
    productos.forEach((p, i) => {
      const precio = parseFloat(p.precio);
      const cantidad = parseFloat(p.cantidad);
      const subtotal = precio * cantidad;
      doc.text(`${i + 1}. ${p.nombre} - ${cantidad} x $${precio.toFixed(2)} = $${subtotal.toFixed(2)}`);
    });

    doc.moveDown();
    doc.text(`Total: $${total.toFixed(2)}`);
    doc.text(`Abonado: $${pagado.toFixed(2)}`);
    doc.text(`Adeudo: $${adeudo.toFixed(2)}`).moveDown();
    doc.text('Gracias por su preferencia.', { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('Error al generar PDF:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al generar PDF de la cotización' });
    }
  } finally {
    connection.end();
  }
});

module.exports = router;
