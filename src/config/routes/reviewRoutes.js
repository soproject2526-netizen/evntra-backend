const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/reviewController");
// const authMiddleware = require("../../middleware/authMiddleware");

// ✅ Create review
router.post("/", reviewController.createReview);

// ✅ Get reviews of event
router.get("/event/:eventId", reviewController.getEventReviews);

// ✅ Get pending reviews (for dashboard popup)
router.get("/pending", reviewController.getPendingReviews);

module.exports = router;
