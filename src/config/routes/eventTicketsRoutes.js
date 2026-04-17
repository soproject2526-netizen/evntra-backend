const express = require("express");
const router = express.Router();

const {
  createEventTickets,
  getEventTickets,
  getAllEventTickets,
  updateEventTicket,
  deleteEventTicket,
} = require("../controllers/eventTicketController");

// Create tickets
router.post("/", createEventTickets);

// Get tickets by event
router.get("/events/:eventId/tickets", getEventTickets);

// Admin - all tickets
router.get("/", getAllEventTickets);

// Update ticket
router.put("/:id", updateEventTicket);

// Delete ticket
router.delete("/:id", deleteEventTicket);

module.exports = router;
