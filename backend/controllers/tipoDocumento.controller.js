const pool = require('../db');

const getTiposDocumento = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tipo_documento');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const getTipoDocumentoById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tipo_documento WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Tipo de documento no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const createTipoDocumento = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        const [result] = await pool.query(
            'INSERT INTO tipo_documento (nombre, descripcion) VALUES (?, ?)',
            [nombre, descripcion]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const updateTipoDocumento = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        const [result] = await pool.query(
            'UPDATE tipo_documento SET nombre=?, descripcion=? WHERE id=?',
            [nombre, descripcion, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Tipo de documento no encontrado' });
        res.json({ mensaje: 'Tipo de documento actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const deleteTipoDocumento = async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM tipo_documento WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Tipo de documento no encontrado' });
        res.json({ mensaje: 'Tipo de documento eliminado correctamente' });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ error: 'No se puede eliminar: el tipo de documento está en uso' });
        }
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getTiposDocumento, getTipoDocumentoById, createTipoDocumento, updateTipoDocumento, deleteTipoDocumento };