
const express = require("express");
const router = express.Router();
const multer = require("multer");
//const { CloudinaryStorage } = require('multer-storage-cloudinary');
//const cloudinary = require('../cloudinary');
const path = require("path");
const eventController = require("../controllers/eventController");
const eventsController = require("../controllers/eventsController");
const { getEventDetail } = require("../controllers/eventDetailController");
const requireAuth = require("../../middleware/requireAuth");
const authOptional = require("../../middleware/authOptional");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  try {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",

      "video/mp4",
      "video/quicktime",
      "video/x-matroska",
    ];

    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".mp4",
      ".mov",
      ".mkv",
    ];

    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const mimeAllowed = allowedMimeTypes.includes(
      file.mimetype
    );

    const extensionAllowed =
      allowedExtensions.includes(extension);

    if (!mimeAllowed || !extensionAllowed) {
      return cb(
        new Error(
          "Unsupported media format. Please upload JPG, JPEG, PNG, WEBP, MP4, MOV or MKV."
        ),
        false
      );
    }

    cb(null, true);
  } catch (error) {
    cb(error, false);
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
router.post("/", upload.array("media", 10), requireAuth, eventController.createEvent);

// Became Organizer
router.post("/become-organizer", requireAuth, eventController.becomeOrganizer);

// List all events
router.get("/", authOptional, eventsController.listEvents);

// Single Detail Event 
router.get("/:id", authOptional, getEventDetail);

// Upload media file
router.post("/upload-media", upload.single("media"), eventController.uploadEventMedia);

// Update primary media for an event
router.put( "/:id", upload.array("media", 10),eventController.updateEventMedia);

module.exports = router;