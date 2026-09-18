const express = require('express');
const router = express.Router();
const {
    getProductosXFactura, getProductosXFacturaByFactura, getProductoXFacturaById,
    createProductoXFactura, updateProductoXFactura, deleteProductoXFactura
} = require('../controllers/productosXFactura.controller');

router.get('/', getProductosXFactura);
router.get('/factura/:id_factura', getProductosXFacturaByFactura);
router.get('/:id', getProductoXFacturaById);
router.post('/', createProductoXFactura);
router.put('/:id', updateProductoXFactura);
router.delete('/:id', deleteProductoXFactura);

module.exports = router;