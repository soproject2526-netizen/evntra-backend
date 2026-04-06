
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../cloudinary');
const path = require("path");
const eventController = require("../controllers/eventController");
const eventsController = require("../controllers/eventsController");
const { getEventDetail } = require("../controllers/eventDetailController");
const requireAuth = require("../../middleware/requireAuth");
const authOptional = require("../../middleware/authOptional");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'events',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4'],
  },
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
router.post("/",upload.array("media", 10),requireAuth,eventController.createEvent);

// Became Organizer
router.post("/become-organizer",requireAuth, eventController.becomeOrganizer);

// List all events
router.get("/",authOptional,eventsController.listEvents);

// Single Detail Event 
router.get("/:id", authOptional, getEventDetail);

// Upload media file
router.post("/upload-media",upload.single("media"),eventController.uploadEventMedia);

// Update primary media for an event
router.put("/:id",upload.single("media"),eventController.updateEventMedia);

module.exports = router;