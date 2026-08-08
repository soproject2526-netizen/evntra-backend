const { Event, EventMedia, EventSubcategory, User } = require('../models');
const cloudinary = require("../cloudinary");
const { Readable } = require("stream");
const fs = require('fs');
const path = require('path');
const jwt = require("jsonwebtoken");

function uploadBufferToCloudinary(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      return reject(new Error("Invalid uploaded file"));
    }

    const isVideo =
      file.mimetype &&
      file.mimetype.startsWith("video/");

    const resourceType = isVideo ? "video" : "image";

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "events",
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },

      (error, result) => {
        if (error) {
          console.error(
            "❌ CLOUDINARY UPLOAD ERROR:",
            error
          );

          return reject(error);
        }

        if (!result || !result.secure_url) {
          return reject(
            new Error(
              "Cloudinary upload completed without a secure URL"
            )
          );
        }

        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
}

// CREATE EVENT
async function createEvent(req, res) {
  const transaction = await Event.sequelize.transaction();
  const uploadedCloudinaryAssets = [];

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
      end_time,
    } = req.body;

    const organizer_id = req.user.id;

    if (!organizer_id) {
      if (!transaction.finished) {
        await transaction.rollback();
      }

      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user found",
      });
    }

    if (
      !title ||
      !start_time ||
      !category_id ||
      !city_id ||
      !venue_name ||
      !address
    ) {
      if (!transaction.finished) {
        await transaction.rollback();
      }

      return res.status(400).json({
        success: false,
        message:
          "title, start_time, category_id, city_id, venue_name and address are required",
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user || user.role !== "organizer") {
      if (!transaction.finished) {
        await transaction.rollback();
      }

      return res.status(403).json({
        success: false,
        message: "Only organizers can create events",
      });
    }

    // --------------------------------------------------
    // CREATE EVENT
    // --------------------------------------------------

    const event = await Event.create(
      {
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
        status: "published",
      },
      { transaction }
    );

    // --------------------------------------------------
    // SUBCATEGORIES
    // --------------------------------------------------

    if (
      Array.isArray(subcategory_ids) &&
      subcategory_ids.length > 0
    ) {
      const mappings = subcategory_ids.map((subId) => ({
        event_id: event.id,
        subcategory_id: subId,
      }));

      await EventSubcategory.bulkCreate(
        mappings,
        { transaction }
      );
    }

    // --------------------------------------------------
    // CLOUDINARY MEDIA
    // --------------------------------------------------

    let primaryMedia = null;

    if (req.files && req.files.length > 0) {
      console.log(
        `📦 TOTAL MEDIA FILES RECEIVED: ${req.files.length}`
      );

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];

        console.log("====================================");
        console.log(`📤 UPLOADING MEDIA ${i + 1}`);
        console.log("Original name:", file.originalname);
        console.log("MIME type:", file.mimetype);
        console.log("Size:", file.size);
        console.log("====================================");

        const isVideo =
          file.mimetype &&
          file.mimetype.startsWith("video/");

        const mediaType = isVideo
          ? "video"
          : "image";

        let cloudinaryResult;

        try {
          cloudinaryResult =
            await uploadBufferToCloudinary(file);
        } catch (uploadError) {
          console.error(
            `❌ CLOUDINARY FAILED FOR FILE: ${file.originalname}`,
            uploadError
          );

          throw new Error(
            `Failed to upload ${file.originalname}: ${uploadError.message}`
          );
        }

        console.log(
          `✅ CLOUDINARY UPLOAD SUCCESS: ${file.originalname}`
        );

        console.log(
          "Cloudinary URL:",
          cloudinaryResult.secure_url
        );

        // ------------------------------------------------
        // TRACK CLOUDINARY ASSET FOR CLEANUP
        // ------------------------------------------------

        uploadedCloudinaryAssets.push({
          public_id:
            cloudinaryResult.public_id,

          resource_type:
            cloudinaryResult.resource_type,
        });

        // ------------------------------------------------
        // SAVE MEDIA TO MYSQL
        // ------------------------------------------------

        const media = await EventMedia.create(
          {
            event_id: event.id,

            media_type: mediaType,

            original_filename:
              file.originalname,

            storage_filename:
              cloudinaryResult.public_id,

            url:
              cloudinaryResult.secure_url,

            order_index: i,

            width:
              cloudinaryResult.width || null,

            height:
              cloudinaryResult.height || null,

            duration_seconds:
              cloudinaryResult.duration || null,

            mime_type:
              file.mimetype,

            storage_provider:
              "cloudinary",

            storage_path:
              cloudinaryResult.public_id,

            transcoded: 1,
          },
          { transaction }
        );

        if (i === 0) {
          primaryMedia = {
            id: media.id,
            media_type: media.media_type,
            url: media.url,
          };
        }
      }
    }

    // --------------------------------------------------
    // COMMIT DATABASE
    // --------------------------------------------------

    await transaction.commit();

    // --------------------------------------------------
    // FETCH SAVED MEDIA
    // --------------------------------------------------

    const mediaList = await EventMedia.findAll({
      where: {
        event_id: event.id,
      },

      order: [
        ["order_index", "ASC"],
      ],
    });

    const media = mediaList.map((m) => ({
      id: m.id,
      media_type: m.media_type,
      url: m.url,
      original_filename:
        m.original_filename,
    }));

    // --------------------------------------------------
    // SUCCESS RESPONSE
    // --------------------------------------------------

    return res.status(201).json({
      success: true,

      message:
        "Event created successfully",

      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        start_time: event.start_time,
        end_time: event.end_time,
        venue_name: event.venue_name,
        address: event.address,
        lat: event.lat,
        lng: event.lng,
        price: event.price,
        is_free: event.is_free,

        primary_media:
          primaryMedia,

        media: media,
      },
    });

  } catch (error) {
    console.error(
      "❌ EVENT CREATION FAILED:",
      error
    );

    // --------------------------------------------------
    // DATABASE ROLLBACK
    // --------------------------------------------------

    try {
      if (!transaction.finished) {
        await transaction.rollback();
      }
    } catch (rollbackError) {
      console.error(
        "❌ DATABASE ROLLBACK FAILED:",
        rollbackError
      );
    }

    // --------------------------------------------------
    // CLOUDINARY CLEANUP
    // --------------------------------------------------

    for (const asset of uploadedCloudinaryAssets) {
      try {
        if (!asset.public_id) {
          continue;
        }

        await cloudinary.uploader.destroy(
          asset.public_id,
          {
            resource_type:
              asset.resource_type || "image",
          }
        );

        console.log(
          `🗑️ CLOUDINARY CLEANUP SUCCESS: ${asset.public_id}`
        );

      } catch (cleanupError) {
        console.error(
          `⚠️ CLOUDINARY CLEANUP FAILED: ${asset.public_id}`,
          cleanupError
        );
      }
    }

    return res.status(500).json({
      success: false,
      message:
        "Event creation failed",
      error: error.message,
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
// 🟢 UPLOAD SINGLE EVENT MEDIA TO CLOUDINARY
async function uploadEventMedia(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    console.log("====================================");
    console.log("📤 SINGLE EVENT MEDIA UPLOAD");
    console.log("Original name:", req.file.originalname);
    console.log("MIME type:", req.file.mimetype);
    console.log("Size:", req.file.size);
    console.log("====================================");

    if (!req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "Uploaded file buffer is missing"
      });
    }

    const isVideo =
      req.file.mimetype &&
      req.file.mimetype.startsWith("video/");

    const mediaType = isVideo ? "video" : "image";

    const cloudinaryResult =
      await uploadBufferToCloudinary(req.file);

    console.log(
      "✅ CLOUDINARY UPLOAD SUCCESS:",
      req.file.originalname
    );

    return res.status(201).json({
      success: true,
      message: "Media uploaded successfully",
      media_type: mediaType,
      url: cloudinaryResult.secure_url,
      filename: cloudinaryResult.public_id,
      public_id: cloudinaryResult.public_id,
      resource_type: cloudinaryResult.resource_type
    });

  } catch (error) {
    console.error(
      "❌ UPLOAD MEDIA ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Media upload failed",
      error: error.message
    });
  }
}

