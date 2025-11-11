-- Create a database/schema
CREATE DATABASE IF NOT EXISTS auth_demo
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE auth_demo;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email         VARCHAR(191)     NOT NULL,
  password_hash VARCHAR(255)     NOT NULL,
  created_at    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email)
);

SELECT * FROM auth_demo.users;

-- Optional: create app user (replace password!)
CREATE USER IF NOT EXISTS 'auth_user'@'%' IDENTIFIED BY 'STRONG_DB_PASSWORD';
GRANT ALL PRIVILEGES ON auth_demo.* TO 'auth_user'@'%';
FLUSH PRIVILEGES;


USE auth_demo;

CREATE TABLE IF NOT EXISTS posts (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  title      VARCHAR(200)    NOT NULL,
  body       TEXT            NOT NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_posts_created_at (created_at),
  CONSTRAINT fk_posts_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

SELECT * FROM auth_demo.posts;

USE auth_demo;

ALTER TABLE posts
  ADD COLUMN visibility ENUM('PUBLIC','PRIVATE') NOT NULL DEFAULT 'PUBLIC'
  AFTER body;

-- (Optional) backfill old rows to PUBLIC
UPDATE posts SET visibility='PUBLIC' WHERE visibility IS NULL;

