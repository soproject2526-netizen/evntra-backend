// src/controllers/adminEventController.js
const { Event, EventMedia, EventSubcategory } = require('../models');

async function createEvent(req, res, next) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Auth required' });

    const payload = req.body;
    // minimal required validation
    if (!payload.title || !payload.start_time) return res.status(400).json({ message: 'title and start_time required' });

    const event = await Event.create({
      organizer_id: user.id,
      title: payload.title,
      description: payload.description || null,
      city_id: payload.city_id || null,
      venue_name: payload.venue_name || null,
      address: payload.address || null,
      lat: payload.lat || null,
      lng: payload.lng || null,
      price: payload.price || 0,
      currency: payload.currency || 'INR',
      is_free: payload.is_free || false,
      start_time: payload.start_time,
      end_time: payload.end_time || null,
      status: payload.status || 'draft',
      slug: payload.slug || null
    });

    // attach subcategories if provided (array of ids)
    if (Array.isArray(payload.subcategories) && payload.subcategories.length) {
      await Promise.all(payload.subcategories.map(sid => EventSubcategory.create({ event_id: event.id, subcategory_id: sid })));
    }

    return res.status(201).json(event);
  } catch (err) { next(err); }
}

module.exports = { createEvent };
