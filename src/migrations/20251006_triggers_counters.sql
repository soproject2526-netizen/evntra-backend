-- migrations/20251006_triggers_counters.sql
-- Creates triggers to increment/decrement likes_count when likes table changes
DELIMITER $$

DROP TRIGGER IF EXISTS trg_like_insert$$
CREATE TRIGGER trg_like_insert AFTER INSERT ON likes
FOR EACH ROW
BEGIN
  UPDATE events SET likes_count = likes_count + 1 WHERE id = NEW.event_id;
END$$

DROP TRIGGER IF EXISTS trg_like_delete$$
CREATE TRIGGER trg_like_delete AFTER DELETE ON likes
FOR EACH ROW
BEGIN
  UPDATE events SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.event_id;
END$$

DROP TRIGGER IF EXISTS trg_comment_insert$$
CREATE TRIGGER trg_comment_insert AFTER INSERT ON comments
FOR EACH ROW
BEGIN
  UPDATE events SET comments_count = comments_count + 1 WHERE id = NEW.event_id;
END$$

DROP TRIGGER IF EXISTS trg_comment_delete$$
CREATE TRIGGER trg_comment_delete AFTER DELETE ON comments
FOR EACH ROW
BEGIN
  UPDATE events SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.event_id;
END$$

DELIMITER ;
