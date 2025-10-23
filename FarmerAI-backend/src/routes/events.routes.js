const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller.js');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Route for hosting an event
router.post('/host', eventController.hostEvent);

// Route for verifying an event
router.get('/verify/:token', eventController.verifyEvent);

// Route for getting all verified events
router.get('/', eventController.getEvents);
// Categories list
router.get('/categories', eventController.getCategories);

// RSVP (auth required)
router.post('/:id/rsvp', authenticateToken, eventController.rsvp);

// Change status (auth required - organizer/admin guard should be added in controller/middleware as needed)
router.patch('/:id/status', authenticateToken, eventController.changeStatus);

// Attendees list
router.get('/:id/attendees', authenticateToken, eventController.getAttendees);

// Exports
router.get('/:id/export/csv', eventController.exportCSV);
router.get('/:id/export/ics', eventController.exportICS);
router.get('/:id/export/pdf', eventController.exportPDF);

module.exports = router;
