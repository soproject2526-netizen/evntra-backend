// src/controllers/eventDetailController.js
const { Event, EventMedia, Subcategory, User, Like, Favorite, Comment, EventParticipant, City } = require('../models');
const { Op } = require('sequelize');
const { format } = require('date-fns');

/**
 * GET /api/events/:id
 * Return full event detail for dashboard / event detail screen.
 */
async function getEventDetail(req, res, next) {
  try {
    const eventId = Number(req.params.id);
    const userId = req.user?.id || null;

    if (!eventId) {
      return res.status(400).json({ message: 'Invalid event id' });
    }

    const event = await Event.findOne({
      where: { id: eventId, status: 'published' },
      attributes: [
        'id', 'title', 'description', 'start_time', 'end_time',
        'city_id', 'venue_name', 'address',
        'price', 'currency', 'is_free',
        'likes_count', 'comments_count', 'views_count'
      ],
      include: [
        {
          model: EventMedia,
          as: 'media',
          attributes: [
            'id', 'media_type', 'url',
            'order_index', 'width', 'height',
            'thumbnail_url', 'duration_seconds'
          ]
        },
        {
          model: Subcategory,
          as: 'subcategories',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'full_name', 'profile_image', 'phone', 'email']
        },
        {
          model: City,
          as: 'city',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // --- Likes / Favorites
    const [like, favorite] = userId
      ? await Promise.all([
        Like.findOne({ where: { event_id: eventId, user_id: userId } }),
        Favorite.findOne({ where: { event_id: eventId, user_id: userId } })
      ])
      : [null, null];

    // --- Participants
    const [participantsCount, participantRows] = await Promise.all([
      EventParticipant.count({ where: { event_id: eventId } }),
      EventParticipant.findAll({
        where: { event_id: eventId },
        include: [{ model: User, as: 'user', attributes: ['id', 'profile_image'] }],
        limit: 5
      })
    ]);

    // --- Media handling
    const media = event.media || [];

    const heroImage =
      media.find(m => m.media_type === 'image') || null;

    const backgroundImage =
      heroImage?.url || null;

    const gallery = media.map(m => ({
      id: m.id,
      type: m.media_type,
      url: m.url,
      thumbnail_url:
        m.thumbnail_url ||
        (m.media_type === 'video'
          ? '/uploads/default-video-thumb.jpg'
          : null),
      width: m.width || 0,
      height: m.height || 0,
      duration_seconds: m.duration_seconds || null
    }));

    return res.json({
      id: event.id,
      title: event.title,
      description: event.description,
      schedule: {
        start_time: event.start_time,
        end_time: event.end_time,
        start_date_label: format(new Date(event.start_time), 'dd MMM, yyyy'),
        end_date_label: format(new Date(event.end_time), 'dd MMM, yyyy')
      },
      location: {
        city: event.city ? {
          id: event.city.id,
          name: event.city.name
        } : null,
        venue_name: event.venue_name,
        address: event.address
      },
      pricing: {
        is_free: !!event.is_free,
        price: event.price,
        currency: event.currency
      },
      stats: {
        likes: event.likes_count || 0,
        comments: event.comments_count || 0,
        views: event.views_count || 0,
        is_liked_by_user: !!like,
        is_favorited_by_user: !!favorite
      },
      media_assets: {
        background_image: backgroundImage,
        hero_image: heroImage
      },
      gallery,
      subcategories: event.subcategories || [],
      organizer: event.organizer
        ? {
          id: event.organizer.id,
          name: event.organizer.full_name,
          avatar_url: event.organizer.profile_image
        }
        : null,
      organizer_contact: {
        phone: event.organizer.phone || null,
        email: event.organizer.email || null
      },
      members: {
        count: participantsCount,
        count_label:
          participantsCount >= 1000
            ? `${(participantsCount / 1000).toFixed(1)}k Members joined`
            : `${participantsCount} Members joined`,
        avatars: participantRows.map(p => ({
          id: p.user.id,
          avatar_url: p.user.profile_image
        }))
      },
      ui_flags: {
        can_chat_with_organizer: true,
        can_call_organizer: !!event.organizer.phone,
        can_join_event: true,
        show_buy_ticket_button: !event.is_free
      }
    });
  } catch (err) {
    console.error('Event detail error:', err);
    next(err);
  }
}

module.exports = { getEventDetail };
