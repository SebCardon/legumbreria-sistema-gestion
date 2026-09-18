const pool = require('../db');

const getProductosXFactura = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM productos_x_factura');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// GET /api/productos-x-factura/factura/:id_factura -> todos los productos de UNA factura
const getProductosXFacturaByFactura = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM productos_x_factura WHERE id_factura = ?',
            [req.params.id_factura]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const getProductoXFacturaById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM productos_x_factura WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Registro no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const createProductoXFactura = async (req, res) => {
    try {
        const { id_factura, id_producto, id_presentacion, peso_total_kg, precio_por_kg, subtotal } = req.body;

        const [productoRows] = await pool.query('SELECT cantidad_kg FROM productos WHERE id = ?', [id_producto]);
        if (productoRows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Convertimos AMBOS lados a número antes de comparar, para evitar comparación de texto
        const stockDisponible = Number(productoRows[0].cantidad_kg);
        const cantidadSolicitada = Number(peso_total_kg);

        if (stockDisponible < cantidadSolicitada) {
            return res.status(409).json({ error: `Stock insuficiente. Disponible: ${stockDisponible} kg, solicitado: ${cantidadSolicitada} kg` });
        }

        const [result] = await pool.query(
            `INSERT INTO productos_x_factura (id_factura, id_producto, id_presentacion, peso_total_kg, precio_por_kg, subtotal)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id_factura, id_producto, id_presentacion, peso_total_kg, precio_por_kg, subtotal]
        );

        await pool.query(
            'UPDATE productos SET cantidad_kg = cantidad_kg - ? WHERE id = ?',
            [cantidadSolicitada, id_producto]
        );

        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const updateProductoXFactura = async (req, res) => {
    try {
        const { id_factura, id_producto, id_presentacion, peso_total_kg, precio_por_kg, subtotal } = req.body;
        const [result] = await pool.query(
            `UPDATE productos_x_factura SET id_factura=?, id_producto=?, id_presentacion=?, peso_total_kg=?, precio_por_kg=?, subtotal=?
             WHERE id=?`,
            [id_factura, id_producto, id_presentacion, peso_total_kg, precio_por_kg, subtotal, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Registro no encontrado' });
        res.json({ mensaje: 'Registro actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const deleteProductoXFactura = async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM productos_x_factura WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Registro no encontrado' });
        res.json({ mensaje: 'Registro eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getProductosXFactura, getProductosXFacturaByFactura, getProductoXFacturaById,
    createProductoXFactura, updateProductoXFactura, deleteProductoXFactura
};