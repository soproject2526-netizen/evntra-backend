const { EventTicket, Event, sequelize } = require("../models");

const TICKET_TYPES = ["VIP", "GENERAL"];

/**
 * POST /api/event-tickets
 * Create ticket types for an event
 */
async function createEventTickets(req, res, next) {
  const t = await sequelize.transaction();

  try {
    const { event_id, tickets } = req.body;

    if (!event_id || !tickets || !Array.isArray(tickets)) {
      await t.rollback();
      return res.status(400).json({
        message: "event_id and tickets array are required",
      });
    }

    const event = await Event.findByPk(event_id, { transaction: t });
    if (!event) {
      await t.rollback();
      return res.status(404).json({ message: "Event not found" });
    }

    for (const ticket of tickets) {
      if (!ticket.ticket_type || !TICKET_TYPES.includes(ticket.ticket_type)) {
        await t.rollback();
        return res.status(400).json({
          message: `Invalid ticket type. Allowed: ${TICKET_TYPES.join(", ")}`,
        });
      }

      if (ticket.price == null || ticket.quantity == null) {
        await t.rollback();
        return res.status(400).json({
          message: "Ticket price and quantity are required",
        });
      }
    }

    const createdTickets = await EventTicket.bulkCreate(
      tickets.map((ticket) => ({
        event_id,
        ticket_type: ticket.ticket_type,
        price: ticket.price,
        quantity: ticket.quantity,
      })),
      { transaction: t },
    );

    await t.commit();

    return res.status(201).json({
      message: "Event tickets created successfully",
      data: createdTickets,
    });
  } catch (err) {
    await t.rollback();
    return next(err);
  }
}

/**
 * GET /api/events/:eventId/tickets
 */
async function getEventTickets(req, res, next) {
  try {
    const { eventId } = req.params;

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const tickets = await EventTicket.findAll({
      where: { event_id: eventId },
      attributes: ["id", "ticket_type", "price", "quantity"],
      order: [["ticket_type", "ASC"]],
    });

    return res.json({
      event_id: eventId,
      data: tickets,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/event-tickets
 * Admin/debug
 */
async function getAllEventTickets(req, res, next) {
  try {
    const tickets = await EventTicket.findAll({
      order: [["id", "DESC"]],
      include: [
        {
          model: Event,
          as: "event",
          attributes: ["id", "title", "start_time"],
        },
      ],
    });

    return res.json({
      total: tickets.length,
      data: tickets,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/event-tickets/:id
 * Update ticket
 */
async function updateEventTicket(req, res, next) {
  try {
    const { id } = req.params;
    const { price, quantity } = req.body;

    const ticket = await EventTicket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    await ticket.update({ price, quantity });

    return res.json({
      message: "Ticket updated successfully",
      data: ticket,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/event-tickets/:id
 */
async function deleteEventTicket(req, res, next) {
  try {
    const { id } = req.params;

    const ticket = await EventTicket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    await ticket.destroy();

    return res.json({
      message: "Ticket deleted successfully",
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createEventTickets,
  getEventTickets,
  getAllEventTickets,
  updateEventTicket,
  deleteEventTicket,
};