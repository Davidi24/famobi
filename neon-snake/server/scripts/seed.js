import { randomUUID } from 'node:crypto';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const SESSIONS = 150;
const DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

const LEVELS = {
  1: { target: 5, completeChance: 0.75 },
  2: { target: 7, completeChance: 0.45 },
  3: { target: 9, completeChance: 0.25 }
};

const random = (min, max) => min + Math.random() * (max - min);
const randomInt = (min, max) => Math.floor(random(min, max + 1));

const playSession = () => {
  const sessionId = randomUUID();
  const events = [];
  let time = Date.now() - random(0.1, DAYS) * DAY_MS;
  let level = 1;
  let scoreAtLevelStart = 0;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { target, completeChance } = LEVELS[level];
    const runId = randomUUID();
    const base = () => ({ eventId: randomUUID(), sessionId, runId, level });

    const roll = Math.random();
    const reason = roll < completeChance ? 'complete' : roll < completeChance + 0.1 ? 'quit' : 'fail';
    const fruit = reason === 'complete' ? target : randomInt(0, target - 1);
    const durationMs = Math.round(fruit * random(2500, 4500) + random(1000, 4000));

    events.push({ ...base(), type: 'run_start', occurredAt: Math.round(time) });

    if (Math.random() < 0.15) {
      events.push({ ...base(), type: 'pause', occurredAt: Math.round(time + durationMs / 2) });
      events.push({ ...base(), type: 'resume', occurredAt: Math.round(time + durationMs / 2 + 3000) });
    }

    events.push({
      ...base(),
      type: 'run_end',
      reason,
      score: scoreAtLevelStart + fruit * level * 10,
      progress: Math.round((fruit / target) * 100) / 100,
      durationMs,
      occurredAt: Math.round(time + durationMs)
    });

    time += durationMs + random(2000, 8000);

    if (reason === 'quit') break;
    if (reason === 'complete') {
      if (level === 3) break;
      scoreAtLevelStart += target * level * 10;
      level += 1;
    } else if (Math.random() < 0.35) {
      break;
    }
  }

  return events.filter((event) => event.occurredAt <= Date.now());
};

const post = async (events) => {
  const response = await fetch(`${API_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events })
  });
  if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`);
  return response.json();
};

let stored = 0;
for (let i = 0; i < SESSIONS; i += 1) {
  const result = await post(playSession());
  stored += result.stored;
}

console.log(`Seeded ${SESSIONS} sessions (${stored} events) into ${API_URL}`);
