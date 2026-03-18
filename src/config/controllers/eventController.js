const { Event, EventMedia, EventSubcategory, User } = require('../models');
const fs = require('fs');
const path = require('path');
const jwt = require("jsonwebtoken");

// CREATE EVENT
async function createEvent(req, res) {
  const transaction = await Event.sequelize.transaction();
  try {
    const {
      category_id,
      subcategory_ids,
      title,
      description,
      city_id,
      venue_name,
      address,
      lat,
      lng,
      price,
      currency,
      is_free,
      capacity,
      start_time,
      end_time
    } = req.body;

    const organizer_id = req.user.id;
    if (!organizer_id) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user found"
      });
    }


    if (!title || !start_time || !category_id || !city_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "title, start_time, category_id, city_id are required"
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user || user.role !== "organizer") {
      return res.status(403).json({
        success: false,
        message: "Only organizers can create events"
      });
    }

    //  Create Event
    const event = await Event.create({
      organizer_id,
      category_id,
      title,
      description,
      city_id,
      venue_name,
      address,
      lat,
      lng,
      price: is_free ? 0 : price,
      currency: currency || "INR",
      is_free: Boolean(is_free),
      capacity: capacity || 0,
      start_time,
      end_time,
      status: "published"
    }, { transaction });

    if (Array.isArray(subcategory_ids) && subcategory_ids.length > 0) {
      const mappings = subcategory_ids.map(subId => ({
        event_id: event.id,
        subcategory_id: subId
      }));

      await EventSubcategory.bulkCreate(mappings, { transaction });
    }

    //  Save Media (if any)
    let primaryMedia = null;

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];

        const ext = path.extname(file.originalname).toLowerCase();

        const videoExtensions = [".mp4", ".mov", ".mkv"];

        const mediaType = videoExtensions.includes(ext) ? "video" : "image";

        const mediaUrl = `${process.env.APP_URL}/uploads/events/${file.filename}`;

        const media = await EventMedia.create({
          event_id: event.id,
          media_type: mediaType,
          original_filename: file.originalname,
          storage_filename: file.filename,
          url: mediaUrl,
          order_index: i,
          mime_type: file.mimetype,
          storage_provider: "local",
          storage_path: `/uploads/events/${file.filename}`,
          transcoded: 0
        }, { transaction });

        if (i === 0) {
          primaryMedia = {
            id: media.id,
            media_type: media.media_type,
            url: media.url
          };
        }
      }
    }

    await transaction.commit();

    const mediaList = await EventMedia.findAll({
      where: { event_id: event.id },
      order: [['order_index', 'ASC']]
    });

    const media = mediaList.map(m => ({
      id: m.id,
      media_type: m.media_type,
      url: m.url,
      original_filename: m.original_filename,
    }));

    // 3️⃣ Dashboard-ready response
    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        start_time: event.start_time,
        end_time: event.end_time,
        venue_name: event.venue_name,
        price: event.price,
        is_free: event.is_free,
        primary_media: primaryMedia,
        media: media
      }
    });

  } catch (error) {

    console.log("=====================================");
    console.log("❌ EVENT CREATION FAILED");
    console.log("TIME:", new Date().toISOString());
    console.log("REQUEST BODY:", req.body);
    console.log("FILES:", req.files);
    console.log("ERROR MESSAGE:", error.message);
    console.log("ERROR STACK:", error.stack);
    console.log("=====================================");

    await transaction.rollback();

    return res.status(500).json({
      success: false,
      message: "Event creation failed",
      error: error.message
    });
  }
}

//Became organizer
async function becomeOrganizer(req, res) {
  try {
    console.log("USER FROM TOKEN:", req.user);

    const user = await User.findByPk(req.user.id);

    console.log("USER FROM DB BEFORE:", user.toJSON());

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await user.update({ role: "organizer" });

    await user.reload(); // 🔥 VERY IMPORTANT

    console.log("USER AFTER UPDATE:", user.toJSON());

    return res.json({
      success: true,
      message: "You are now an organizer"
    });

  } catch (error) {
    console.error("BECOME ORGANIZER ERROR", error);

    return res.status(500).json({
      success: false,
      message: "Failed to become organizer"
    });
  }
}
// 🟢 UPLOAD EVENT MEDIA
async function uploadEventMedia(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";
    const mediaUrl = `${process.env.APP_URL}/uploads/events/${req.file.filename}`;

    res.json({
      message: "Media uploaded successfully",
      media_type: mediaType,
      url: mediaUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error("UPLOAD MEDIA ERROR:", error);
    res.status(500).json({ message: error.message });
  }
}

//  UPDATE EVENT MEDIA (SAVE TO event_media TABLE)
async function updateEventMedia(req, res) {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const mediaEntries = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      const mediaType = file.mimetype.startsWith("video")
        ? "video"
        : "image";

      const mediaUrl = `${process.env.APP_URL}/uploads/events/${file.filename}`;

      const media = await EventMedia.create({
        event_id: id,
        media_type: mediaType,
        original_filename: file.originalname,
        storage_filename: file.filename,
        url: mediaUrl,
        order_index: i,
        mime_type: file.mimetype,
        storage_provider: "local",
        storage_path: `/uploads/events/${file.filename}`,
        transcoded: 0
      });

      mediaEntries.push(media);
    }

    return res.json({
      success: true,
      message: "Media uploaded successfully",
      total_uploaded: mediaEntries.length
    });

  } catch (error) {
    console.error("UPLOAD EVENT MEDIA ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Media upload failed"
    });
  }
}


module.exports = {
  createEvent,
  uploadEventMedia,
  updateEventMedia,
  becomeOrganizer
};
