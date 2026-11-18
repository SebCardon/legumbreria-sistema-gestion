const pool = require('../db');
const { validarCabecera, prepararLineas, calcularPagoInicial, manejarError } = require('../utils/documentos');
const { DIAS_RETENCION } = require('../config/retencion');

const ID_ESTADO_ACTIVO = 1;
const ID_ESTADO_INACTIVO = 2;

const getFacturas = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM factura WHERE id_estado != ?', [ID_ESTADO_INACTIVO]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Canceladas, con los días que faltan para su eliminación automática
const getFacturasCanceladas = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT f.*,
                    GREATEST(? - DATEDIFF(NOW(), f.fecha_cancelacion), 0) AS dias_restantes,
                    EXISTS(SELECT 1 FROM abono a WHERE a.id_factura = f.id) AS tiene_abonos
             FROM factura f
             WHERE f.id_estado = ?`,
            [DIAS_RETENCION, ID_ESTADO_INACTIVO]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const getFacturaById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM factura WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Factura no encontrada' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const createFactura = async (req, res) => {
    try {
        const { id_persona_cliente, fecha, total_pagar, descripcion, id_estado } = req.body;
        const [result] = await pool.query(
            `INSERT INTO factura (id_persona_cliente, fecha, total_pagar, descripcion, id_estado)
             VALUES (?, ?, ?, ?, ?)`,
            [id_persona_cliente, fecha, total_pagar, descripcion, id_estado ?? ID_ESTADO_ACTIVO]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const updateFactura = async (req, res) => {
    try {
        const { id_persona_cliente, fecha, total_pagar, descripcion, id_estado } = req.body;
        const [result] = await pool.query(
            `UPDATE factura SET id_persona_cliente=?, fecha=?, total_pagar=?, descripcion=?, id_estado=?
             WHERE id=?`,
            [id_persona_cliente, fecha, total_pagar, descripcion, id_estado, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Factura no encontrada' });
        res.json({ mensaje: 'Factura actualizada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const desactivarFactura = async (req, res) => {
    try {
        const [result] = await pool.query(
            'UPDATE factura SET id_estado = ?, fecha_cancelacion = NOW() WHERE id = ?',
            [ID_ESTADO_INACTIVO, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Factura no encontrada' });
        res.json({ mensaje: 'Factura cancelada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const reactivarFactura = async (req, res) => {
    try {
        const [result] = await pool.query(
            'UPDATE factura SET id_estado = ?, fecha_cancelacion = NULL WHERE id = ?',
            [ID_ESTADO_ACTIVO, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Factura no encontrada' });
        res.json({ mensaje: 'Factura reactivada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Factura completa en UNA transacción: cabecera + productos + (opcional) pago inicial.
// O se guarda todo, o no se guarda nada.
const createFacturaCompleta = async (req, res) => {
    const { id_persona_cliente, fecha, descripcion, pago_completo, abono, lineas } = req.body;

    if (!(Number(id_persona_cliente) > 0)) {
        return res.status(400).json({ error: 'Selecciona un cliente.' });
    }
    const errorCabecera = validarCabecera({ fecha, descripcion });
    if (errorCabecera) return res.status(400).json({ error: errorCabecera });

    const preparado = prepararLineas(lineas);
    if (preparado.error) return res.status(400).json({ error: preparado.error });

    // Pago recibido al crear la factura: todo (de contado) o un abono parcial
    const pago = calcularPagoInicial(pago_completo, abono, preparado.total);
    if (pago.error) return res.status(400).json({ error: pago.error });

    const conexion = await pool.getConnection();
    try {
        await conexion.beginTransaction();

        const [factura] = await conexion.query(
            `INSERT INTO factura (id_persona_cliente, fecha, total_pagar, descripcion, id_estado)
             VALUES (?, ?, ?, ?, ?)`,
            [id_persona_cliente, fecha, preparado.total, descripcion || null, ID_ESTADO_ACTIVO]
        );
        const idFactura = factura.insertId;

        for (const l of preparado.lineas) {
            await conexion.query(
                `INSERT INTO productos_x_factura (id_factura, id_producto, id_presentacion, peso_total_kg, precio_por_kg, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [idFactura, l.id_producto, l.id_presentacion, l.peso, l.precio, l.subtotal]
            );
        }

        if (pago.valor > 0) {
            await conexion.query(
                `INSERT INTO abono (id_persona_cliente, id_factura, fecha, valor, descripcion)
                 VALUES (?, ?, ?, ?, ?)`,
                [id_persona_cliente, idFactura, fecha, pago.valor, pago.valor === preparado.total ? 'Pago de contado' : 'Abono inicial']
            );
        }

        await conexion.commit();

        res.status(201).json({
            id: idFactura,
            id_persona_cliente: Number(id_persona_cliente),
            fecha,
            descripcion: descripcion || '',
            total_pagar: preparado.total,
            total_abonado: pago.valor
        });
    } catch (error) {
        await conexion.rollback().catch(() => {});
        manejarError(res, error);
    } finally {
        conexion.release();
    }
};

module.exports = {
    getFacturas, getFacturasCanceladas, getFacturaById,
    createFactura, createFacturaCompleta, updateFactura, desactivarFactura, reactivarFactura
};