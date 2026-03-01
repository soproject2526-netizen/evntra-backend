// src/controllers/dashboardController.js
const { Op, literal, fn, col, Sequelize } = require('sequelize');
const {
  City,
  Category,
  Subcategory,
  Event,
  EventMedia,
  Like,
  Comment,
  Notification
} = require('../models');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

/**
 * GET /api/dashboard
 * Aggregated payload for the dashboard screen:
 *  - user greeting & profile (from req.user)
 *  - cities (first 50) with is_selected flag
 *  - categories + nested subcategories
 *  - initial events feed (paginated)
 *  - notification preview & unread count
 *
 * Query params:
 *  - city_id, category_id, subcategory_id, q, date_from, date_to, page, limit, sort
 */
async function getDashboard(req, res, next) {
  try {
    const user = req.user || null;
    const userId = user ? user.id : null;

    // query params with safe defaults
    const {
      city_id,
      category_id,
      subcategory_id,
      q,
      date_from,
      date_to,
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      sort = 'date' // date | popular | new
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || DEFAULT_PAGE);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT));
    const offset = (pageNum - 1) * limitNum;

    // 1) Cities (limit 50)
    const cities = await City.findAll({
      limit: 50,
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'slug']
    });

    // 2) Categories + subcategories
    const categories = await Category.findAll({
      order: [['order_index', 'ASC']],
      attributes: ['id', 'name', 'emoji', 'is_default'],
      include: [
        {
          model: Subcategory,
          as: 'subcategories',
          attributes: ['id', 'name'],
          order: [['id', 'ASC']]
        }
      ]
    });

    // 3) Build event filter (only published events)
    const where = { status: 'published' };

    if (city_id) where.city_id = city_id;
    if (category_id) {
      // we will filter by subcategory join below (via include)
    }
    if (q && q.trim().length > 0) {
      // safe LIKE search fallback; also try fulltext via literal if available
      const escaped = q.trim();
      where[Op.or] = [
        { title: { [Op.like]: `%${escaped}%` } },
        { description: { [Op.like]: `%${escaped}%` } }
      ];
    }
    if (date_from || date_to) {
      where.start_time = {};
      if (date_from) where.start_time[Op.gte] = new Date(`${date_from} 00:00:00`);
      if (date_to) where.start_time[Op.lte] = new Date(`${date_to} 23:59:59`);
    }

    // 4) Prepare include for media (primary) and optional subcategory join
    const include = [
      {
        model: EventMedia,
        as: 'media',
        attributes: ['id', 'media_type', 'url', 'order_index', 'width', 'height', 'duration_seconds'],
        required: false
      }
    ];

    // If filtering by subcategory_id, join event_subcategories via sequelize `where` on a nested include
    if (subcategory_id) {
      // Event -> EventSubcategory -> Subcategory
      include.push({
        model: Subcategory,
        as: 'subcategories',
        attributes: ['id'],
        where: { id: subcategory_id },
        through: { attributes: [] }, // hide join table attributes
        required: true
      });
    } else if (category_id) {
      // If category specified, join subcategories of that category
      include.push({
        model: Subcategory,
        as: 'subcategories',
        attributes: ['id'],
        where: { category_id },
        through: { attributes: [] },
        required: true
      });
    }

    // 5) Attributes: include likes_count, comments_count, is_liked_by_user via subqueries
    const attributes = {
      include: [
        [
          literal('(SELECT COUNT(1) FROM likes WHERE likes.event_id = Event.id)'),
          'likes_count'
        ],
        [
          literal('(SELECT COUNT(1) FROM comments WHERE comments.event_id = Event.id)'),
          'comments_count'
        ],
        [
          userId
            ? literal(`(SELECT COUNT(1) FROM likes WHERE likes.event_id = Event.id AND likes.user_id = ${Sequelize.escape(userId)})`)
            : literal('0'),
          'is_liked_by_user'
        ]
      ]
    };

    // 6) Order by logic
    let order = [['start_time', 'ASC']];
    if (sort === 'popular') order = [[literal('(SELECT COUNT(1) FROM likes WHERE likes.event_id = Event.id)'), 'DESC']];
    if (sort === 'new') order = [['created_at', 'DESC']];

    // 7) Query events using Sequelize
    const { rows: events, count: total } = await Event.findAndCountAll({
      where,
      include,
      attributes,
      order,
      limit: limitNum,
      offset
    });

    // 8) Map events to response shape: pick primary_media and include recommended_dimensions
    const eventsData = events.map(ev => {
      const evJs = ev.toJSON();
      let primary_media = null;
      if (Array.isArray(evJs.media) && evJs.media.length) {
        // pick lowest order_index
        evJs.media.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        const m = evJs.media[0];
        primary_media = {
          id: m.id,
          media_type: m.media_type,
          url: m.url.startsWith('http') ? m.url : `http://${req.get('host')}/uploads/events/${m.storage_filename}`,
          recommended_dimensions: {
            width: m.width || 360,
            height: m.height || 200
          }
        };
      }
      return {
        id: evJs.id,
        title: evJs.title,
        description: evJs.description,
        start_time: evJs.start_time,
        end_time: evJs.end_time,
        city_id: evJs.city_id,
        venue_name: evJs.venue_name,
        address: evJs.address,
        price: evJs.price,
        currency: evJs.currency,
        is_free: !!evJs.is_free,
        likes_count: parseInt(evJs.likes_count || 0, 10),
        comments_count: parseInt(evJs.comments_count || 0, 10),
        is_liked_by_user: !!parseInt(evJs.is_liked_by_user || 0, 10),
        primary_media,
        // chat_room_id can be populated by another service/table if you create chat rooms
        chat_room_id: null
      };
    });

    // 9) Notifications preview
    let notifications = [];
    let unreadCount = 0;
    if (userId) {
      notifications = await Notification.findAll({
        where: { user_id: userId },
        limit: 5,
        order: [['created_at', 'DESC']],
        attributes: ['id', 'title', 'body', 'is_read', 'created_at']
      });
      unreadCount = await Notification.count({ where: { user_id: userId, is_read: false } });
    }

    // 10) Determine selected city id
    const selectedCityId = city_id || (user && user.preferred_city_id) || (cities.length ? cities[0].id : null);
    const citiesResp = cities.map(c => ({ id: c.id, name: c.name, slug: c.slug, is_selected: (c.id === Number(selectedCityId)) }));

    // 11) Return aggregated response
    return res.json({
      user: user ? { id: user.id, name: user.name, avatar_url: user.avatar_url } : null,
      greeting: user ? `Hi ${user.name} 👋` : 'Hi 👋',
      cities: citiesResp,
      categories, // includes nested subcategories
      search: { placeholder: 'Search events, e.g. "open mic", "food festival"', calendar_enabled: true },
      events: {
        page: pageNum,
        limit: limitNum,
        total,
        data: eventsData
      },
      notifications: {
        unread_count: unreadCount,
        preview: notifications
      }
    });
  } catch (err) {
    return next(err);
  }
}

