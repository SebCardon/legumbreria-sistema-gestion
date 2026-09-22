const pool = require('../db');

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
            'UPDATE factura SET id_estado = ? WHERE id = ?',
            [ID_ESTADO_INACTIVO, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Factura no encontrada' });
        res.json({ mensaje: 'Factura anulada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const getFacturasCanceladas = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM factura WHERE id_estado = ?', [ID_ESTADO_INACTIVO]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getFacturas, getFacturaById, createFactura, updateFactura, desactivarFactura, getFacturasCanceladas };