const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../validators/auth.validator');
const handleValidation = require('../utils/handleValidation');

const router = express.Router();

router.post('/register', registerValidation, handleValidation, registerUser);
router.post('/login', loginValidation, handleValidation, loginUser);

module.exports = router;
