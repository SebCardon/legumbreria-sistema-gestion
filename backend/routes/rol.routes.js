const express = require('express');
const router = express.Router();
const {
    getRoles, getRolById, createRol, updateRol, deleteRol
} = require('../controllers/rol.controller');

router.get('/', getRoles);
router.get('/:id', getRolById);
router.post('/', createRol);
router.put('/:id', updateRol);
router.delete('/:id', deleteRol);

module.exports = router;