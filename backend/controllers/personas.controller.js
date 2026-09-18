const pool = require('../db');

// GET /api/personas
const getPersonas = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM personas WHERE id_estado != ?', [2]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// GET /api/personas/:id
const getPersonaById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM personas WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Persona no encontrada' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// POST /api/personas
const createPersona = async (req, res) => {
    try {
        const { nombre, apellido, num_documento, id_tipo_documento, telefono, correo, id_estado, id_rol } = req.body;
        const [result] = await pool.query(
            `INSERT INTO personas (nombre, apellido, num_documento, id_tipo_documento, telefono, correo, id_estado, id_rol)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre, apellido, num_documento, id_tipo_documento, telefono, correo, id_estado, id_rol]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// PUT /api/personas/:id
const updatePersona = async (req, res) => {
    try {
        const { nombre, apellido, num_documento, id_tipo_documento, telefono, correo, id_estado, id_rol } = req.body;
        const [result] = await pool.query(
            `UPDATE personas SET nombre=?, apellido=?, num_documento=?, id_tipo_documento=?, telefono=?, correo=?, id_estado=?, id_rol=?
             WHERE id=?`,
            [nombre, apellido, num_documento, id_tipo_documento, telefono, correo, id_estado, id_rol, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Persona no encontrada' });
        }
        res.json({ mensaje: 'Persona actualizada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// PATCH /api/personas/:id/desactivar 
const desactivarPersona = async (req, res) => {
    try {
        const ID_ESTADO_INACTIVO = 2;
        const [result] = await pool.query(
            'UPDATE personas SET id_estado = ? WHERE id = ?',
            [ID_ESTADO_INACTIVO, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Persona no encontrada' });
        }
        res.json({ mensaje: 'Persona desactivada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getPersonas, getPersonaById, createPersona, updatePersona, desactivarPersona };
