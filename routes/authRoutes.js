// routes/authRoutes.js
const express = require('express');
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { registerValidation, loginValidation } = require('../middleware/validationMiddleware'); // <-- Import here

const router = express.Router();

router.post('/register', registerValidation, registerUser); // <-- Added validation
router.post('/login', loginValidation, loginUser);       // <-- Added validation
router.get('/me', protect, getMe);

module.exports = router;