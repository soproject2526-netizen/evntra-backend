const express = require("express");
const router = express.Router();

const organizerDashboardController = require("../../controllers/organizerDashboardController");
const authMiddleware = require("../../../middleware/authMiddleware");
const organizerOnly = require("../../../middleware/organizerOnly");

// 🔐 Auth first
router.use(authMiddleware);

// 🔐 Organizer check
router.use(organizerOnly);

// Dashboard
router.get("/overview", organizerDashboardController.getDashboardOverview);
router.get("/events", organizerDashboardController.getOrganizerEvents);
router.get("/bookings", organizerDashboardController.getOrganizerBookings);

// Event drill-down
router.get(
  "/event/:eventId/bookings",
  organizerDashboardController.getEventBookings,
);

// Revenue
router.get("/revenue", organizerDashboardController.getOrganizerRevenue);

// Withdrawals
router.get(
  "/withdrawals/summary",
  authMiddleware,
  organizerOnly,
  organizerDashboardController.getWithdrawalsSummary,
);

// router.post(
//   '/withdrawals',
//   authMiddleware,
//   organizerOnly,
//   organizerDashboardController.createWithdrawal
// );
router.get("/withdrawals", organizerDashboardController.getWithdrawals);
// router.post('/withdrawals', organizerDashboardController.createWithdrawal);
router.post("/withdrawals", organizerDashboardController.createWithdrawal);

module.exports = router;
