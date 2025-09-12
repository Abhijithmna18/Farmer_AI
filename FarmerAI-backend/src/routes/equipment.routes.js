const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/equipment.controller');

router.use(authenticateToken);

router.post('/', ctrl.create);
router.get('/', ctrl.list);
router.get('/owner/:userId', ctrl.ownerInventory);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
