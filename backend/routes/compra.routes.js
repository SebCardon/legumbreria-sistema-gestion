const express = require('express');
const router = express.Router();
const {
    getCompras, getCompraById, createCompra, updateCompra, deleteCompra
} = require('../controllers/compra.controller');

router.get('/', getCompras);
router.get('/:id', getCompraById);
router.post('/', createCompra);
router.put('/:id', updateCompra);
router.delete('/:id', deleteCompra);

module.exports = router;