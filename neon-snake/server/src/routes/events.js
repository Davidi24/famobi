import { Router } from 'express';

import { saveEvents } from '../services/eventStore.js';
import { eventBatchSchema } from '../validation/eventSchema.js';

export const eventsRouter = Router();

eventsRouter.post('/', async (req, res) => {
  const result = eventBatchSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid events',
      details: result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
    });
  }

  const { stored, duplicates } = await saveEvents(result.data.events);
  res.status(201).json({ stored, duplicates });
});
