
const express = require("express");
const router = express.Router();
const upload = require("../uploadCloudinary");
const {
  selectCity,
  getUserProfile,
  updateUserProfile,
  getUserProfileStats,
  getAllUsers,
} = require("../controllers/userController");

const protect = require("../../middleware/requireAuth");

// ======================================================
// USER PROFILE ROUTES
// ======================================================

// Get current user's profile
router.get(
  "/profile",
  protect,
  getUserProfile
);

// Update current user's profile
// Supports optional profile image upload.
router.put(
  "/profile/update",
  protect,
  upload.single("profile_image"),
  updateUserProfile
);

// Get current user's profile statistics
router.get(
  "/profile/stats",
  protect,
  getUserProfileStats
);

// Admin - get all users
router.get(
  "/admin/users",
  protect,
  getAllUsers
);

// Select user's city
router.post(
  "/select-city",
  protect,
  selectCity
);

module.exports = router;