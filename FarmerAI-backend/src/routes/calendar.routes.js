const express = require("express");
const router = express.Router();
const {
  createGrowthCalendar,
  getGrowthCalendars,
  getGrowthCalendarById,
  updateGrowthCalendar,
  deleteGrowthCalendar,
  // crop events
  addCropEvent,
  updateCropEvent,
  deleteCropEvent,
  // analytics
  getCalendarAnalytics,
  // weather
  getWeatherSuggestions,
  // AI
  generateAISchedule,
  predictYield,
  getMalayalamCalendars,
} = require("../controllers/calendar.controller");

// Calendars
router.post("/", createGrowthCalendar);
router.get("/", getGrowthCalendars);
router.get("/:id", getGrowthCalendarById);
router.patch("/:id", updateGrowthCalendar);
router.delete("/:id", deleteGrowthCalendar);

// Crop Events
router.post("/:id/events", addCropEvent);
router.put("/:id/events/:eventId", updateCropEvent);
router.delete("/:id/events/:eventId", deleteCropEvent);

// Analytics
router.get("/:id/analytics", getCalendarAnalytics);

// Weather integration
router.get("/weather/suggestions", getWeatherSuggestions);

// AI endpoints
router.post("/ai/schedule", generateAISchedule);
router.post("/ai/predict-yield", predictYield);

// Malayalam calendars
router.get("/malayalam", getMalayalamCalendars);

module.exports = router;
