const express = require('express');
const router = express.Router();
const {
    getTransportes, getTransporteById, createTransporte, updateTransporte, deleteTransporte
} = require('../controllers/transporte.controller');

router.get('/', getTransportes);
router.get('/:id', getTransporteById);
router.post('/', createTransporte);
router.put('/:id', updateTransporte);
router.delete('/:id', deleteTransporte);

module.exports = router;