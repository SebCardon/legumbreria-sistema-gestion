const express = require('express');
const router = express.Router();
const {
    getEstados, getEstadoById, createEstado, updateEstado, deleteEstado
} = require('../controllers/estado.controller');

router.get('/', getEstados);
router.get('/:id', getEstadoById);
router.post('/', createEstado);
router.put('/:id', updateEstado);
router.delete('/:id', deleteEstado);

module.exports = router;