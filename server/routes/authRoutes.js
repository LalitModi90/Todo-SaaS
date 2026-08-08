const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { register, login, requestOTP, verifyOTP, googleLogin, getMe } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', requestOTP);
router.post('/verify-otp', verifyOTP);
router.post('/google', googleLogin);
router.get('/me', auth, getMe);

module.exports = router;
