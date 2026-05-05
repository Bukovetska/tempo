import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { updateSettings, getMe } from '../controllers/userController';

const router = Router();

router.get('/me', authMiddleware, getMe);
router.put('/settings', authMiddleware, updateSettings);

export default router;