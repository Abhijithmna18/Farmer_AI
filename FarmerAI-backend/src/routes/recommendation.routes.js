// src/routes/recommendation.routes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const controller = require('../controllers/recommendation.controller');

router.use(authenticateToken);
router.post('/generate', controller.generate);
router.get('/:userId?', controller.listByUser);
router.post('/soil', controller.getSoilBased);
router.get('/soil/history', controller.listSoilHistory);
router.get('/soil/:id', controller.getSoilById);
router.put('/soil/:id', controller.updateSoil);
router.delete('/soil/:id', controller.deleteSoil);
router.delete('/:id', controller.deleteCropRecommendation);

module.exports = router;


