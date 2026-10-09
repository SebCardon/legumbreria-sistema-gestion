const express = require('express');
const router = express.Router();
const {
    getProductos, getCatalogoProductos, getProductoById,
    createProducto, updateProducto, desactivarProducto
} = require('../controllers/productos.controller');

router.get('/', getProductos);
router.get('/catalogo', getCatalogoProductos); // antes de /:id, si no Express lo confundiría con un id
router.get('/:id', getProductoById);
router.post('/', createProducto);
router.put('/:id', updateProducto);
router.patch('/:id/desactivar', desactivarProducto);

module.exports = router;