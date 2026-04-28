const { Review, Event, User, sequelize } = require("../models");

// ✅ CREATE REVIEW
async function createReview(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const user_id = req.user.id;
    const { event_id, rating, comment } = req.body;

    if (!event_id || !rating || !comment) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "event_id, rating, comment required",
      });
    }

    if (rating < 1 || rating > 5) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1-5",
      });
    }

    const event = await Event.findByPk(event_id);
    if (!event) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const existing = await Review.findOne({
      where: { user_id, event_id },
    });

    if (existing) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "You already reviewed this event",
      });
    }

    const review = await Review.create(
      {
        user_id,
        event_id,
        organizer_id: event.organizer_id,
        rating,
        comment,
      },
      { transaction },
    );

    const newTotal = event.total_reviews + 1;
    const newAverage =
      (event.average_rating * event.total_reviews + rating) / newTotal;

    await event.update(
      {
        total_reviews: newTotal,
        average_rating: newAverage,
      },
      { transaction },
    );

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("REVIEW ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create review",
    });
  }
}

// ✅ GET EVENT REVIEWS
async function getEventReviews(req, res) {
  try {
    const { eventId } = req.params;

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const reviews = await Review.findAll({
      where: { event_id: eventId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "full_name", "profile_image"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.json({
      success: true,
      average_rating: event.average_rating,
      total_reviews: event.total_reviews,
      reviews,
    });
  } catch (error) {
    console.error("GET REVIEWS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
}

// ✅ PENDING REVIEWS
async function getPendingReviews(req, res) {
  try {
    const user_id = req.user.id;

    const pending = await sequelize.query(
      `
      SELECT e.id, e.title
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      LEFT JOIN reviews r 
        ON r.event_id = e.id AND r.user_id = b.user_id
      WHERE b.user_id = :user_id
      AND b.status = 'attended'
      AND e.status = 'completed'
      AND r.id IS NULL
      `,
      {
        replacements: { user_id },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    return res.json({
      success: true,
      reviews: pending,
    });
  } catch (error) {
    console.error("PENDING REVIEWS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending reviews",
    });
  }
}

module.exports = {
  createReview,
  getEventReviews,
  getPendingReviews,
};
