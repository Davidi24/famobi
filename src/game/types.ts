export type Direction = 'up' | 'down' | 'left' | 'right';

export type GamePhase = 'menu' | 'playing' | 'paused' | 'level-complete' | 'game-over' | 'finished';

export type Point = {
  x: number;
  y: number;
};

export type LevelConfig = {
  level: number;
  target: number;
  tickMs: number;
  obstacles: Point[];
};

export type GameSnapshot = {
  phase: GamePhase;
  level: number;
  score: number;
  fruitEaten: number;
  target: number;
  progress: number;
  snake: Point[];
  food: Point;
  obstacles: Point[];
  direction: Direction;
  failureReason: 'wall' | 'snake' | 'obstacle' | null;
};

export type GameListener = (snapshot: GameSnapshot) => void;
