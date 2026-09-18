const express = require('express');
const router = express.Router();
const {
    getProductosXCompra, getProductosXCompraByCompra, getProductoXCompraById,
    createProductoXCompra, updateProductoXCompra, deleteProductoXCompra
} = require('../controllers/productosXCompra.controller');

router.get('/', getProductosXCompra);
router.get('/compra/:id_compra', getProductosXCompraByCompra);
router.get('/:id', getProductoXCompraById);
router.post('/', createProductoXCompra);
router.put('/:id', updateProductoXCompra);
router.delete('/:id', deleteProductoXCompra);

module.exports = router;