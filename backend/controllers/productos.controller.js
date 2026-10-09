const pool = require('../db');

const ID_ESTADO_ACTIVO = 1;
const ID_ESTADO_INACTIVO = 2;

// El listado normal NO incluye la imagen: pesa bastante y casi todas las pantallas solo necesitan nombre y precios
const COLUMNAS_LISTADO = 'id, nombre, descripcion, precio_venta_kg, costo_kg, id_categoria, id_estado';

const getProductos = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT ${COLUMNAS_LISTADO} FROM productos WHERE id_estado != ?`,
            [ID_ESTADO_INACTIVO]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Catálogo con imágenes, ordenado alfabéticamente (lo usa la pantalla "Nueva Factura")
const getCatalogoProductos = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM productos WHERE id_estado != ? ORDER BY nombre',
            [ID_ESTADO_INACTIVO]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

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

const createProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio_venta_kg, costo_kg, id_categoria, id_estado, imagen } = req.body;
        const [result] = await pool.query(
            `INSERT INTO productos (nombre, descripcion, precio_venta_kg, costo_kg, id_categoria, id_estado, imagen)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nombre, descripcion, precio_venta_kg, costo_kg, id_categoria, id_estado ?? ID_ESTADO_ACTIVO, imagen || null]
        );
        res.status(201).json({ id: result.insertId, nombre, descripcion, precio_venta_kg, costo_kg, id_categoria });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const updateProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio_venta_kg, costo_kg, id_categoria, id_estado, imagen } = req.body;

        const campos = ['nombre=?', 'descripcion=?', 'precio_venta_kg=?', 'costo_kg=?', 'id_categoria=?', 'id_estado=?'];
        const valores = [nombre, descripcion, precio_venta_kg, costo_kg, id_categoria, id_estado];

        // Si no llega imagen, se conserva la que ya tenía (el listado normal no la trae, así que el frontend no la reenvía)
        if (imagen !== undefined) {
            campos.push('imagen=?');
            valores.push(imagen || null);
        }
        valores.push(req.params.id);

        const [result] = await pool.query(`UPDATE productos SET ${campos.join(', ')} WHERE id=?`, valores);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ mensaje: 'Producto actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

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

module.exports = {
    getProductos, getCatalogoProductos, getProductoById,
    createProducto, updateProducto, desactivarProducto
};