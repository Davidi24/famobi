import { Timestamp } from 'firebase-admin/firestore';

import { db } from '../firebase.js';

const runsCollection = db.collection('runs');

const DAY_MS = 24 * 60 * 60 * 1000;
const OUTCOMES = ['complete', 'fail', 'quit'];

const toDay = (timestamp) => timestamp.toDate().toISOString().slice(0, 10);

const average = (values) =>
  values.length === 0 ? null : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

const ratio = (part, whole) => (whole === 0 ? null : Math.round((part / whole) * 1000) / 1000);

const summarize = (runs) => {
  const ended = runs.filter((run) => OUTCOMES.includes(run.outcome));
  const count = (outcome) => ended.filter((run) => run.outcome === outcome).length;

  return {
    runs: runs.length,
    completed: count('complete'),
    failed: count('fail'),
    quit: count('quit'),
    unfinished: runs.length - ended.length,
    completionRate: ratio(count('complete'), ended.length),
    avgScore: average(ended.map((run) => run.score)),
    bestScore: ended.length === 0 ? null : Math.max(...ended.map((run) => run.score)),
    avgDurationMs: average(ended.map((run) => run.durationMs))
  };
};

const groupBy = (items, keyOf) => {
  const groups = new Map();
  for (const item of items) {
    const key = keyOf(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return groups;
};

export const getStats = async ({ days }) => {
  const todayStart = new Date(new Date().toISOString().slice(0, 10)).getTime();
  const fromMs = todayStart - (days - 1) * DAY_MS;

  const snapshot = await runsCollection.where('startedAt', '>=', Timestamp.fromMillis(fromMs)).get();
  const runs = snapshot.docs.map((doc) => doc.data());

  const byLevel = groupBy(runs, (run) => run.level);
  const levels = [...byLevel.keys()]
    .sort((a, b) => a - b)
    .map((level) => ({ level, ...summarize(byLevel.get(level)) }));

  const byDay = groupBy(runs, (run) => toDay(run.startedAt));
  const daily = Array.from({ length: days }, (_, index) => {
    const date = new Date(fromMs + index * DAY_MS).toISOString().slice(0, 10);
    const { runs: count, completed, failed, quit, unfinished } = summarize(byDay.get(date) ?? []);
    return { date, runs: count, completed, failed, quit, unfinished };
  });

  return {
    range: { days, from: new Date(fromMs).toISOString(), to: new Date().toISOString() },
    overview: { sessions: new Set(runs.map((run) => run.sessionId)).size, ...summarize(runs) },
    levels,
    daily
  };
};
