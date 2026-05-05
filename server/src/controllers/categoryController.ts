import { Response } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../middleware/auth';

const PALETTE = [
  '#8b72be',
  '#c07090', 
  '#c8a84b', 
  '#7aab8e', 
  '#5b8fd4', 
  '#e07b3f', 
  '#c0392b', 
  '#16a085', 
  '#34495e', 
  '#9b59b6', 
  '#d35400', 
  '#2c3e50', 
];

async function pickAvailableColor(userId: string): Promise<string> {
  const result = await pool.query(
    'SELECT color FROM categories WHERE user_id = $1',
    [userId]
  );
  const usedColors = result.rows.map((r) => r.color);

  for (let i = 0; i < PALETTE.length; i++) {
    if (!usedColors.includes(PALETTE[i])) {
      return PALETTE[i];
    }
  }
  return PALETTE[0];
}

export async function getCategories(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      'SELECT * FROM categories WHERE user_id = $1 ORDER BY created_at ASC',
      [req.userId]
    );
    res.json(result.rows.map((r) => ({
      id:    r.id,
      label: r.label,
      color: r.color,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
}

export async function createCategory(req: AuthRequest, res: Response): Promise<void> {
  const { label, color } = req.body as { label: string; color?: string };

  if (!label?.trim()) {
    res.status(400).json({ error: 'Введіть назву категорії' });
    return;
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM categories WHERE user_id = $1 AND LOWER(label) = LOWER($2)',
      [req.userId, label.trim()]
    );
    if (existing.rows.length > 0) {
      res.status(400).json({ error: 'Така категорія вже існує' });
      return;
    }

    let finalColor: string;
    if (color) {
      finalColor = color;
    } else {
      finalColor = await pickAvailableColor(req.userId!);
    }

    const id = `cat_${Date.now()}`;
    await pool.query(
      'INSERT INTO categories (id, user_id, label, color) VALUES ($1, $2, $3, $4)',
      [id, req.userId, label.trim(), finalColor]
    );

    res.status(201).json({ id, label: label.trim(), color: finalColor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
}

export async function updateCategory(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { label, color } = req.body as { label?: string; color?: string };

  if (!label && !color) {
    res.status(400).json({ error: 'Нічого не змінено' });
    return;
  }

  try {
    const own = await pool.query(
      'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (own.rows.length === 0) {
      res.status(404).json({ error: 'Категорію не знайдено' });
      return;
    }

    if (label && label.trim()) {
      const dup = await pool.query(
        'SELECT id FROM categories WHERE user_id = $1 AND LOWER(label) = LOWER($2) AND id != $3',
        [req.userId, label.trim(), id]
      );
      if (dup.rows.length > 0) {
        res.status(400).json({ error: 'Категорія з такою назвою вже існує' });
        return;
      }
    }

    await pool.query(
      `UPDATE categories SET
        label = COALESCE($1, label),
        color = COALESCE($2, color)
       WHERE id = $3 AND user_id = $4`,
      [label?.trim() ?? null, color ?? null, id, req.userId]
    );

    const updated = await pool.query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );
    const r = updated.rows[0];
    res.json({ id: r.id, label: r.label, color: r.color });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
}
export async function deleteCategory(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const own = await pool.query(
      'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (own.rows.length === 0) {
      res.status(404).json({ error: 'Категорію не знайдено' });
      return;
    }

    await pool.query(
      `UPDATE tasks SET category = 'personal'
       WHERE category = $1 AND user_id = $2`,
      [id, req.userId]
    );
    await pool.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    res.json({ message: 'Категорію видалено, задачі перенесено в "Особисте"' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
}