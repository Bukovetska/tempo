import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db/pool';
import { sendResetCode } from '../services/emailService';

export async function requestResetCode(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string };

  if (!email) {
    res.status(400).json({ error: 'Введіть email' });
    return;
  }

  try {
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (userResult.rows.length === 0) {

      await new Promise((r) => setTimeout(r, 800));
      res.json({ message: 'Якщо акаунт існує - код надіслано' });
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await pool.query(
      'DELETE FROM reset_codes WHERE email = $1',
      [email]
    );

    await pool.query(
      'INSERT INTO reset_codes (email, code, expires_at) VALUES ($1, $2, $3)',
      [email, code, expiresAt]
    );
    const ok = await sendResetCode(email, code);

    if (!ok) {
      res.status(500).json({ error: 'Не вдалось надіслати лист' });
      return;
    }

    console.log(`🔐 Код скидання надіслано на ${email}`);
    res.json({ message: 'Код надіслано на пошту' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { email, code, newPassword } = req.body as {
    email:       string;
    code:        string;
    newPassword: string;
  };

  if (!email || !code || !newPassword) {
    res.status(400).json({ error: 'Заповніть усі поля' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'Пароль має бути не менше 6 символів' });
    return;
  }

  try {
    const result = await pool.query(`
      SELECT * FROM reset_codes
      WHERE email = $1
        AND code = $2
        AND used = false
        AND expires_at > NOW()
    `, [email, code]);

    if (result.rows.length === 0) {
      res.status(400).json({ error: 'Невірний або прострочений код' });
      return;
    }
    const hash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hash, email]
    );

    await pool.query(
      'UPDATE reset_codes SET used = true WHERE id = $1',
      [result.rows[0].id]
    );

    console.log(`✅ Пароль успішно скинуто для ${email}`);
    res.json({ message: 'Пароль успішно змінено' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
}