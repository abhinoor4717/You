-- Run once on a database created before this index was added to 001_schema.sql.
ALTER TABLE messages ADD INDEX idx_messages_conversation_id (conversation_id, id);
