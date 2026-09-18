const express = require('express');
const router = express.Router();
const {
    getTiposDocumento, getTipoDocumentoById, createTipoDocumento, updateTipoDocumento, deleteTipoDocumento
} = require('../controllers/tipoDocumento.controller');

router.get('/', getTiposDocumento);
router.get('/:id', getTipoDocumentoById);
router.post('/', createTipoDocumento);
router.put('/:id', updateTipoDocumento);
router.delete('/:id', deleteTipoDocumento);

module.exports = router;