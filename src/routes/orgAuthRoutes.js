// src/routes/orgAuthRoutes.js

const express = require('express');
const router = express.Router();
const orgAuthController = require('../controllers/orgAuthController');

router.post('/signin', orgAuthController.signin);

module.exports = router;