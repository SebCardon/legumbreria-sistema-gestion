const pool = require('../db');

const getRoles = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM rol');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const getRolById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM rol WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Rol no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const createRol = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        const [result] = await pool.query(
            'INSERT INTO rol (nombre, descripcion) VALUES (?, ?)',
            [nombre, descripcion]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const updateRol = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        const [result] = await pool.query(
            'UPDATE rol SET nombre=?, descripcion=? WHERE id=?',
            [nombre, descripcion, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Rol no encontrado' });
        res.json({ mensaje: 'Rol actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const deleteRol = async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM rol WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Rol no encontrado' });
        res.json({ mensaje: 'Rol eliminado correctamente' });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ error: 'No se puede eliminar: el rol está en uso' });
        }
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getRoles, getRolById, createRol, updateRol, deleteRol };