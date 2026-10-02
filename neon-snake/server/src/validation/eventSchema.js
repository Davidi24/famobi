import { z } from 'zod';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const MAX_EVENT_AGE_MS = 30 * DAY_MS;

export const MAX_EVENTS_PER_REQUEST = 50;

const isRecent = (timestamp) => {
  const now = Date.now();
  return timestamp <= now + MAX_CLOCK_SKEW_MS && timestamp >= now - MAX_EVENT_AGE_MS;
};

const baseFields = {
  eventId: z.uuid(),
  sessionId: z.uuid(),
  runId: z.uuid(),
  level: z.int().min(1).max(99),
  occurredAt: z.int().refine(isRecent, 'must be a Unix timestamp in milliseconds from the last 30 days')
};

const runStart = z.strictObject({ ...baseFields, type: z.literal('run_start') });

const runEnd = z.strictObject({
  ...baseFields,
  type: z.literal('run_end'),
  reason: z.enum(['complete', 'fail', 'quit']),
  score: z.int().min(0),
  progress: z.number().min(0).max(1),
  durationMs: z.int().min(0).max(DAY_MS)
});

const pause = z.strictObject({ ...baseFields, type: z.literal('pause') });

const resume = z.strictObject({ ...baseFields, type: z.literal('resume') });

export const eventSchema = z.discriminatedUnion('type', [runStart, runEnd, pause, resume]);

export const eventBatchSchema = z.strictObject({
  events: z.array(eventSchema).min(1).max(MAX_EVENTS_PER_REQUEST)
});
