const express = require("express");
const router = express.Router();
const multer = require('multer');
const { authenticateToken } = require("../middlewares/auth.middleware");
const {
	createGrowthCalendar,
	getGrowthCalendars,
	getGrowthCalendarById,
	updateGrowthCalendar,
	deleteGrowthCalendar,
	addCropEvent,
	updateCropEvent,
	deleteCropEvent,
	getCalendarAnalytics,
	getWeatherSuggestions,
	getCalendarsWithRemainingDays,
	getActiveCalendarsByUser,
	addGrowthStage,
	addTaskToStage,
	updateTaskCompletion,
	addCustomReminder,
	getUpcomingReminders,
	updateHarvestRecord,
} = require("../controllers/calendar.controller");
const {
	exportToCSV,
	exportToPDF,
	exportToJSON,
	importCalendar
} = require("../controllers/export.controller");

// Configure multer for file uploads
const upload = multer({ 
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Calendar CRUD operations
router.post("/", createGrowthCalendar);
router.get("/", getGrowthCalendars);
router.get("/dashboard", getCalendarsWithRemainingDays); // For dashboard with remaining days
router.get("/:userId/active", getActiveCalendarsByUser);
router.get("/:id", getGrowthCalendarById);
router.patch("/:id", updateGrowthCalendar);
router.delete("/:id", deleteGrowthCalendar);

// Crop events management
router.post("/:id/events", addCropEvent);
router.put("/:id/events/:eventId", updateCropEvent);
router.delete("/:id/events/:eventId", deleteCropEvent);

// Analytics and insights
router.get("/:id/analytics", getCalendarAnalytics);

// Weather integration
router.get("/weather/suggestions", getWeatherSuggestions);

// Growth stages and tasks management
router.post("/:id/stages", addGrowthStage);
router.post("/:id/stages/:stageName/tasks", addTaskToStage);
router.put("/:id/stages/:stageName/tasks/:taskId", updateTaskCompletion);

// Custom reminders
router.post("/:id/reminders", addCustomReminder);
router.get("/reminders/upcoming", getUpcomingReminders);

// Harvest records
router.put("/:id/harvest", updateHarvestRecord);

// Export/Import functionality
router.get("/:id/export/csv", exportToCSV);
router.get("/:id/export/pdf", exportToPDF);
router.get("/:id/export/json", exportToJSON);
router.post("/import", upload.single('file'), importCalendar);

module.exports = router;
