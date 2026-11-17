const express = require('express');
const router = express.Router();
const {
    getFacturas, getFacturasCanceladas, getFacturaById,
    createFactura, createFacturaCompleta, updateFactura, desactivarFactura, reactivarFactura
} = require('../controllers/factura.controller');

router.get('/', getFacturas);
router.get('/canceladas', getFacturasCanceladas); // antes de /:id
router.get('/:id', getFacturaById);
router.post('/', createFactura);
router.post('/completa', createFacturaCompleta);
router.put('/:id', updateFactura);
router.patch('/:id/desactivar', desactivarFactura);
router.patch('/:id/reactivar', reactivarFactura);

module.exports = router;