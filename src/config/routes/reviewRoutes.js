const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/reviewController");
// const authMiddleware = require("../../middleware/authMiddleware");
const requireAuth = require("../../middleware/requireAuth");

// ✅ Create review (requires login)
router.post("/", requireAuth, reviewController.createReview);

// ✅ Get reviews of event (public API)
router.get("/event/:eventId", reviewController.getEventReviews);

// ✅ Get pending reviews (requires login)
router.get("/pending", requireAuth, reviewController.getPendingReviews);

module.exports = router;
