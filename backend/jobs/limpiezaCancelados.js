const pool = require('../db');
const { DIAS_RETENCION } = require('../config/retencion');

const ID_ESTADO_INACTIVO = 2;
const CADA_6_HORAS = 6 * 60 * 60 * 1000;

async function limpiarCancelados() {
    try {
        // Facturas canceladas hace más de N días y SIN abonos registrados.
        // Las que tienen abonos se dejan intactas: ahí hay dinero de por medio y se revisan a mano.
        const [facturas] = await pool.query(
            `DELETE FROM factura
             WHERE id_estado = ?
               AND fecha_cancelacion IS NOT NULL
               AND fecha_cancelacion < DATE_SUB(NOW(), INTERVAL ? DAY)
               AND NOT EXISTS (SELECT 1 FROM abono WHERE abono.id_factura = factura.id)`,
            [ID_ESTADO_INACTIVO, DIAS_RETENCION]
        );

        const [compras] = await pool.query(
            `DELETE FROM compra
             WHERE id_estado = ?
               AND fecha_cancelacion IS NOT NULL
               AND fecha_cancelacion < DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [ID_ESTADO_INACTIVO, DIAS_RETENCION]
        );

        if (facturas.affectedRows > 0 || compras.affectedRows > 0) {
            console.log(
                `Limpieza automática: ${facturas.affectedRows} factura(s) y ${compras.affectedRows} compra(s) eliminadas.`
            );
        }
    } catch (error) {
        console.error('Error en la limpieza automática:', error.message);
    }
}

function iniciarLimpiezaAutomatica() {
    limpiarCancelados();                          // una vez al arrancar el servidor
    setInterval(limpiarCancelados, CADA_6_HORAS); // y cada 6 horas mientras siga encendido
}

module.exports = { iniciarLimpiezaAutomatica };