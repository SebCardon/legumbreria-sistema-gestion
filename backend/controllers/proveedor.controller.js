const pool = require('../db');

// GET /api/proveedores
const getProveedores = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM proveedor');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// GET /api/proveedores/:id
const getProveedorById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM proveedor WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// POST /api/proveedores
const createProveedor = async (req, res) => {
    try {
        const { nombre, telefono, direccion } = req.body;
        const [result] = await pool.query(
            'INSERT INTO proveedor (nombre, telefono, direccion) VALUES (?, ?, ?)',
            [nombre, telefono, direccion]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// PUT /api/proveedores/:id
const updateProveedor = async (req, res) => {
    try {
        const { nombre, telefono, direccion } = req.body;
        const [result] = await pool.query(
            'UPDATE proveedor SET nombre=?, telefono=?, direccion=? WHERE id=?',
            [nombre, telefono, direccion, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }
        res.json({ mensaje: 'Proveedor actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// DELETE /api/proveedores/:id
const deleteProveedor = async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM proveedor WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }
        res.json({ mensaje: 'Proveedor eliminado correctamente' });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ error: 'No se puede eliminar: el proveedor tiene compras asociadas' });
        }
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getProveedores, getProveedorById, createProveedor, updateProveedor, deleteProveedor };