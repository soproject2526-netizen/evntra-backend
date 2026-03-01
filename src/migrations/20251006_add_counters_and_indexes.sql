-- migrations/20251006_add_counters_and_indexes.sql
-- Run this against evntra_db (or convert to Sequelize migration)

-- 1) Add counters to events
ALTER TABLE events
  ADD COLUMN likes_count INT DEFAULT 0,
  ADD COLUMN comments_count INT DEFAULT 0,
  ADD COLUMN views_count INT DEFAULT 0,
  ADD COLUMN slug VARCHAR(255) NULL,
  ADD COLUMN deleted_at DATETIME NULL;

-- 2) Event media extra metadata
ALTER TABLE event_media
  ADD COLUMN thumbnail_url VARCHAR(1000) NULL,
  ADD COLUMN mime_type VARCHAR(80) NULL,
  ADD COLUMN storage_provider VARCHAR(50) NULL,
  ADD COLUMN storage_path VARCHAR(1000) NULL,
  ADD COLUMN transcoded BOOLEAN DEFAULT FALSE,
  ADD COLUMN deleted_at DATETIME NULL;

-- 3) Chat room participants table
CREATE TABLE IF NOT EXISTS chat_room_participants (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_city_start ON events (city_id, start_time);
CREATE INDEX IF NOT EXISTS idx_events_status_start ON events (status, start_time);
CREATE INDEX IF NOT EXISTS idx_event_media_event ON event_media (event_id);
CREATE INDEX IF NOT EXISTS idx_likes_event ON likes (event_id);
CREATE INDEX IF NOT EXISTS idx_comments_event ON comments (event_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events (slug);

-- 5) Fulltext (MySQL) — ensure MySQL support (utf8mb4); may fail if using older versions
ALTER TABLE events ADD FULLTEXT INDEX ft_events_title_desc (title, description);
