const express = require('express');
const router = express.Router();
const {
    getPresentaciones, getPresentacionById, createPresentacion, updatePresentacion, deletePresentacion
} = require('../controllers/presentacion.controller');

router.get('/', getPresentaciones);
router.get('/:id', getPresentacionById);
router.post('/', createPresentacion);
router.put('/:id', updatePresentacion);
router.delete('/:id', deletePresentacion);

module.exports = router;