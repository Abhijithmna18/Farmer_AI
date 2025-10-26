const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const { workshopTutorialUpload, handleMulterError } = require('../middlewares/imageUpload.middleware');
const workshopTutorialController = require('../controllers/workshopTutorial.controller');

// Public routes (no authentication required)
router.get('/', workshopTutorialController.getWorkshopTutorials);
router.get('/:id', workshopTutorialController.getWorkshopTutorial);
router.post('/:id/rate', workshopTutorialController.rateWorkshopTutorial);

// Admin routes (require authentication and admin role)
router.use(authenticateToken);
router.use(authorizeRoles(['admin']));

// CRUD operations for workshop tutorial management
router.post('/', workshopTutorialUpload.single('image'), handleMulterError, workshopTutorialController.createWorkshopTutorial);
router.put('/:id', workshopTutorialUpload.single('image'), handleMulterError, workshopTutorialController.updateWorkshopTutorial);
router.delete('/:id', workshopTutorialController.deleteWorkshopTutorial);
router.post('/reorder', workshopTutorialController.reorderWorkshopTutorials);

module.exports = router;

