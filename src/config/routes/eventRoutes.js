const express = require("express");
const router = express.Router();
const upload = require("../../middleware/upload");
const eventController = require("../controllers/eventController");
const authOptional = require("../../middleware/authOptional");
const eventsController = require("../controllers/eventsController");

// Create event
router.post("/", upload.array("media", 10), eventController.createEvent);

//  List all events
router.get("/", authOptional, eventsController.listEvents);

// Upload media file
router.post(
  "/upload-media",
  upload.single("media"),
  eventController.uploadEventMedia
);

// Update primary media for an event (saves to event_media table)
router.put(
  "/:id",
  upload.single("media"), // must upload file when updating
  eventController.updateEventMedia
);

module.exports = router;
