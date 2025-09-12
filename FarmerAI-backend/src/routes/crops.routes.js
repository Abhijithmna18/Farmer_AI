const express = require('express');
const router = express.Router();
const { recommend } = require('../controllers/crops.controller');

router.post('/recommend', recommend);

module.exports = router;










