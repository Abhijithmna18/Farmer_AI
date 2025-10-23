// src/routes/favorite.routes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const controller = require('../controllers/favorite.controller');

router.use(authenticateToken);
router.get('/', controller.list);
router.post('/toggle', controller.toggle);

module.exports = router;















