const pool = require('../db');

const recalcularTotalCompra = async (idCompra) => {
    const [rows] = await pool.query(
        'SELECT COALESCE(SUM(subtotal), 0) AS total FROM productos_x_compra WHERE id_compra = ?',
        [idCompra]
    );
    await pool.query('UPDATE compra SET total_compra = ? WHERE id = ?', [rows[0].total, idCompra]);
};

const getProductosXCompra = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM productos_x_compra');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

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

        await recalcularTotalCompra(id_compra);

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

        await recalcularTotalCompra(id_compra);

        res.json({ mensaje: 'Registro actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const deleteProductoXCompra = async (req, res) => {
    try {
        const [filaRows] = await pool.query('SELECT id_compra FROM productos_x_compra WHERE id = ?', [req.params.id]);
        if (filaRows.length === 0) return res.status(404).json({ error: 'Registro no encontrado' });
        const idCompraAfectada = filaRows[0].id_compra;

        const [result] = await pool.query('DELETE FROM productos_x_compra WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Registro no encontrado' });

        await recalcularTotalCompra(idCompraAfectada);

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