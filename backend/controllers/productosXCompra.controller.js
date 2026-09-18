const pool = require('../db');

const getProductosXCompra = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM productos_x_compra');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// GET /api/productos-x-compra/compra/:id_compra -> todos los productos de UNA compra
const getProductosXCompraByCompra = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM productos_x_compra WHERE id_compra = ?',
            [req.params.id_compra]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const getProductoXCompraById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM productos_x_compra WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Registro no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const createProductoXCompra = async (req, res) => {
    try {
        const { id_compra, id_producto, id_presentacion, peso_total_kg, precio_por_kg, subtotal } = req.body;
        const [result] = await pool.query(
            `INSERT INTO productos_x_compra (id_compra, id_producto, id_presentacion, peso_total_kg, precio_por_kg, subtotal)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id_compra, id_producto, id_presentacion, peso_total_kg, precio_por_kg, subtotal]
        );

        // Al comprar, el stock del producto aumenta
        await pool.query(
            'UPDATE productos SET cantidad_kg = cantidad_kg + ? WHERE id = ?',
            [peso_total_kg, id_producto]
        );

        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const updateProductoXCompra = async (req, res) => {
    try {
        const { id_compra, id_producto, id_presentacion, peso_total_kg, precio_por_kg, subtotal } = req.body;
        const [result] = await pool.query(
            `UPDATE productos_x_compra SET id_compra=?, id_producto=?, id_presentacion=?, peso_total_kg=?, precio_por_kg=?, subtotal=?
             WHERE id=?`,
            [id_compra, id_producto, id_presentacion, peso_total_kg, precio_por_kg, subtotal, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Registro no encontrado' });
        res.json({ mensaje: 'Registro actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const deleteProductoXCompra = async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM productos_x_compra WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Registro no encontrado' });
        res.json({ mensaje: 'Registro eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getProductosXCompra, getProductosXCompraByCompra, getProductoXCompraById,
    createProductoXCompra, updateProductoXCompra, deleteProductoXCompra
};