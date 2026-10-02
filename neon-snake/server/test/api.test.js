import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';

import { app } from '../src/app.js';

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

after(() => server.close());

const postEvents = (events) =>
  fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events })
  });

const makeRun = ({ reason = 'complete', score = 50 } = {}) => {
  const ids = { sessionId: randomUUID(), runId: randomUUID(), level: 1 };
  const now = Date.now();
  return [
    { ...ids, eventId: randomUUID(), type: 'run_start', occurredAt: now - 10_000 },
    { ...ids, eventId: randomUUID(), type: 'run_end', occurredAt: now, reason, score, progress: 1, durationMs: 10_000 }
  ];
};

test('stores a valid batch', async () => {
  const response = await postEvents(makeRun());
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { stored: 2, duplicates: 0 });
});

test('ignores events that were already stored', async () => {
  const events = makeRun();
  await postEvents(events);
  const response = await postEvents(events);
  assert.deepEqual(await response.json(), { stored: 0, duplicates: 2 });
});

test('rejects invalid events with details', async () => {
  const [start] = makeRun();
  const response = await postEvents([{ ...start, level: 0, extra: true }]);
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.ok(body.details.some((detail) => detail.path === 'events.0.level'));
});

test('rejects a body that is not JSON', async () => {
  const response = await fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{oops'
  });
  assert.equal(response.status, 400);
});

test('stats include stored runs', async () => {
  await postEvents(makeRun({ reason: 'fail', score: 20 }));
  const response = await fetch(`${baseUrl}/api/stats?days=1`);
  const stats = await response.json();
  assert.equal(response.status, 200);
  assert.ok(stats.overview.failed >= 1);
  assert.equal(stats.daily.length, 1);
  assert.ok(stats.levels.some((level) => level.level === 1));
});

test('accepts text/plain bodies sent with sendBeacon', async () => {
  const response = await fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ events: makeRun({ reason: 'quit', score: 0 }) })
  });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { stored: 2, duplicates: 0 });
});

test('rejects an out of range days parameter', async () => {
  const response = await fetch(`${baseUrl}/api/stats?days=90`);
  assert.equal(response.status, 400);
});
