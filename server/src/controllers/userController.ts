import { Response } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../middleware/auth';

export async function updateSettings(req: AuthRequest, res: Response): Promise<void> {
  const { name, timezone, notificationsEnabled, weeklyReportEnabled, dailySummaryEnabled } =
    req.body as {
      name?:                 string;
      timezone?:             string;
      notificationsEnabled?: boolean;
      weeklyReportEnabled?:  boolean;
      dailySummaryEnabled?:  boolean;
    };

  try {
    await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        timezone = COALESCE($2, timezone),
        notifications_enabled = COALESCE($3, notifications_enabled),
        weekly_report_enabled = COALESCE($4, weekly_report_enabled),
        daily_summary_enabled = COALESCE($5, daily_summary_enabled)
       WHERE id = $6`,
      [
        name ?? null,
        timezone ?? null,
        notificationsEnabled ?? null,
        weeklyReportEnabled ?? null,
        dailySummaryEnabled ?? null,
        req.userId,
      ]
    );

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
    const user = result.rows[0];

    res.json({
      id:    user.id,
      name:  user.name,
      email: user.email,
      settings: {
        timezone:             user.timezone,
        notificationsEnabled: user.notifications_enabled,
        weeklyReportEnabled:  user.weekly_report_enabled,
        dailySummaryEnabled:  user.daily_summary_enabled,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
}
export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Користувача не знайдено' });
      return;
    }
    const user = result.rows[0];
    res.json({
      id:    user.id,
      name:  user.name,
      email: user.email,
      settings: {
        timezone:             user.timezone,
        notificationsEnabled: user.notifications_enabled,
        weeklyReportEnabled:  user.weekly_report_enabled,
        dailySummaryEnabled:  user.daily_summary_enabled,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
}