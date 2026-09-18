const pool = require('../db');

const getTransportes = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM transporte');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const getTransporteById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM transporte WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Transporte no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const createTransporte = async (req, res) => {
    try {
        const { id_persona_conductor, placa_vehiculo, fecha, valor_transporte } = req.body;
        const valorFinal = valor_transporte === '' || valor_transporte === undefined ? null : valor_transporte;
        const [result] = await pool.query(
            `INSERT INTO transporte (id_persona_conductor, placa_vehiculo, fecha, valor_transporte)
             VALUES (?, ?, ?, ?)`,
            [id_persona_conductor, placa_vehiculo, fecha, valorFinal]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const updateTransporte = async (req, res) => {
    try {
        const { id_persona_conductor, placa_vehiculo, fecha, valor_transporte } = req.body;
        const valorFinal = valor_transporte === '' || valor_transporte === undefined ? null : valor_transporte;
        const [result] = await pool.query(
            `UPDATE transporte SET id_persona_conductor=?, placa_vehiculo=?, fecha=?, valor_transporte=?
             WHERE id=?`,
            [id_persona_conductor, placa_vehiculo, fecha, valorFinal, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Transporte no encontrado' });
        res.json({ mensaje: 'Transporte actualizado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const deleteTransporte = async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM transporte WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Transporte no encontrado' });
        res.json({ mensaje: 'Transporte eliminado correctamente' });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ error: 'No se puede eliminar: el transporte tiene compras asociadas' });
        }
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getTransportes, getTransporteById, createTransporte, updateTransporte, deleteTransporte };