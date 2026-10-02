import type { GameController } from '../../application/GameController';
import type { RunEndReason } from '../../application/gameEvents';

type BaseEvent = {
  eventId: string;
  sessionId: string;
  runId: string;
  level: number;
  occurredAt: number;
};

export type AnalyticsEvent =
  | (BaseEvent & { type: 'run_start' })
  | (BaseEvent & { type: 'run_end'; reason: RunEndReason; score: number; progress: number; durationMs: number })
  | (BaseEvent & { type: 'pause' })
  | (BaseEvent & { type: 'resume' });

type ActiveRun = { runId: string; level: number; startedAt: number; score: number; progress: number };

const FLUSH_DELAY_MS = 2000;
const MAX_BATCH = 50;
const MAX_QUEUE = 500;

export class AnalyticsClient {
  private readonly sessionId = crypto.randomUUID();
  private queue: AnalyticsEvent[] = [];
  private run: ActiveRun | null = null;
  private paused = false;
  private flushTimer: number | null = null;

  constructor(private readonly endpoint: string) {}

  attach(controller: GameController): void {
    controller.events.on('runStarted', ({ level, occurredAt }) => {
      this.run = { runId: crypto.randomUUID(), level, startedAt: occurredAt, score: 0, progress: 0 };
      this.paused = false;
      this.track('run_start', occurredAt);
    });

    controller.events.on('scoreChanged', ({ score }) => {
      if (this.run) this.run.score = score;
    });

    controller.events.on('progressChanged', ({ progress }) => {
      if (this.run) this.run.progress = progress;
    });

    controller.events.on('pauseChanged', ({ paused }) => {
      if (!this.run || paused === this.paused) return;
      this.paused = paused;
      this.track(paused ? 'pause' : 'resume', Date.now());
    });

    controller.events.on('runEnded', ({ reason, score, progress, durationMs, occurredAt }) => {
      this.endRun(reason, occurredAt, { score, progress, durationMs });
    });

    window.addEventListener('pagehide', this.handlePageLeave);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush(true);
    });
  }

  private handlePageLeave = (): void => {
    if (this.run) this.endRun('quit', Date.now());
    this.flush(true);
  };

  private endRun(
    reason: RunEndReason,
    occurredAt: number,
    result?: { score: number; progress: number; durationMs: number }
  ): void {
    if (!this.run) return;
    const { score, progress, durationMs } = result ?? {
      score: this.run.score,
      progress: this.run.progress,
      durationMs: Math.max(0, occurredAt - this.run.startedAt)
    };
    this.track('run_end', occurredAt, {
      reason,
      score,
      progress: Math.min(1, Math.max(0, progress)),
      durationMs
    });
    this.run = null;
    this.flush();
  }

  private track(type: AnalyticsEvent['type'], occurredAt: number, extra: object = {}): void {
    if (!this.run) return;
    const event = {
      type,
      eventId: crypto.randomUUID(),
      sessionId: this.sessionId,
      runId: this.run.runId,
      level: this.run.level,
      occurredAt,
      ...extra
    } as AnalyticsEvent;

    this.queue.push(event);
    if (this.queue.length > MAX_QUEUE) this.queue.splice(0, this.queue.length - MAX_QUEUE);
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.flushTimer !== null) return;
    this.flushTimer = window.setTimeout(() => this.flush(), FLUSH_DELAY_MS);
  }

  private flush(leavingPage = false): void {
    if (this.flushTimer !== null) {
      window.clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, MAX_BATCH);
      const body = JSON.stringify({ events: batch });

      if (leavingPage) {
        navigator.sendBeacon(this.endpoint, new Blob([body], { type: 'text/plain' }));
        continue;
      }

      void fetch(this.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
        .then((response) => {
          if (response.status >= 500) this.requeue(batch);
        })
        .catch(() => this.requeue(batch));
    }
  }

  private requeue(batch: AnalyticsEvent[]): void {
    this.queue.unshift(...batch);
    this.scheduleFlush();
  }
}
