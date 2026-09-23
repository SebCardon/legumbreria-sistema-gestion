const pool = require('../db');

const recalcularTotalFactura = async (idFactura) => {
    const [rows] = await pool.query(
        'SELECT COALESCE(SUM(subtotal), 0) AS total FROM productos_x_factura WHERE id_factura = ?',
        [idFactura]
    );
    await pool.query('UPDATE factura SET total_pagar = ? WHERE id = ?', [rows[0].total, idFactura]);
};

const getProductosXFactura = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM productos_x_factura');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

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

        const [productoRows] = await pool.query('SELECT id FROM productos WHERE id = ?', [id_producto]);
        if (productoRows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const [result] = await pool.query(
            `INSERT INTO productos_x_factura (id_factura, id_producto, id_presentacion, peso_total_kg, precio_por_kg, subtotal)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id_factura, id_producto, id_presentacion, peso_total_kg, precio_por_kg, subtotal]
        );

        await recalcularTotalFactura(id_factura);

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

        await recalcularTotalFactura(id_factura);

        res.json({ mensaje: 'Registro actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const deleteProductoXFactura = async (req, res) => {
    try {
        const [filaRows] = await pool.query('SELECT id_factura FROM productos_x_factura WHERE id = ?', [req.params.id]);
        if (filaRows.length === 0) return res.status(404).json({ error: 'Registro no encontrado' });
        const idFacturaAfectada = filaRows[0].id_factura;

        const [result] = await pool.query('DELETE FROM productos_x_factura WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Registro no encontrado' });

        await recalcularTotalFactura(idFacturaAfectada);

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