//  UPDATE EVENT MEDIA (SAVE TO event_media TABLE)
// 🟢 UPDATE EVENT MEDIA
// SAVE MULTIPLE MEDIA FILES TO CLOUDINARY + event_media TABLE
async function updateEventMedia(req, res) {
  const transaction = await Event.sequelize.transaction();

  const uploadedCloudinaryAssets = [];

  try {
    const { id } = req.params;

    if (!id) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Event ID is required"
      });
    }

    const event = await Event.findByPk(id, {
      transaction
    });

    if (!event) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    if (!req.files || req.files.length === 0) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "No files uploaded"
      });
    }

    console.log("====================================");
    console.log("📦 UPDATE EVENT MEDIA");
    console.log("Event ID:", id);
    console.log("Files received:", req.files.length);
    console.log("====================================");

    const mediaEntries = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      console.log("------------------------------------");
      console.log(`📤 Uploading media ${i + 1}`);
      console.log("Original name:", file.originalname);
      console.log("MIME type:", file.mimetype);
      console.log("Size:", file.size);
      console.log("------------------------------------");

      if (!file.buffer) {
        throw new Error(
          `Uploaded file buffer is missing for ${file.originalname}`
        );
      }

      const isVideo =
        file.mimetype &&
        file.mimetype.startsWith("video/");

      const mediaType = isVideo
        ? "video"
        : "image";

      // Upload to Cloudinary
      const cloudinaryResult =
        await uploadBufferToCloudinary(file);

      if (
        !cloudinaryResult ||
        !cloudinaryResult.secure_url
      ) {
        throw new Error(
          `Cloudinary upload failed for ${file.originalname}`
        );
      }

      console.log(
        "✅ Cloudinary URL:",
        cloudinaryResult.secure_url
      );

      // Keep track of uploaded assets.
      // If database insertion fails later,
      // these files will be deleted from Cloudinary.
      uploadedCloudinaryAssets.push({
        public_id: cloudinaryResult.public_id,
        resource_type:
          cloudinaryResult.resource_type ||
          (isVideo ? "video" : "image")
      });

      const media = await EventMedia.create(
        {
          event_id: id,

          media_type: mediaType,

          original_filename:
            file.originalname,

          storage_filename:
            cloudinaryResult.public_id,

          url:
            cloudinaryResult.secure_url,

          order_index: i,

          width:
            cloudinaryResult.width || null,

          height:
            cloudinaryResult.height || null,

          duration_seconds:
            cloudinaryResult.duration || null,

          mime_type:
            file.mimetype,

          storage_provider:
            "cloudinary",

          storage_path:
            cloudinaryResult.public_id,

          transcoded:
            1
        },
        {
          transaction
        }
      );

      mediaEntries.push({
        id: media.id,
        media_type: media.media_type,
        original_filename: media.original_filename,
        url: media.url,
        order_index: media.order_index
      });
    }

    await transaction.commit();

    console.log(
      `✅ ${mediaEntries.length} MEDIA FILE(S) SAVED SUCCESSFULLY`
    );

    return res.status(201).json({
      success: true,
      message: "Media uploaded successfully",
      event_id: Number(id),
      total_uploaded: mediaEntries.length,
      media: mediaEntries
    });

  } catch (error) {
    console.error(
      "❌ UPLOAD EVENT MEDIA ERROR:",
      error
    );

    // Rollback database changes
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error(
        "⚠️ DATABASE ROLLBACK FAILED:",
        rollbackError
      );
    }

    // Delete any Cloudinary files that were already uploaded
    // before the database operation failed.
    for (const asset of uploadedCloudinaryAssets) {
      try {
        await cloudinary.uploader.destroy(
          asset.public_id,
          {
            resource_type:
              asset.resource_type
          }
        );

        console.log(
          "🗑️ CLOUDINARY CLEANUP SUCCESS:",
          asset.public_id
        );

      } catch (cleanupError) {
        console.error(
          "⚠️ CLOUDINARY CLEANUP FAILED:",
          asset.public_id,
          cleanupError
        );
      }
    }

    return res.status(500).json({
      success: false,
      message: "Media upload failed",
      error: error.message
    });
  }
}


module.exports = {
  createEvent,
  uploadEventMedia,
  updateEventMedia,
  becomeOrganizer
};
