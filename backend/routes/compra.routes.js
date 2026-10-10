const express = require('express');
const router = express.Router();
const {
    getCompras, getComprasCanceladas, getCompraById,
    createCompra, updateCompra, desactivarCompra, reactivarCompra
} = require('../controllers/compra.controller');

router.get('/', getCompras);
router.get('/canceladas', getComprasCanceladas); // antes de /:id
router.get('/:id', getCompraById);
router.post('/', createCompra);
router.put('/:id', updateCompra);
router.patch('/:id/desactivar', desactivarCompra);
router.patch('/:id/reactivar', reactivarCompra);

module.exports = router;