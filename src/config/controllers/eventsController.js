// src/controllers/eventsController.js
const { Op, literal, Sequelize } = require('sequelize');
const {
  Event,
  EventMedia,
  Subcategory,
  Like,
  Comment
} = require('../models');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
// const BASE_URL = process.env.APP_URL;

/**
 * GET /api/events
 */
async function listEvents(req, res, next) {
  try {
    const user = req.user || null;
    const userId = user ? user.id : null;

    const {
      city_id,
      category_id,
      subcategory_id,
      q,
      date,
      range,
      date_from,
      date_to,
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      sort = 'date'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || DEFAULT_PAGE);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT));
    const offset = (pageNum - 1) * limitNum;

    const where = { status: 'published' };
    if (city_id) where.city_id = city_id;

    if (q && q.trim().length) {
      const escaped = q.trim();
      where[Op.or] = [
        { title: { [Op.like]: `%${escaped}%` } },
        { description: { [Op.like]: `%${escaped}%` } }
      ];
    }

    if (date) {
      // Single selected date (calendar)
      where.start_time = {
        [Op.between]: [
          new Date(`${date} 00:00:00`),
          new Date(`${date} 23:59:59`)
        ]
      };
    }
    else if (range) {
      const now = new Date();
      let start, end;

      if (range === 'today') {
        start = new Date();
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
      }

      if (range === 'tomorrow') {
        start = new Date();
        start.setDate(start.getDate() + 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
      }

      if (range === 'weekend') {
        const day = now.getDay();
        const saturday = new Date(now);
        saturday.setDate(now.getDate() + (6 - day));
        saturday.setHours(0, 0, 0, 0);

        const sunday = new Date(saturday);
        sunday.setDate(saturday.getDate() + 1);
        sunday.setHours(23, 59, 59, 999);

        start = saturday;
        end = sunday;
      }

      if (range === 'next7') {
        start = new Date();
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setDate(end.getDate() + 7);
        end.setHours(23, 59, 59, 999);
      }

      if (start && end) {
        where.start_time = { [Op.between]: [start, end] };
      }
    } else if (date_from || date_to) {
      where.start_time = {};
      if (date_from) where.start_time[Op.gte] = new Date(`${date_from} 00:00:00`);
      if (date_to) where.start_time[Op.lte] = new Date(`${date_to} 23:59:59`);
    }

    const include = [
      {
        model: EventMedia,
        as: 'media',
        required: false,
        attributes: [
          'id',
          'media_type',
          'order_index',
          'width',
          'height',
          'duration_seconds',
          'storage_filename',
          'original_filename'
        ]

      }
    ];

    if (subcategory_id) {
      include.push({
        model: Subcategory,
        as: 'subcategories',
        attributes: ['id'],
        where: { id: subcategory_id },
        through: { attributes: [] },
        required: true
      });
    } else if (category_id) {
      include.push({
        model: Subcategory,
        as: 'subcategories',
        attributes: ['id', 'category_id'],
        where: { category_id },
        through: { attributes: [] },
        required: true
      });
    }

    const attributes = {
      include: [
        [literal('(SELECT COUNT(1) FROM likes WHERE likes.event_id = Event.id)'), 'likes_count'],
        [literal('(SELECT COUNT(1) FROM comments WHERE comments.event_id = Event.id)'), 'comments_count'],
        [
          userId
            ? literal(`(
            SELECT COUNT(1)
            FROM likes
            WHERE likes.event_id = Event.id
            AND likes.user_id = ${Sequelize.escape(userId)}
          )`)
            : literal('0'),
          'is_liked_by_user'
        ]
      ]
    };


    let order = [['start_time', 'ASC']];
    if (sort === 'popular') order = [[literal('(SELECT COUNT(1) FROM likes WHERE likes.event_id = Event.id)'), 'DESC']];
    if (sort === 'new') order = [['created_at', 'DESC']];


    const { rows: events, count: total } = await Event.findAndCountAll({
      where,
      include,
      attributes,
      order,
      limit: limitNum,
      offset
    });

    const eventsData = events.map(ev => {
      const evJs = ev.toJSON();

      // Sort media properly
      const media = Array.isArray(evJs.media)
        ? evJs.media
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
          .map(m => ({
            id: m.id,
            media_type: m.media_type,
            storage_filename: m.storage_filename,
            original_filename: m.original_filename,
            url: m.url,
            order_index: m.order_index,
            width: m.width,
            height: m.height,
            duration_seconds: m.duration_seconds
          }))
        : [];


      // Primary media = first item
      const primary_media = media.length
        ? {
          id: media[0].id,
          media_type: media[0].media_type,
          url: media[0].url,
          storage_filename: media[0].storage_filename,
          original_filename: media[0].original_filename,
          recommended_dimensions: {
            width: media[0].width || 360,
            height: media[0].height || 200
          }
        }
        : null;



      return {
        id: evJs.id,
        title: evJs.title,
        description: evJs.description,
        start_time: evJs.start_time,
        end_time: evJs.end_time,
        city_id: evJs.city_id,
        venue_name: evJs.venue_name,
        price: evJs.price,
        is_free: !!evJs.is_free,
        likes_count: parseInt(evJs.likes_count || 0, 10),
        comments_count: parseInt(evJs.comments_count || 0, 10),
        is_liked_by_user: !!parseInt(evJs.is_liked_by_user || 0, 10),

        //  FIX
        primary_media,
        media, // ← THIS WAS MISSING ❗❗❗

        chat_room_id: null
      };
    });


    return res.json({
      page: pageNum,
      limit: limitNum,
      total,
      data: eventsData
    });
  } catch (err) {
    return next(err);
  }
}
async function getEventsFeed(req, res) {
  try {
    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || 10, 10);
    const offset = (page - 1) * limit;

    const { rows, count } = await Event.findAndCountAll({
      where: { status: "published" },
      limit,
      offset,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: EventMedia,
          as: "media",
          required: false,
          attributes: [
            "id",
            "media_type",
            "order_index",
            "storage_filename",
            "original_filename",
            "width",
            "height",
            "duration_seconds"
          ]
        }
      ]
    });

    const data = rows.map(event => {
  const media = event.media?.length
    ? event.media
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .map(m => ({
          id: m.id,
          media_type: m.media_type,
          storage_filename: m.storage_filename,
          original_filename: m.original_filename,
          url: m.url,
          order_index: m.order_index
        }))
    : [];

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    start_time: event.start_time,
    end_time: event.end_time,
    city_id: event.city_id,
    venue_name: event.venue_name,
    price: event.price,
    is_free: Boolean(event.is_free),
    likes_count: event.likes_count,
    comments_count: event.comments_count,
    primary_media: media[0] || null,
    media
  };
});


    return res.json({
      page,
      limit,
      total: count,
      data
    });

  } catch (error) {
    console.error("GET EVENTS FEED ERROR:", error);
    return res.status(500).json({
      message: "Failed to fetch events"
    });
  }
}
module.exports = { listEvents, getEventsFeed };
