import { db } from './database.js';

// Cria as tabelas caso ainda não existam. Idempotente.
export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT    NOT NULL,
      email           TEXT    NOT NULL UNIQUE,
      password_hash   TEXT    NOT NULL,
      hsk_level       INTEGER NOT NULL DEFAULT 1,
      streak_count    INTEGER NOT NULL DEFAULT 0,
      last_study_date TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vocabulary (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      hanzi       TEXT    NOT NULL,
      pinyin      TEXT    NOT NULL,
      translation TEXT    NOT NULL,
      hsk_level   INTEGER NOT NULL,
      example     TEXT,
      UNIQUE (hanzi, hsk_level)
    );

    CREATE TABLE IF NOT EXISTS progress (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      vocabulary_id INTEGER NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
      box           INTEGER NOT NULL DEFAULT 0,
      status        TEXT    NOT NULL DEFAULT 'learning',
      correct_count INTEGER NOT NULL DEFAULT 0,
      wrong_count   INTEGER NOT NULL DEFAULT 0,
      last_reviewed TEXT,
      next_review   TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE (user_id, vocabulary_id)
    );

    CREATE INDEX IF NOT EXISTS idx_vocabulary_level  ON vocabulary (hsk_level);
    CREATE INDEX IF NOT EXISTS idx_progress_user     ON progress (user_id);
    CREATE INDEX IF NOT EXISTS idx_progress_due      ON progress (user_id, next_review);
  `);
}
