// src/controllers/mediaController.js
const AWS = require('aws-sdk');
const { EventMedia, Event } = require('../models');
const { v4: uuidv4 } = require('uuid');

/**
 * Config:
 * Set these env vars in .env:
 *  - S3_BUCKET
 *  - S3_REGION
 *  - AWS_ACCESS_KEY_ID
 *  - AWS_SECRET_ACCESS_KEY
 *  - S3_SIGN_EXPIRATION (seconds, default 300)
 */

const s3 = new AWS.S3({
  region: process.env.S3_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

function getPresignParams(key, contentType, expires) {
  return {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Expires: expires || parseInt(process.env.S3_SIGN_EXPIRATION || '300', 10),
    ContentType: contentType,
    ACL: 'public-read'
  };
}

/**
 * POST /api/media/sign-s3
 * Body: { filename, contentType, event_id }
 * Returns: { uploadUrl, key, publicUrl }
 */
async function signS3(req, res, next) {
  try {
    const { filename, contentType, event_id } = req.body;
    if (!filename || !contentType) return res.status(400).json({ message: 'filename and contentType required' });

    const ext = filename.split('.').pop();
    const key = `events/${event_id || 'unassigned'}/${uuidv4()}.${ext}`;
    const uploadParams = getPresignParams(key, contentType);
    const uploadUrl = await s3.getSignedUrlPromise('putObject', uploadParams);
    const publicUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;

    return res.json({ uploadUrl, key, publicUrl });
  } catch (err) { next(err); }
}

/**
 * POST /api/events/:id/media/complete
 * Body: { key, media_type, width, height, duration_seconds, thumbnail_url, mime_type }
 * This registers the media entry after upload.
 */
async function completeMedia(req, res, next) {
  try {
    const eventId = req.params.id;
    const { key, media_type='image', width=null, height=null, duration_seconds=null, thumbnail_url=null, mime_type=null } = req.body;
    if (!key) return res.status(400).json({ message: 'key required' });

    // compute public url
    const publicUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;

    const media = await EventMedia.create({
      event_id: eventId,
      media_type,
      url: publicUrl,
      order_index: 0,
      width,
      height,
      duration_seconds,
      thumbnail_url,
      mime_type,
      storage_provider: 's3',
      storage_path: key,
      transcoded: !!(duration_seconds)
    });

    return res.status(201).json(media);
  } catch (err) { next(err); }
}

module.exports = { signS3, completeMedia };
