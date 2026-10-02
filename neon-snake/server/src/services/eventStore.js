import { FieldValue, Timestamp } from 'firebase-admin/firestore';

import { db } from '../firebase.js';

const ALREADY_EXISTS = 6;

const events = db.collection('events');
const runs = db.collection('runs');

const runFieldsFor = (event) => {
  const occurredAt = Timestamp.fromMillis(event.occurredAt);
  const common = { runId: event.runId, sessionId: event.sessionId, level: event.level };

  switch (event.type) {
    case 'run_start':
      return { ...common, startedAt: occurredAt };
    case 'run_end':
      return {
        ...common,
        endedAt: occurredAt,
        outcome: event.reason,
        score: event.score,
        progress: event.progress,
        durationMs: event.durationMs
      };
    case 'pause':
      return { ...common, pauseCount: FieldValue.increment(1) };
    case 'resume':
      return common;
  }
};

const saveEvent = async (event) => {
  const batch = db.batch();
  batch.create(events.doc(event.eventId), {
    ...event,
    occurredAt: Timestamp.fromMillis(event.occurredAt),
    receivedAt: FieldValue.serverTimestamp()
  });
  batch.set(runs.doc(event.runId), runFieldsFor(event), { merge: true });

  try {
    await batch.commit();
    return true;
  } catch (error) {
    if (error.code === ALREADY_EXISTS) return false;
    throw error;
  }
};

export const saveEvents = async (eventList) => {
  let stored = 0;
  let duplicates = 0;

  for (const event of eventList) {
    if (await saveEvent(event)) stored += 1;
    else duplicates += 1;
  }

  return { stored, duplicates };
};
