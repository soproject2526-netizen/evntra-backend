
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const eventController = require("../controllers/eventController");
const eventsController = require("../controllers/eventsController");
const authOptional = require("../../middleware/authOptional");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/events");
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {

  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".mp4",
    ".mov",
    ".mkv"
  ];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only images and videos are allowed"), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024
  }
});

// Create event
router.post("/",upload.array("media", 10),eventController.createEvent);

// Became Organizer
router.post("/become-organizer", eventController.becomeOrganizer);

// List all events
router.get("/",authOptional,eventsController.listEvents);

// Upload media file
router.post("/upload-media",upload.single("media"),eventController.uploadEventMedia);

// Update primary media for an event
router.put("/:id",upload.single("media"),eventController.updateEventMedia);

module.exports = router;