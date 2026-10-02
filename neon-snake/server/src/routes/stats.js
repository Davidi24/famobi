import { Router } from 'express';
import { z } from 'zod';

import { getStats } from '../services/statsService.js';

export const statsRouter = Router();

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(30).default(14)
});

statsRouter.get('/', async (req, res) => {
  const result = querySchema.safeParse(req.query);

  if (!result.success) {
    return res.status(400).json({ error: 'days must be a whole number from 1 to 30' });
  }

  res.json(await getStats(result.data));
});

