const express = require('express');
const router = express.Router();
const {
    getPersonas,
    getPersonaById,
    createPersona,
    updatePersona,
    desactivarPersona
} = require('../controllers/personas.controller');

router.get('/', getPersonas);
router.get('/:id', getPersonaById);
router.post('/', createPersona);
router.put('/:id', updatePersona);
router.patch('/:id/desactivar', desactivarPersona);   // antes: router.delete('/:id', deletePersona)

module.exports = router;