const { Op } = require("sequelize");
const db = require("../models");

const Event = db.Event;
const City = db.City;
const EventMedia = db.EventMedia;

/**
 * Normalize to start of day
 */
const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Normalize to end of day
 */
const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

module.exports = {

  /**
   * GET /api/calendar/events
   * Events grouped by date
   */
  async getCalendarEvents(req, res) {
    try {
      const { city_id, from_date, to_date } = req.query;

      const where = {
        status: "published",
      };

      if (city_id) {
        where.city_id = city_id;
      }

      // ✅ FIX: USE start_time
      if (from_date && to_date) {
        where.start_time = {
          [Op.between]: [
            startOfDay(from_date),
            endOfDay(to_date),
          ],
        };
      }

      const events = await Event.findAll({
        where,
        include: [
          {
            model: City,
            as: "city",
            attributes: ["id", "name"],
          },
          {
            model: EventMedia,
            as: "media",
            attributes: ["url"],
            required: false,
          },
        ],
        order: [["start_time", "ASC"]],
      });

      // ✅ FIX: GROUP BY start_time DATE
      const grouped = {};

      events.forEach((event) => {
        const dateKey = new Date(event.start_time)
          .toISOString()
          .split("T")[0];

        if (!grouped[dateKey]) grouped[dateKey] = [];

        grouped[dateKey].push({
          id: event.id,
          title: event.title,
          city: event.city,
          media: event.media,
          start_time: event.start_time,
        });
      });

      return res.status(200).json({
        success: true,
        data: grouped,
      });

    } catch (error) {
      console.error("Calendar Events Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to load calendar events",
      });
    }
  },

  /**
   * GET /api/calendar/month
   * Dates that have events
   */
  async getCalendarMonth(req, res) {
    try {
      const { month, year, city_id } = req.query;

      if (!month || !year) {
        return res.status(400).json({
          success: false,
          message: "Month and year are required",
        });
      }

      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);

      const where = {
        status: "published",
        start_time: {
          [Op.between]: [start, end],
        },
      };

      if (city_id) {
        where.city_id = city_id;
      }

      const events = await Event.findAll({
        attributes: ["start_time"],
        where,
      });

      // ✅ FIX
      const dates = [
        ...new Set(
          events.map((e) =>
            new Date(e.start_time).toISOString().split("T")[0]
          )
        ),
      ];

      return res.status(200).json({
        success: true,
        dates,
      });

    } catch (error) {
      console.error("Calendar Month Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to load calendar month",
      });
    }
  },

  /**
   * GET /api/calendar/date/:date
   * Events on a specific date
   */
  async getEventsByDate(req, res) {
    try {
      const { date } = req.params;

      const events = await Event.findAll({
        where: {
          status: "published",
          start_time: {
            [Op.between]: [
              startOfDay(date),
              endOfDay(date),
            ],
          },
        },
        include: [
          {
            model: City,
            as: "city",
            attributes: ["name"],
          },
          {
            model: EventMedia,
            as: "media",
            attributes: ["url"],
            required: false,
          },
        ],
        order: [["start_time", "ASC"]],
      });

      return res.status(200).json({
        success: true,
        data: events,
      });

    } catch (error) {
      console.error("Events By Date Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to load events for date",
      });
    }
  },
};
