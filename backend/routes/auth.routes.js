const express = require('express');
const router = express.Router();
const { loginConGoogle } = require('../controllers/auth.controller');

router.post('/google', loginConGoogle);

module.exports = router;