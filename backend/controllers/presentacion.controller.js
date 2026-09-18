const pool = require('../db');

const getPresentaciones = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM presentacion');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const getPresentacionById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM presentacion WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Presentación no encontrada' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const createPresentacion = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        const [result] = await pool.query(
            'INSERT INTO presentacion (nombre, descripcion) VALUES (?, ?)',
            [nombre, descripcion]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const updatePresentacion = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        const [result] = await pool.query(
            'UPDATE presentacion SET nombre=?, descripcion=? WHERE id=?',
            [nombre, descripcion, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Presentación no encontrada' });
        res.json({ mensaje: 'Presentación actualizada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const deletePresentacion = async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM presentacion WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Presentación no encontrada' });
        res.json({ mensaje: 'Presentación eliminada correctamente' });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ error: 'No se puede eliminar: la presentación está en uso' });
        }
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getPresentaciones, getPresentacionById, createPresentacion, updatePresentacion, deletePresentacion };