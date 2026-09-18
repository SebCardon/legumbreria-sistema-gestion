const pool = require('../db');

const getEstados = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM estado');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const getEstadoById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM estado WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Estado no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const createEstado = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        const [result] = await pool.query(
            'INSERT INTO estado (nombre, descripcion) VALUES (?, ?)',
            [nombre, descripcion]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const updateEstado = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        const [result] = await pool.query(
            'UPDATE estado SET nombre=?, descripcion=? WHERE id=?',
            [nombre, descripcion, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Estado no encontrado' });
        res.json({ mensaje: 'Estado actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const deleteEstado = async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM estado WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Estado no encontrado' });
        res.json({ mensaje: 'Estado eliminado correctamente' });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ error: 'No se puede eliminar: el estado está en uso por otros registros' });
        }
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getEstados, getEstadoById, createEstado, updateEstado, deleteEstado };