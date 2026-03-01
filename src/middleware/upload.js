const multer = require("multer");
const path = require("path");
const fs = require("fs");

const EVENTS_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads/events');

// Ensure uploads/events folder exists
if (!fs.existsSync(EVENTS_UPLOAD_DIR)) {
  fs.mkdirSync(EVENTS_UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, EVENTS_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image") || file.mimetype.startsWith("video")) {
    cb(null, true);
  } else {
    cb(new Error("Only images and videos are allowed"), false);
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});
