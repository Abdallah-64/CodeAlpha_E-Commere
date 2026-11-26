import { Router } from 'express';
import { login } from '../controllers/authController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.post('/login', login);
router.get('/verify', requireAdmin, (request, response) => {
  response.json({ valid: true, user: request.auth });
});

export default router;
