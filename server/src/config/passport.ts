import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from '../db/pool';
import dotenv from 'dotenv';
import { createDefaultCategories } from '../controllers/authController';

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      callbackURL:  (process.env.BACKEND_URL ?? 'http://localhost:5000') + '/api/auth/google/callback',
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name  = profile.displayName;

        if (!email) return done(new Error('Email не знайдено'));

        const existing = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [email]
        );

        if (existing.rows.length > 0) {
          const user = existing.rows[0]; 

          const catCheck = await pool.query(
            `SELECT COUNT(*) FROM categories WHERE user_id = $1`,
            [user.id] 
          );

          if (Number(catCheck.rows[0].count) < 4) {
            await createDefaultCategories(user.id);
          }
          return done(null, user);
        }

        const id = `u_${Date.now()}`;
        await pool.query(
          `INSERT INTO users (id, name, email, password)
           VALUES ($1, $2, $3, $4)`,
          [id, name, email, 'google_oauth']
        );

        await createDefaultCategories(id);

        const newUser = await pool.query(
          'SELECT * FROM users WHERE id = $1',
          [id]
        );

        return done(null, newUser.rows[0]);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

export default passport;