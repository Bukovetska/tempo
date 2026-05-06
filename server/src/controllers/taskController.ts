import { Response } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../middleware/auth';

async function getUserTimezone(userId: string): Promise<string> {
  const result = await pool.query(
    'SELECT timezone FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0]?.timezone || 'Europe/Kyiv';
}

export async function getTasks(req: AuthRequest, res: Response): Promise<void> {
  const { date } = req.query as { date?: string };

  try {
    const userTz = await getUserTimezone(req.userId!);

    let query = `
      SELECT
        t.id,
        t.user_id,
        t.title,
        t.description,
        t.category,
        t.priority,
        TO_CHAR(t.scheduled_at AT TIME ZONE $1, 'YYYY-MM-DD"T"HH24:MI:SS') as scheduled_at,
        t.is_completed,
        t.completed_at,
        t.estimated_time,
        c.label as category_label,
        c.color as category_color
      FROM tasks t
      LEFT JOIN categories c ON t.category = c.id
      WHERE t.user_id = $2
    `;
    const params: string[] = [userTz, req.userId!];

    if (date) {
      query += ` AND DATE(t.scheduled_at AT TIME ZONE $1) = $3`;
      params.push(date);
    }

    query += ' ORDER BY scheduled_at ASC';

    const result = await pool.query(query, params);

    const tasks = result.rows.map((row) => ({
      id:            row.id,
      userId:        row.user_id,
      title:         row.title,
      description:   row.description,
      category:      row.category,
      priority:      row.priority,
      scheduledAt:   row.scheduled_at,
      isCompleted:   row.is_completed,
      completedAt:   row.completed_at,
      estimatedTime: row.estimated_time,
      categoryLabel: row.category_label || row.category,
      categoryColor: row.category_color || '#8b72be',
    }));

    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
}

export async function createTask(req: AuthRequest, res: Response): Promise<void> {
  const { title, description, category, priority, scheduledAt, estimatedTime } =
    req.body as {
      title:         string;
      description:   string;
      category:      string;
      priority:      string;
      scheduledAt:   string;
      estimatedTime: number;
    };

  if (!title || !category || !priority || !scheduledAt) {
    res.status(400).json({ error: 'Заповніть обов\'язкові поля' });
    return;
  }

  try {
    const userTz = await getUserTimezone(req.userId!);
    const id = `t_${Date.now()}`;

    await pool.query(
      `INSERT INTO tasks
        (id, user_id, title, description, category, priority, scheduled_at, estimated_time)
       VALUES ($1, $2, $3, $4, $5, $6, ($7::timestamp AT TIME ZONE $8), $9)`,
      [id, req.userId, title, description ?? '', category, priority, scheduledAt, userTz, estimatedTime ?? 30]
    );

    res.status(201).json({ id, message: 'Завдання створено' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
}

export async function updateTask(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { isCompleted, title, description, category, priority, scheduledAt, estimatedTime } =
    req.body as {
      isCompleted?:  boolean;
      title?:        string;
      description?:  string;
      category?:     string;
      priority?:     string;
      scheduledAt?:  string;
      estimatedTime?: number;
    };

  try {
    const userTz = await getUserTimezone(req.userId!);

    await pool.query(
      `UPDATE tasks SET
        is_completed   = COALESCE($1, is_completed),
        completed_at   = CASE WHEN $1 = true THEN NOW() WHEN $1 = false THEN NULL ELSE completed_at END,
        title          = COALESCE($2, title),
        description    = COALESCE($3, description),
        category       = COALESCE($4, category),
        priority       = COALESCE($5, priority),
        scheduled_at   = COALESCE(($6::timestamp AT TIME ZONE $7), scheduled_at),
        estimated_time = COALESCE($8, estimated_time)
       WHERE id = $9 AND user_id = $10`,
      [isCompleted ?? null, title ?? null, description ?? null,
       category ?? null, priority ?? null, scheduledAt ?? null,
       userTz, estimatedTime ?? null, id, req.userId]
    );
    if (scheduledAt) {
      await pool.query(
        'DELETE FROM email_logs WHERE task_id = $1 AND type = $2',
        [id, 'reminder']
      );
    }

    res.json({ message: 'Завдання оновлено' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
}

export async function deleteTask(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    res.json({ message: 'Завдання видалено' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
}