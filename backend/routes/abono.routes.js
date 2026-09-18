const express = require('express');
const router = express.Router();
const {
    getAbonos, getAbonosByFactura, getResumenFactura, createAbono, aplicarSaldoAFavor
} = require('../controllers/abono.controller');

router.get('/', getAbonos);
router.get('/factura/:id_factura', getAbonosByFactura);
router.get('/factura/:id_factura/resumen', getResumenFactura);
router.post('/', createAbono);
router.post('/aplicar-saldo', aplicarSaldoAFavor);

module.exports = router;