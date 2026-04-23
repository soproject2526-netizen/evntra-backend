const express = require("express");
const router = express.Router();

const {
  selectCity,
  getUserProfile,
  updateUserProfile,
  getUserProfileStats,
  getAllUsers,
} = require("../controllers/userController");
// const { protect } = require('../middlewares/authMiddleware');
const protect = require("../../middleware/requireAuth");
// User Profile Routes

const upload = require("../../middleware/upload");

router.get("/profile", protect, getUserProfile);

router.put(
  "/profile/update",
  protect,
  upload.single("profile_image"),
  updateUserProfile,
);

router.get("/profile/stats", protect, getUserProfileStats);

router.get("/admin/users", protect, getAllUsers);

router.post("/select-city", protect, selectCity);

module.exports = router;
