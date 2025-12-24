import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Tontine API v1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      tontines: '/api/tontines'
    }
  });
});

export default router;
