import cors from 'cors';
import express from 'express';

import { config } from './config.js';
import { eventsRouter } from './routes/events.js';
import { statsRouter } from './routes/stats.js';


export const app = express();

app.use(cors({ origin: config.corsOrigins }));
app.use(express.json({ limit: '64kb', type: ['application/json', 'text/plain'] }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/events', eventsRouter);
app.use('/api/stats', statsRouter);


app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is larger than 64 KB' });
  }

  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});
