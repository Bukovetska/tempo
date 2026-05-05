import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool: Pool;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
  console.log('🌐 Використовується хмарна БД (Neon)');
} else {
  pool = new Pool({
    user:     process.env.DB_USER,
    host:     process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port:     Number(process.env.DB_PORT) || 5432,
  });
  console.log('💻 Використовується локальна БД');
}

pool.on('connect', () => {
  console.log('Підключено до PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Помилка БД:', err);
});

export default pool;