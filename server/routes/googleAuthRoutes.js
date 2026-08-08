const express = require('express');
const router = express.Router();
const { initiateGoogleAuth, googleCallback } = require('../controllers/googleOAuthController');

// GET /auth/google  →  redirect to Google consent
router.get('/google', initiateGoogleAuth);

// GET /auth/google/callback  →  Google redirects here after consent
router.get('/google/callback', googleCallback);

module.exports = router;
