import { Router } from 'express';
import passport from '../config/passport';
import jwt from 'jsonwebtoken';
import { register, login } from '../controllers/authController';
import { requestResetCode, resetPassword } from '../controllers/passwordController';

const router = Router();

router.post('/register', register);
router.post('/login', login);

router.post('/forgot-password', requestResetCode);
router.post('/reset-password', resetPassword);

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  (req, res) => {
    const user = req.user as any;

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET ?? '',
      { expiresIn: '7d' }
    );

    const userData = encodeURIComponent(JSON.stringify({
      id:    user.id,
      name:  user.name,
      email: user.email,
    }));

    let redirectBase = 'http://localhost:3000';
    if (process.env.FRONTEND_URL) {
      redirectBase = process.env.FRONTEND_URL + '/tempo';
    }

    res.redirect(`${redirectBase}/auth/callback?token=${token}&user=${userData}`);
  }
);

export default router;