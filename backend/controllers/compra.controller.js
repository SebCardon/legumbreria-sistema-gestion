const pool = require('../db');
const { DIAS_RETENCION } = require('../config/retencion');

const ID_ESTADO_ACTIVO = 1;
const ID_ESTADO_INACTIVO = 2;

const getCompras = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM compra WHERE id_estado != ?', [ID_ESTADO_INACTIVO]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const getComprasCanceladas = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT c.*,
                    GREATEST(? - DATEDIFF(NOW(), c.fecha_cancelacion), 0) AS dias_restantes
             FROM compra c
             WHERE c.id_estado = ?`,
            [DIAS_RETENCION, ID_ESTADO_INACTIVO]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const getCompraById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM compra WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Compra no encontrada' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const createCompra = async (req, res) => {
    try {
        const { id_proveedor, id_transporte, fecha, total_compra, descripcion } = req.body;
        const [result] = await pool.query(
            `INSERT INTO compra (id_proveedor, id_transporte, fecha, total_compra, descripcion)
             VALUES (?, ?, ?, ?, ?)`,
            [id_proveedor, id_transporte, fecha, total_compra, descripcion]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const updateCompra = async (req, res) => {
    try {
        const { id_proveedor, id_transporte, fecha, total_compra, descripcion } = req.body;
        const [result] = await pool.query(
            `UPDATE compra SET id_proveedor=?, id_transporte=?, fecha=?, total_compra=?, descripcion=?
             WHERE id=?`,
            [id_proveedor, id_transporte, fecha, total_compra, descripcion, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Compra no encontrada' });
        res.json({ mensaje: 'Compra actualizada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const desactivarCompra = async (req, res) => {
    try {
        const [result] = await pool.query(
            'UPDATE compra SET id_estado = ?, fecha_cancelacion = NOW() WHERE id = ?',
            [ID_ESTADO_INACTIVO, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Compra no encontrada' });
        res.json({ mensaje: 'Compra cancelada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const reactivarCompra = async (req, res) => {
    try {
        const [result] = await pool.query(
            'UPDATE compra SET id_estado = ?, fecha_cancelacion = NULL WHERE id = ?',
            [ID_ESTADO_ACTIVO, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Compra no encontrada' });
        res.json({ mensaje: 'Compra reactivada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getCompras, getComprasCanceladas, getCompraById,
    createCompra, updateCompra, desactivarCompra, reactivarCompra
};