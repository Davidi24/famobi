import './style.css';

import Phaser from 'phaser';

import { GameController } from './application/GameController';
import { AnalyticsClient } from './core/analytics/AnalyticsClient';
import { LocalGameStorage } from './core/storage/GameStorage';
import { SnakeScene } from './game/scenes/SnakeScene';
import { SnakeGame } from './game/snakeGame';
import type { Direction, GamePhase, GameSnapshot } from './game/types';
import { LEVELS } from './game/levels';

const requiredElement = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required element: ${selector}`);
  return element;
};

const levelValue = requiredElement<HTMLElement>('#level-value');
const scoreValue = requiredElement<HTMLElement>('#score-value');
const bestValue = requiredElement<HTMLElement>('#best-value');
const fruitValue = requiredElement<HTMLElement>('#fruit-value');
const progressValue = requiredElement<HTMLElement>('#progress-value');
const overlay = requiredElement<HTMLElement>('#game-overlay');
const overlayEyebrow = requiredElement<HTMLElement>('#overlay-eyebrow');
const overlayTitle = requiredElement<HTMLElement>('#overlay-title');
const overlayCopy = requiredElement<HTMLElement>('#overlay-copy');
const primaryAction = requiredElement<HTMLButtonElement>('#primary-action');
const secondaryAction = requiredElement<HTMLButtonElement>('#secondary-action');
const pauseButton = requiredElement<HTMLButtonElement>('#pause-button');
const muteButton = requiredElement<HTMLButtonElement>('#mute-button');
const levelSelect = requiredElement<HTMLElement>('#level-select');

const famobi = (
  window as Window & {
    GameInterface?: {
      sendPreloadProgress: (progress: number) => void;
      gameReady: () => void;
      gameStart: (level?: number) => Promise<void>;
      gameEnd: (reason: 'complete' | 'fail' | 'quit', params?: { metrics?: Record<string, number> }) => Promise<void>;
      gameFinished: () => Promise<void>;
      gamePause: () => Promise<void>;
      gameResume: () => Promise<void>;
      onPauseStateChange: (callback: (isPaused: boolean) => void) => void;
      sendScore: (
        score: number,
        params?: {
          type?: 'live' | 'total' | 'level' | 'stage';
          level?: number;
          stage?: number;
        }
      ) => void;
      sendProgress: (progress: number) => void;
      gameMuted: (isMuted?: boolean) => void;
      isMuted: () => boolean;
      onMuteStateChange: (callback: (isMuted: boolean) => void) => void;
      storage: Pick<Storage, 'getItem' | 'setItem'>;
      onGoToHome: (callback: () => void) => void;
      onQuitGame: (callback: () => void) => void;
      onRestartGame: (callback: () => void) => void;
      onGoToNextLevel: (callback: () => void) => void;
      onGoToLevel: (callback: (level: number) => void) => void;
      onGameOver: (callback: () => void) => void;
      log: (...args: unknown[]) => void;
    };
  }
).GameInterface;

const simulation = new SnakeGame();
const controller = new GameController(simulation, new LocalGameStorage(famobi?.storage));
new AnalyticsClient(import.meta.env.VITE_ANALYTICS_URL ?? 'http://localhost:3000/api/events').attach(controller);
const snakeScene = new SnakeScene(controller, performPrimaryAction, togglePause);
let currentSnapshot = controller.getSnapshot();
let famobiEndPromise: Promise<void> = Promise.resolve();
let waitingForFamobiEnd = false;
let famobiFinishedSent = false;

const callFamobi = async (method: string, call: () => void | Promise<void>): Promise<void> => {
  try {
    await call();
  } catch (error) {
    famobi?.log(`Famobi ${method} failed:`, error);
  }
};

const startFamobiRun = async (level: number): Promise<void> => {
  if (level === 1) famobiFinishedSent = false;
  await callFamobi('gameStart', () => famobi?.gameStart(level));
};

controller.events.on('ready', () => {
  famobi?.sendPreloadProgress(100);
  famobi?.gameReady();
});

controller.events.on('runEnded', ({ reason, score, progress, durationMs }) => {
  waitingForFamobiEnd = true;
  const metrics = { duration: durationMs, score, progress };
  famobiEndPromise = (famobi?.gameEnd(reason, { metrics }) ?? Promise.resolve()).catch((error: unknown) => {
    famobi?.log('Famobi gameEnd failed:', error);
  });
  void famobiEndPromise.then(() => {
    waitingForFamobiEnd = false;
    renderInterface(controller.getSnapshot());
  });
});

controller.events.on('gameFinished', () => {
  if (famobiFinishedSent) return;
  famobiFinishedSent = true;
  void famobiEndPromise.then(() => callFamobi('gameFinished', () => famobi?.gameFinished()));
});

famobi?.onPauseStateChange((isPaused) => {
  controller.setSystemPaused(isPaused);
});

controller.events.on('scoreChanged', ({ score, level }) => {
  famobi?.sendScore(score, { level });
});

controller.events.on('progressChanged', ({ progress }) => {
  famobi?.sendProgress(progress);
});

if (famobi) {
  controller.setSystemMuted(famobi.isMuted());
  famobi.gameMuted(controller.getAudioState().playerMuted);

  famobi.onMuteStateChange((isMuted) => {
    controller.setSystemMuted(isMuted);
  });
}

const isLevel = (level: number): boolean => Number.isInteger(level) && level >= 1 && level <= LEVELS.length;

const startRequestedRun = async (level: number, start: () => void): Promise<void> => {
  if (!isLevel(level)) return;
  controller.quitToMenu();
  await famobiEndPromise;
  await startFamobiRun(level);
  start();
};

famobi?.onGoToHome(() => controller.quitToMenu());
famobi?.onQuitGame(() => controller.quitToMenu());
famobi?.onGameOver(() => controller.forceGameOver());
famobi?.onRestartGame(() => {
  void startRequestedRun(currentSnapshot.level, () => controller.restartLevel());
});
famobi?.onGoToNextLevel(() => {
  const level = currentSnapshot.level + 1;
  void startRequestedRun(level, () => controller.goToLevel(level));
});
famobi?.onGoToLevel((level) => {
  void startRequestedRun(level, () => controller.goToLevel(level));
});

const phaserGame = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 600,
  height: 600,
  backgroundColor: '#10182c',
  scene: [snakeScene],
  render: {
    antialias: true,
    pixelArt: false
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
});

const failureCopy: Record<NonNullable<GameSnapshot['failureReason']>, string> = {
  wall: 'You ran into the edge of the grid.',
  snake: 'You crossed your own trail.',
  obstacle: 'That barrier was tougher than it looked.',
  external: 'The run was ended by an external game command.'
};

const overlayContent: Record<
  Exclude<GamePhase, 'playing'>,
  (snapshot: GameSnapshot) => {
    eyebrow: string;
    title: string;
    copy: string;
    primary?: string;
    secondary?: string;
  }
> = {
  menu: () => ({
    eyebrow: 'Three levels',
    title: 'Ready to slither?',
    copy: 'Eat the fruit, avoid the walls, and clear every level.',
    primary: 'Start game'
  }),
  paused: (snapshot) =>
    snapshot.pauseSource === 'system'
      ? {
          eyebrow: 'Game paused',
          title: 'Please wait',
          copy: 'Gameplay will continue when the interruption has ended.'
        }
      : {
          eyebrow: 'Game paused',
          title: 'Take a breather',
          copy: 'Your run is waiting exactly where you left it.',
          primary: 'Resume',
          secondary: 'Exit to menu'
        },
  'level-complete': (snapshot) => ({
    eyebrow: `Level ${snapshot.level} clear`,
    title: 'Nice moves!',
    copy: `Score ${snapshot.score}. The next grid is faster and a little less friendly.`,
    primary: 'Next level',
    secondary: 'Exit to menu'
  }),
  'game-over': (snapshot) => ({
    eyebrow: `Level ${snapshot.level}`,
    title: 'Game over',
    copy: snapshot.failureReason ? failureCopy[snapshot.failureReason] : 'That run came to an end.',
    primary: 'Try again',
    secondary: 'Exit to menu'
  }),
  finished: (snapshot) => ({
    eyebrow: 'All levels clear',
    title: 'Snake master!',
    copy: `Final score: ${snapshot.score}. You conquered every grid.`,
    primary: 'Play again',
    secondary: 'Main menu'
  })
};

const renderInterface = (snapshot: GameSnapshot): void => {
  currentSnapshot = snapshot;
  if (
    waitingForFamobiEnd &&
    (snapshot.phase === 'menu' ||
      snapshot.phase === 'level-complete' ||
      snapshot.phase === 'game-over' ||
      snapshot.phase === 'finished')
  ) {
    return;
  }

  levelValue.textContent = String(snapshot.level);
  scoreValue.textContent = String(snapshot.score);
  bestValue.textContent = String(controller.getProfile().bestScore);
  fruitValue.textContent = `${snapshot.fruitEaten} / ${snapshot.target}`;
  progressValue.style.transform = `scaleX(${Math.min(1, snapshot.progress)})`;

  const canPause = snapshot.phase === 'playing' || snapshot.phase === 'paused';
  pauseButton.disabled = !canPause;
  pauseButton.setAttribute('aria-label', snapshot.phase === 'paused' ? 'Resume game' : 'Pause game');
  pauseButton.firstElementChild!.textContent = snapshot.phase === 'paused' ? '▶' : 'Ⅱ';
  levelSelect.hidden = snapshot.phase !== 'menu';
  levelSelect.querySelectorAll<HTMLButtonElement>('[data-level]').forEach((button) => {
    const level = Number(button.dataset.level);
    button.disabled = level > controller.getProfile().highestUnlockedLevel;
  });

  if (snapshot.phase === 'playing') {
    overlay.hidden = true;
    return;
  }

  overlay.hidden = false;
  const content = overlayContent[snapshot.phase](snapshot);
  overlayEyebrow.textContent = content.eyebrow;
  overlayTitle.textContent = content.title;
  overlayCopy.textContent = content.copy;
  primaryAction.textContent = content.primary ?? '';
  primaryAction.hidden = !content.primary;
  secondaryAction.textContent = content.secondary ?? '';
  secondaryAction.hidden = !content.secondary;
};

async function performPrimaryAction(): Promise<void> {
  switch (currentSnapshot.phase) {
    case 'menu':
    case 'finished':
      await startFamobiRun(1);
      controller.startNewGame();
      break;
    case 'paused':
      if (currentSnapshot.pauseSource === 'player') await togglePause();
      break;
    case 'level-complete': {
      await famobiEndPromise;
      await startFamobiRun(currentSnapshot.level + 1);
      controller.goToNextLevel();
      break;
    }
    case 'game-over': {
      await famobiEndPromise;
      await startFamobiRun(currentSnapshot.level);
      controller.restartLevel();
      break;
    }
    case 'playing':
      break;
  }
}

async function togglePause(): Promise<void> {
  const snapshot = controller.getSnapshot();

  if (snapshot.phase === 'playing') {
    await callFamobi('gamePause', () => famobi?.gamePause());
    controller.togglePlayerPause();
  } else if (snapshot.phase === 'paused' && snapshot.pauseSource === 'player') {
    await callFamobi('gameResume', () => famobi?.gameResume());
    controller.togglePlayerPause();
  }
}

async function startAtLevel(level: number): Promise<void> {
  const highestUnlockedLevel = controller.getProfile().highestUnlockedLevel;
  if (!Number.isInteger(level) || level < 1 || level > highestUnlockedLevel) return;

  await startFamobiRun(level);
  controller.startAtLevel(level);
}

const renderAudioState = (): void => {
  const audioState = controller.getAudioState();
  muteButton.setAttribute('aria-label', audioState.playerMuted ? 'Unmute audio' : 'Mute audio');
  muteButton.firstElementChild!.textContent = audioState.effectiveMuted ? '×' : '♪';
};

controller.subscribe(renderInterface);
controller.events.on('audioChanged', renderAudioState);
renderAudioState();

primaryAction.addEventListener('click', performPrimaryAction);
secondaryAction.addEventListener('click', () => controller.quitToMenu());
pauseButton.addEventListener('click', togglePause);
muteButton.addEventListener('click', () => {
  controller.togglePlayerMuted();
  famobi?.gameMuted(controller.getAudioState().playerMuted);
});

document.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach((button) => {
  button.addEventListener('click', () => {
    controller.move(button.dataset.direction as Direction);
    phaserGame.canvas.focus({ preventScroll: true });
  });
});

levelSelect.querySelectorAll<HTMLButtonElement>('[data-level]').forEach((button) => {
  button.addEventListener('click', () => void startAtLevel(Number(button.dataset.level)));
});

window.addEventListener('beforeunload', () => {
  controller.dispose();
  phaserGame.destroy(true);
});
