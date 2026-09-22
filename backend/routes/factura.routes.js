const express = require('express');
const router = express.Router();
const {
    getFacturas, getFacturaById, createFactura, updateFactura, desactivarFactura, getFacturasCanceladas
} = require('../controllers/factura.controller');

router.get('/', getFacturas);
router.get('/canceladas', getFacturasCanceladas);
router.get('/:id', getFacturaById);
router.post('/', createFactura);
router.put('/:id', updateFactura);
router.patch('/:id/desactivar', desactivarFactura);

module.exports = router;