const pool = require('../db');

const getAbonos = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM abono ORDER BY fecha DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const getAbonosByFactura = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM abono WHERE id_factura = ? ORDER BY fecha',
            [req.params.id_factura]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Resumen: cuánto vale la factura, cuánto se ha abonado, y cuánto falta
const getResumenFactura = async (req, res) => {
    try {
        const idFactura = req.params.id_factura;
        const [facturaRows] = await pool.query('SELECT total_pagar FROM factura WHERE id = ?', [idFactura]);
        if (facturaRows.length === 0) return res.status(404).json({ error: 'Factura no encontrada' });

        const [abonoRows] = await pool.query(
            'SELECT COALESCE(SUM(valor), 0) AS total_abonado FROM abono WHERE id_factura = ?',
            [idFactura]
        );

        const totalPagar = Number(facturaRows[0].total_pagar);
        const totalAbonado = Number(abonoRows[0].total_abonado);
        const saldoPendiente = Math.max(totalPagar - totalAbonado, 0);

        res.json({ total_pagar: totalPagar, total_abonado: totalAbonado, saldo_pendiente: saldoPendiente });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const createAbono = async (req, res) => {
    try {
        const { id_persona_cliente, id_factura, fecha, valor, descripcion } = req.body;

        const [facturaRows] = await pool.query('SELECT total_pagar FROM factura WHERE id = ?', [id_factura]);
        if (facturaRows.length === 0) return res.status(404).json({ error: 'Factura no encontrada' });

        const [abonoRows] = await pool.query(
            'SELECT COALESCE(SUM(valor), 0) AS total_abonado FROM abono WHERE id_factura = ?',
            [id_factura]
        );

        const totalPagar = Number(facturaRows[0].total_pagar);
        const totalAbonadoPrevio = Number(abonoRows[0].total_abonado);
        const saldoPendiente = Math.max(totalPagar - totalAbonadoPrevio, 0);
        const valorAbono = Number(valor);

        const montoAplicado = Math.min(valorAbono, saldoPendiente);
        const excedente = valorAbono - montoAplicado;

        if (montoAplicado > 0) {
            await pool.query(
                `INSERT INTO abono (id_persona_cliente, id_factura, fecha, valor, descripcion)
                 VALUES (?, ?, ?, ?, ?)`,
                [id_persona_cliente, id_factura, fecha, montoAplicado, descripcion || null]
            );
        }

        if (excedente > 0) {
            await pool.query(
                `INSERT INTO abono (id_persona_cliente, id_factura, fecha, valor, descripcion)
                 VALUES (?, NULL, ?, ?, ?)`,
                [id_persona_cliente, fecha, excedente, `Saldo a favor generado por abono a factura #${id_factura}`]
            );
            await pool.query(
                'UPDATE personas SET saldo_a_favor = saldo_a_favor + ? WHERE id = ?',
                [excedente, id_persona_cliente]
            );
        }

        res.status(201).json({
            mensaje: 'Abono registrado correctamente',
            monto_aplicado_a_factura: montoAplicado,
            excedente_a_saldo_favor: excedente
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const aplicarSaldoAFavor = async (req, res) => {
    try {
        const { id_persona_cliente, id_factura, fecha } = req.body;

        const [personaRows] = await pool.query('SELECT saldo_a_favor FROM personas WHERE id = ?', [id_persona_cliente]);
        if (personaRows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });

        const [facturaRows] = await pool.query('SELECT total_pagar FROM factura WHERE id = ?', [id_factura]);
        if (facturaRows.length === 0) return res.status(404).json({ error: 'Factura no encontrada' });

        const [abonoRows] = await pool.query(
            'SELECT COALESCE(SUM(valor), 0) AS total_abonado FROM abono WHERE id_factura = ?',
            [id_factura]
        );

        const saldoAFavor = Number(personaRows[0].saldo_a_favor);
        const totalPagar = Number(facturaRows[0].total_pagar);
        const totalAbonadoPrevio = Number(abonoRows[0].total_abonado);
        const saldoPendiente = Math.max(totalPagar - totalAbonadoPrevio, 0);

        if (saldoAFavor <= 0) {
            return res.status(409).json({ error: 'El cliente no tiene saldo a favor disponible' });
        }
        if (saldoPendiente <= 0) {
            return res.status(409).json({ error: 'Esta factura ya está totalmente pagada' });
        }

        const montoAplicado = Math.min(saldoAFavor, saldoPendiente);

        await pool.query(
            `INSERT INTO abono (id_persona_cliente, id_factura, fecha, valor, descripcion)
             VALUES (?, ?, ?, ?, ?)`,
            [id_persona_cliente, id_factura, fecha, montoAplicado, 'Aplicación de saldo a favor']
        );
        await pool.query(
            'UPDATE personas SET saldo_a_favor = saldo_a_favor - ? WHERE id = ?',
            [montoAplicado, id_persona_cliente]
        );

        res.status(201).json({ mensaje: 'Saldo a favor aplicado correctamente', monto_aplicado: montoAplicado });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getAbonos, getAbonosByFactura, getResumenFactura, createAbono, aplicarSaldoAFavor };