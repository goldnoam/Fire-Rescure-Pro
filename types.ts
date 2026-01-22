
export enum GameState {
  MENU,
  PLAYING,
  PAUSED,
  GAMEOVER
}

export interface Jumper {
  id: number;
  x: number;
  y: number;
  targetY: number;
  buildingIndex: number;
  floor: number;
  vx: number;
  vy: number;
  state: 'jumping' | 'bouncing' | 'saved' | 'dead';
  color: string;
  lingerTimer?: number;
  hasShield?: boolean;
}

export interface Stretcher {
  x: number;
  width: number;
  occupants: number;
  maxOccupants: number;
}

export interface Building {
  x: number;
  width: number;
  floors: number;
  color: string;
  style: 'classic' | 'modern' | 'industrial' | 'skyscraper' | 'historic';
  windowFireLevels: number[];
  structuralDamage: number[];
  isFloorDestroyed: boolean[];
}

export interface WaterParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export interface EmberParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

export interface RubbleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vr: number;
  size: number;
  life: number;
}

export type PowerUpType = 'speed' | 'water' | 'shield' | 'extinguisher';

export interface PowerUp {
  id: number;
  x: number;
  y: number;
  vy: number;
  type: PowerUpType;
}

export interface GameSettings {
  isMultiplayer: boolean;
  firefighterFocus: number;
}
