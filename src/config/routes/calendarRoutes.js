const express = require("express");
const router = express.Router();
const calendarController = require("../controllers/calendarController");
const authOptional = require("../../middleware/requireAuth");

router.get("/events",calendarController.getCalendarEvents);
router.get("/month", calendarController.getCalendarMonth);
router.get("/date/:date", calendarController.getEventsByDate);

module.exports = router;