// GET /api/dashboard/categories
async function getCategories(req, res, next) {
  try {
    // include subcategories if relations are set in your models
    const categories = await Category.findAll({
      order: [['order_index', 'ASC'], ['id', 'ASC']],
      include: [
        { model: Subcategory, as: 'subcategories', attributes: ['id', 'name'], required: false }
      ],
      attributes: ['id', 'name', 'emoji', 'order_index', 'is_default']
    });

    res.json(categories);
  } catch (err) {
    next(err);
  }
}

// GET /api/dashboard/cities
async function getCities(req, res, next) {
  try {
    const cities = await City.findAll({
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'state', 'country', 'slug']
    });
    res.json(cities);
  } catch (err) {
    next(err);
  }
}

// GET /api/dashboard/recent-events?limit=5
async function getRecentEvents(req, res, next) {
  try {
    console.log('Event.associations =>', Event.associations);
    const limit = Math.min(100, parseInt(req.query.limit || '10', 10) || 10);

    const events = await Event.findAll({
      where: { status: 'published' },
      order: [['start_time', 'DESC']],
      limit,
      include: [
        { model: EventMedia, as: 'media', attributes: ['id', 'url', 'media_type', 'order_index'], required: false },
        { model: City, as: 'city', attributes: ['id', 'name'], required: false }
      ],
      attributes: ['id', 'title', 'slug', 'start_time', 'end_time', 'price', 'is_free', 'venue_name', 'city_id']
    });

    res.json(events);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  getCategories,
  getCities,
  getRecentEvents
};
