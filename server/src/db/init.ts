import pool from './pool';

export async function initDatabase(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      timezone    TEXT DEFAULT 'Europe/Kyiv',
      notifications_enabled  BOOLEAN DEFAULT true,
      weekly_report_enabled  BOOLEAN DEFAULT false,
      daily_summary_enabled  BOOLEAN DEFAULT true,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id             TEXT PRIMARY KEY,
      user_id        TEXT REFERENCES users(id) ON DELETE CASCADE,
      title          TEXT NOT NULL,
      description    TEXT DEFAULT '',
      category       TEXT NOT NULL,
      priority       TEXT NOT NULL,
      scheduled_at   TIMESTAMPTZ NOT NULL,
      is_completed   BOOLEAN DEFAULT false,
      completed_at   TIMESTAMPTZ,
      estimated_time INTEGER DEFAULT 30
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id         TEXT PRIMARY KEY,
      user_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
      label      TEXT NOT NULL,
      color      TEXT DEFAULT '#8b72be',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id         SERIAL PRIMARY KEY,
      user_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
      task_id    TEXT,
      type       TEXT NOT NULL,
      sent_at    TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reset_codes (
      id         SERIAL PRIMARY KEY,
      email      TEXT NOT NULL,
      code       TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used       BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log('✅ Таблиці створено');
}