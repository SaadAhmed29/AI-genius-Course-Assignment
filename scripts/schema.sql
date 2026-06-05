-- Run this once to set up the database schema
-- psql -U postgres -d ai_genius -f scripts/schema.sql

-- Drop tables if re-running (safe for dev resets)
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;

-- Role type — only three valid roles in this platform
CREATE TYPE user_role AS ENUM ('Admin', 'Premium_User', 'Free_User');

-- Users table
CREATE TABLE users (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255)        NOT NULL,   -- always bcrypt-hashed, never plain text
  role       user_role           NOT NULL DEFAULT 'Free_User',
  created_at TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- Refresh token whitelist
-- Storing hashed tokens is even better in production, but plain is fine for a course project
CREATE TABLE refresh_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT         NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ  NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index speeds up the lookup that happens on every /api/auth/refresh call
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
