CREATE TABLE IF NOT EXISTS users (
	uuid CHAR(36) PRIMARY KEY NOT NULL DEFAULT (UUID()),	
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
	first_name VARCHAR(50) NOT NULL,
	last_name VARCHAR(50) NOT NULL,
  birthday DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS follows (
  follower_uuid CHAR(36) NOT NULL,
  followed_uuid CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (follower_uuid, followed_uuid),
  INDEX idx_follows_followed (followed_uuid, follower_uuid),

  CONSTRAINT fk_follows_follower
    FOREIGN KEY (follower_uuid) REFERENCES users(uuid) ON DELETE CASCADE,
  CONSTRAINT fk_follows_followed
    FOREIGN KEY (followed_uuid) REFERENCES users(uuid) ON DELETE CASCADE,
  CONSTRAINT chk_no_self_follow
    CHECK (follower_uuid <> followed_uuid)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS conversations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_low_uuid CHAR(36) NOT NULL,
  user_high_uuid CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_conversation_pair (user_low_uuid, user_high_uuid),

  CONSTRAINT fk_conversations_user_low
    FOREIGN KEY (user_low_uuid) REFERENCES users(uuid) ON DELETE CASCADE,
  CONSTRAINT fk_conversations_user_high
    FOREIGN KEY (user_high_uuid) REFERENCES users(uuid) ON DELETE CASCADE,
  CONSTRAINT chk_distinct_conversation_users
    CHECK (user_low_uuid < user_high_uuid)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT UNSIGNED NOT NULL,
  sender_uuid CHAR(36) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,

  INDEX idx_messages_conversation_created (conversation_id, created_at, id),

  CONSTRAINT fk_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender
    FOREIGN KEY (sender_uuid) REFERENCES users(uuid) ON DELETE CASCADE
) ENGINE=InnoDB;