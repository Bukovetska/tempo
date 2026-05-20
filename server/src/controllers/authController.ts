import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/pool';
import dotenv from 'dotenv';

dotenv.config();

async function createDefaultCategories(userId: string): Promise<void> {
  const defaults = [
    { key: 'work',     label: 'Робота',    color: '#8b72be' },
    { key: 'study',    label: 'Навчання',  color: '#c07090' },
    { key: 'personal', label: 'Особисте',  color: '#c8a84b' },
    { key: 'health',   label: "Здоров'я",  color: '#7aab8e' },
  ];

  for (const item of defaults) {
    const uniqueCatId = `${item.key}_${userId}`; 

    await pool.query(
      `INSERT INTO categories (id, user_id, label, color)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [uniqueCatId, userId, item.label, item.color]
    );
  }
}
export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body as {
    name: string;
    email: string;
    password: string;
  };

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Заповніть усі поля' });
    return;
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      res.status(400).json({ error: 'Користувач з таким email вже існує' });
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const id   = `u_${Date.now()}`;

    await pool.query(
      `INSERT INTO users (id, name, email, password)
       VALUES ($1, $2, $3, $4)`,
      [id, name, email, hash]
    );
    await createDefaultCategories(id);

    const token = jwt.sign(
      { userId: id },
      process.env.JWT_SECRET ?? '',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id, name, email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as {
    email: string;
    password: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: 'Заповніть усі поля' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      res.status(400).json({ error: 'Користувача не знайдено' });
      return;
    }

    const user  = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      res.status(400).json({ error: 'Невірний пароль' });
      return;
    }
    const catCheck = await pool.query(
      `SELECT COUNT(*) FROM categories WHERE user_id = $1`,
      [user.id]
    );
    if (Number(catCheck.rows[0].count) < 4) {
      await createDefaultCategories(user.id);
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET ?? '',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id:       user.id,
        name:     user.name,
        email:    user.email,
        settings: {
          timezone:              user.timezone,
          notificationsEnabled:  user.notifications_enabled,
          weeklyReportEnabled:   user.weekly_report_enabled,
          dailySummaryEnabled:   user.daily_summary_enabled,
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
}

export { createDefaultCategories };