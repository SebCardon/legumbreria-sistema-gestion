const pool = require('../db');

const getCompras = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM compra');
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

const deleteCompra = async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM compra WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Compra no encontrada' });
        res.json({ mensaje: 'Compra eliminada correctamente' });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ error: 'No se puede eliminar: la compra tiene productos asociados' });
        }
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getCompras, getCompraById, createCompra, updateCompra, deleteCompra };