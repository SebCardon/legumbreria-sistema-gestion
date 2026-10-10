require('dotenv').config();

// Días que una factura/compra cancelada se conserva antes de eliminarse.
// Se cambia con la variable DIAS_RETENCION_CANCELADOS (en .env o en Railway).
const DIAS_RETENCION = Number(process.env.DIAS_RETENCION_CANCELADOS) || 60;

module.exports = { DIAS_RETENCION };