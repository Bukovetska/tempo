import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from './config/passport';
import { initDatabase } from './db/init';
import { startScheduler } from './services/scheduler';
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import categoryRoutes from './routes/categoryRoutes';
import userRoutes from './routes/userRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 5000;

const allowedOrigins: string[] = [
  'http://localhost:3000',
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

console.log('🔓 Дозволені origins:', allowedOrigins);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(passport.initialize());

app.use('/api/auth',       authRoutes);
app.use('/api/tasks',      taskRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/user',       userRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Tempo API працює' });
});

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Сервер запущено на порту ${PORT}`);
    startScheduler();
  });
});