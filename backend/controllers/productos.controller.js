const pool = require('../db');

const ID_ESTADO_ACTIVO = 1;
const ID_ESTADO_INACTIVO = 2;

// GET /api/productos
const getProductos = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM productos WHERE id_estado != ?', [ID_ESTADO_INACTIVO]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// GET /api/productos/:id
const getProductoById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// POST /api/productos
const createProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio_venta_kg, costo_kg, cantidad_kg, id_categoria, id_estado } = req.body;
        const [result] = await pool.query(
            `INSERT INTO productos (nombre, descripcion, precio_venta_kg, costo_kg, cantidad_kg, id_categoria, id_estado)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nombre, descripcion, precio_venta_kg, costo_kg, cantidad_kg ?? 0, id_categoria, id_estado ?? ID_ESTADO_ACTIVO]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// PUT /api/productos/:id
const updateProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio_venta_kg, costo_kg, cantidad_kg, id_categoria, id_estado } = req.body;
        const [result] = await pool.query(
            `UPDATE productos SET nombre=?, descripcion=?, precio_venta_kg=?, costo_kg=?, cantidad_kg=?, id_categoria=?, id_estado=?
             WHERE id=?`,
            [nombre, descripcion, precio_venta_kg, costo_kg, cantidad_kg, id_categoria, id_estado, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ mensaje: 'Producto actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// PATCH /api/productos/:id/desactivar
const desactivarProducto = async (req, res) => {
    try {
        const [result] = await pool.query(
            'UPDATE productos SET id_estado = ? WHERE id = ?',
            [ID_ESTADO_INACTIVO, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ mensaje: 'Producto desactivado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getProductos, getProductoById, createProducto, updateProducto, desactivarProducto };