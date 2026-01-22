
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  GameState, Building, Jumper, Stretcher, WaterParticle, EmberParticle, RubbleParticle, PowerUp, PowerUpType, GameSettings 
} from '../types';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, BUILDINGS_DATA, STRETCHER_WIDTH, 
  STRETCHER_HEIGHT, JUMPER_SIZE, GRAVITY, BOUNCE_FACTOR, 
  STRETCHER_SPEED, FIRE_GROWTH_RATE, STAGE_DURATION, 
  AMBULANCE_X, AMBULANCE_WIDTH, INITIAL_LIVES, POWERUP_DURATION, POWERUP_SPAWN_CHANCE 
} from '../constants';

interface GameProps {
  gameState: GameState;
  settings: GameSettings;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  setLevel: React.Dispatch<React.SetStateAction<number>>;
  setLives: React.Dispatch<React.SetStateAction<number>>;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const INDICATOR_DURATION = 1500; 
const WATER_EXTINGUISH_STRENGTH = 1.2;
const EXTINGUISHER_RADIUS = 160;
const EXTINGUISHER_STRENGTH = 0.6;
const DAMAGE_THRESHOLD = 85; 
const DAMAGE_SPEED = 0.05; 
const DESTRUCTION_LIMIT = 100; 

const Game: React.FC<GameProps> = ({ 
  gameState, settings, setScore, setLevel, setLives, setGameState
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  const initBuildings = () => BUILDINGS_DATA.map(b => ({ 
    ...b, 
    windowFireLevels: new Array(b.floors).fill(0).map(() => Math.random() < 0.2 ? 20 + Math.random() * 10 : 0),
    structuralDamage: new Array(b.floors).fill(0),
    isFloorDestroyed: new Array(b.floors).fill(false),
    style: b.style as any
  }));

  const buildingsRef = useRef<Building[]>(initBuildings());
  const stretchersRef = useRef<Stretcher[]>([
    { x: 100, width: STRETCHER_WIDTH, occupants: 0, maxOccupants: 3 },
    { x: 400, width: STRETCHER_WIDTH, occupants: 0, maxOccupants: 3 }
  ]);
  const jumpersRef = useRef<Jumper[]>([]);
  const waterParticlesRef = useRef<WaterParticle[]>([]);
  const emberParticlesRef = useRef<EmberParticle[]>([]);
  const rubbleParticlesRef = useRef<RubbleParticle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const activeEffectsRef = useRef<Record<PowerUpType, number>>({
    speed: 0,
    water: 0,
    shield: 0,
    extinguisher: 0
  });

  const keysRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const internalLivesRef = useRef<number>(INITIAL_LIVES);
  const internalLevelRef = useRef<number>(1);
  const internalScoreRef = useRef<number>(0);

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      buildingsRef.current = initBuildings();
      stretchersRef.current = [
        { x: 100, width: STRETCHER_WIDTH, occupants: 0, maxOccupants: 3 },
        { x: 400, width: STRETCHER_WIDTH, occupants: 0, maxOccupants: 3 }
      ];
      jumpersRef.current = [];
      waterParticlesRef.current = [];
      emberParticlesRef.current = [];
      rubbleParticlesRef.current = [];
      powerUpsRef.current = [];
      activeEffectsRef.current = { speed: 0, water: 0, shield: 0, extinguisher: 0 };
      timerRef.current = 0;
      internalLivesRef.current = INITIAL_LIVES;
      internalLevelRef.current = 1;
      internalScoreRef.current = 0;
      setLives(INITIAL_LIVES);
      setLevel(1);
      setScore(0);
    }
  }, [gameState, settings.isMultiplayer, setLives, setLevel, setScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.code);
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    const handleMove = (e: any) => {
      const { player, dir } = e.detail;
      if (player === 1) {
        if (dir === 'left') keysRef.current.add('ArrowLeft');
        if (dir === 'right') keysRef.current.add('ArrowRight');
        if (dir === 'action') keysRef.current.add('Space');
        if (dir === 'stop') { keysRef.current.delete('ArrowLeft'); keysRef.current.delete('ArrowRight'); }
        if (dir === 'stopAction') keysRef.current.delete('Space');
      } else {
        if (dir === 'left') keysRef.current.add('KeyA');
        if (dir === 'right') keysRef.current.add('KeyD');
        if (dir === 'action') keysRef.current.add('ShiftLeft');
        if (dir === 'stop') { keysRef.current.delete('KeyA'); keysRef.current.delete('KeyD'); }
        if (dir === 'stopAction') keysRef.current.delete('ShiftLeft');
      }
    };
    window.addEventListener('game-move', handleMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('game-move', handleMove);
    };
  }, []);

  const spawnJumper = useCallback(() => {
    const burningBuildings = buildingsRef.current.filter(b => 
      b.windowFireLevels.some((lvl, idx) => lvl > 15 && !b.isFloorDestroyed[idx])
    );
    if (burningBuildings.length === 0) return;

    const building = burningBuildings[Math.floor(Math.random() * burningBuildings.length)];
    const bIndex = buildingsRef.current.indexOf(building);
    const validFloors = building.windowFireLevels
      .map((lvl, idx) => (lvl > 15 && !building.isFloorDestroyed[idx]) ? idx : -1)
      .filter(idx => idx !== -1);
    
    if (validFloors.length === 0) return;
    const floorIdx = validFloors[Math.floor(Math.random() * validFloors.length)];
    const y = CANVAS_HEIGHT - ((floorIdx + 1) * 80) - 20;
    
    jumpersRef.current.push({
      id: Date.now() + Math.random(),
      x: building.x + (Math.random() > 0.5 ? 25 : building.width - 25),
      y: y,
      targetY: y,
      buildingIndex: bIndex,
      floor: floorIdx + 1,
      vx: (Math.random() - 0.5) * (1.5 + internalLevelRef.current * 0.1),
      vy: -1.5 - (internalLevelRef.current * 0.05),
      state: 'jumping',
      color: `hsla(${Math.random() * 360}, 80%, 75%, 0.9)`,
      hasShield: activeEffectsRef.current.shield > 0
    });
  }, []);

  const spawnRubble = (x: number, y: number, width: number) => {
    for(let i=0; i<8; i++) {
      rubbleParticlesRef.current.push({
        x: x + Math.random() * width,
        y: y + Math.random() * 20,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 5,
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.2,
        size: 5 + Math.random() * 10,
        life: 1.0
      });
    }
  };

  const spawnPowerUp = useCallback(() => {
    const types: PowerUpType[] = ['speed', 'water', 'shield', 'extinguisher'];
    powerUpsRef.current.push({
      id: Date.now() + Math.random(),
      x: Math.random() * (CANVAS_WIDTH - 40) + 20,
      y: -20,
      vy: 2 + Math.random() * 2,
      type: types[Math.floor(Math.random() * types.length)]
    });
  }, []);

  const update = useCallback((deltaTime: number) => {
    if (gameState !== GameState.PLAYING) return;

    timerRef.current += deltaTime;

    Object.keys(activeEffectsRef.current).forEach((key) => {
      const k = key as PowerUpType;
      if (activeEffectsRef.current[k] > 0) {
        activeEffectsRef.current[k] = Math.max(0, activeEffectsRef.current[k] - deltaTime);
      }
    });

    if (timerRef.current > STAGE_DURATION) {
      timerRef.current = 0;
      internalLevelRef.current += 1;
      setLevel(internalLevelRef.current);
    }

    const difficultyScaling = 0.5 + (internalLevelRef.current * 0.5);

    buildingsRef.current.forEach(b => {
      const growthModifier = (1 - (settings.firefighterFocus / 100)) * 1.4;
      b.windowFireLevels.forEach((lvl, i) => {
        if (b.isFloorDestroyed[i]) {
          b.windowFireLevels[i] = Math.max(0, lvl - 0.1);
          return;
        }

        let change = lvl > 0 ? FIRE_GROWTH_RATE * difficultyScaling * growthModifier : 0;
        if (i > 0) {
          const heatBelow = b.windowFireLevels[i-1];
          if (heatBelow > 30) change += (heatBelow - 30) * 0.008 * difficultyScaling;
        }
        
        if (lvl > DAMAGE_THRESHOLD) {
          b.structuralDamage[i] += DAMAGE_SPEED * difficultyScaling;
          if (b.structuralDamage[i] >= DESTRUCTION_LIMIT) {
            b.isFloorDestroyed[i] = true;
            spawnRubble(b.x, CANVAS_HEIGHT - 50 - (i+1)*80, b.width);
            internalLivesRef.current -= 1; 
            setLives(internalLivesRef.current);
            if (internalLivesRef.current <= 0) setGameState(GameState.GAMEOVER);
          }
        }

        if (lvl > 50 && Math.random() < 0.05) {
          emberParticlesRef.current.push({
            x: b.x + Math.random() * b.width,
            y: CANVAS_HEIGHT - 50 - (i + 1) * 80 + 40,
            vx: (Math.random() - 0.5) * 2,
            vy: -1 - Math.random() * 2,
            life: 1.0,
            size: 1 + Math.random() * 3
          });
        }

        if (activeEffectsRef.current.extinguisher > 0) {
          stretchersRef.current.forEach((s, sIdx) => {
            if (!settings.isMultiplayer && sIdx === 1) return;
            const sx = s.x + s.width / 2;
            const sy = CANVAS_HEIGHT - 60;
            const windowX = b.x + b.width / 2;
            const windowY = CANVAS_HEIGHT - 50 - (i + 0.5) * 80;
            const distSq = (sx - windowX) ** 2 + (sy - windowY) ** 2;
            if (distSq < EXTINGUISHER_RADIUS * EXTINGUISHER_RADIUS) {
              change -= EXTINGUISHER_STRENGTH;
            }
          });
        }
        b.windowFireLevels[i] = Math.max(0, Math.min(100, lvl + change));
      });
    });

    emberParticlesRef.current.forEach(p => { p.x += p.vx + Math.sin(Date.now()/500); p.y += p.vy; p.life -= 0.01; });
    emberParticlesRef.current = emberParticlesRef.current.filter(p => p.life > 0);

    rubbleParticlesRef.current.forEach(p => { 
      p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.rotation += p.vr; p.life -= 0.005; 
      if (p.y > CANVAS_HEIGHT - 50) { p.y = CANVAS_HEIGHT - 50; p.vy = 0; p.vx = 0; p.vr = 0; }
    });
    rubbleParticlesRef.current = rubbleParticlesRef.current.filter(p => p.life > 0);

    const totalFirePower = buildingsRef.current.reduce((acc, b) => acc + b.windowFireLevels.reduce((f, l) => f + (l > 15 ? 1 : 0), 0), 0);
    const spawnChance = (totalFirePower * 0.002) * difficultyScaling;
    if (Math.random() < spawnChance) spawnJumper();
    if (Math.random() < POWERUP_SPAWN_CHANCE) spawnPowerUp();

    const processPlayer = (idx: number, leftKey: string, rightKey: string, actionKey: string) => {
      const s = stretchersRef.current[idx];
      const speed = activeEffectsRef.current.speed > 0 ? STRETCHER_SPEED * 1.6 : STRETCHER_SPEED;
      if (keysRef.current.has(leftKey) || (idx === 0 && keysRef.current.has('KeyA'))) s.x = Math.max(0, s.x - speed);
      if (keysRef.current.has(rightKey) || (idx === 0 && keysRef.current.has('KeyD'))) s.x = Math.min(CANVAS_WIDTH - s.width, s.x + speed);
      if (keysRef.current.has(actionKey) || (idx === 0 && (keysRef.current.has('KeyW') || keysRef.current.has('KeyS')))) {
        const count = activeEffectsRef.current.water > 0 ? 8 : 4;
        for (let i = 0; i < count; i++) {
          waterParticlesRef.current.push({
            x: s.x + s.width / 2, y: CANVAS_HEIGHT - 65,
            vx: (Math.random() - 0.5) * (activeEffectsRef.current.water > 0 ? 8 : 5),
            vy: -13 - Math.random() * 6, life: 1.0
          });
        }
      }
      if (s.x + s.width > AMBULANCE_X && s.occupants > 0) {
        internalScoreRef.current += s.occupants * (15 + internalLevelRef.current * 5);
        setScore(internalScoreRef.current);
        s.occupants = 0;
      }
    };
    processPlayer(0, 'ArrowLeft', 'ArrowRight', 'Space');
    if (settings.isMultiplayer) processPlayer(1, 'KeyA', 'KeyD', 'ShiftLeft');

    powerUpsRef.current.forEach(p => {
      p.y += p.vy;
      stretchersRef.current.forEach((s, idx) => {
        if (!settings.isMultiplayer && idx === 1) return;
        if (p.y > CANVAS_HEIGHT - 85 && p.x > s.x && p.x < s.x + s.width) {
          activeEffectsRef.current[p.type] = POWERUP_DURATION;
          p.y = CANVAS_HEIGHT + 200;
        }
      });
    });
    powerUpsRef.current = powerUpsRef.current.filter(p => p.y < CANVAS_HEIGHT);

    waterParticlesRef.current.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life -= 0.03;
      buildingsRef.current.forEach(b => {
        if (p.x > b.x && p.x < b.x + b.width) {
          const fIdx = Math.floor(((CANVAS_HEIGHT - 50) - p.y) / 80);
          if (fIdx >= 0 && fIdx < b.floors) {
            b.windowFireLevels[fIdx] = Math.max(0, b.windowFireLevels[fIdx] - WATER_EXTINGUISH_STRENGTH);
            p.life = 0;
          }
        }
      });
    });
    waterParticlesRef.current = waterParticlesRef.current.filter(p => p.life > 0);

    jumpersRef.current.forEach(j => {
      if (j.state === 'jumping' || j.state === 'bouncing') {
        j.vy += GRAVITY; j.x += j.vx; j.y += j.vy;
        if (activeEffectsRef.current.shield > 0) j.hasShield = true;
        stretchersRef.current.forEach((s, idx) => {
          if (!settings.isMultiplayer && idx === 1) return;
          if (j.y + JUMPER_SIZE > CANVAS_HEIGHT - 65 && j.y + JUMPER_SIZE < CANVAS_HEIGHT - 35 &&
              j.x > s.x - 15 && j.x < s.x + s.width + 15 && j.vy > 0) {
            if (s.occupants < s.maxOccupants) {
              s.occupants++; j.state = 'saved'; j.lingerTimer = INDICATOR_DURATION;
            } else { j.vy *= BOUNCE_FACTOR; j.y = CANVAS_HEIGHT - 67; }
          }
        });
        if (j.y > CANVAS_HEIGHT - 55) {
          if (j.hasShield) { j.hasShield = false; j.vy = -13; j.y = CANVAS_HEIGHT - 60; }
          else if (j.y > CANVAS_HEIGHT) {
            j.state = 'dead'; j.lingerTimer = INDICATOR_DURATION;
            internalLivesRef.current -= 1; setLives(internalLivesRef.current);
            if (internalLivesRef.current <= 0) setGameState(GameState.GAMEOVER);
          }
        }
      } else if (j.lingerTimer && j.lingerTimer > 0) { j.lingerTimer -= deltaTime; j.y -= 0.6; }
    });
    jumpersRef.current = jumpersRef.current.filter(j => j.state === 'jumping' || j.state === 'bouncing' || (j.lingerTimer && j.lingerTimer > 0));
  }, [gameState, settings, setScore, setLevel, setLives, setGameState, spawnJumper, spawnPowerUp]);

  const drawFire = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, intensity: number, time: number) => {
    if (intensity <= 5) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const flicker = Math.sin(time / 60 + x) * 8;
    const baseHeight = (h * (0.55 + intensity / 80) + flicker);
    const grad = ctx.createLinearGradient(x, y + h/2, x, y - baseHeight);
    grad.addColorStop(0, 'rgba(255, 40, 0, 0.9)');
    grad.addColorStop(0.4, 'rgba(255, 170, 0, 0.7)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x - w/2, y + h/2);
    ctx.bezierCurveTo(x - w, y - baseHeight/2, x - w/2, y - baseHeight, x, y - baseHeight - flicker);
    ctx.bezierCurveTo(x + w/2, y - baseHeight, x + w, y - baseHeight/2, x + w/2, y + h/2);
    ctx.fill();
    ctx.restore();
  };

  const drawBuilding = (ctx: CanvasRenderingContext2D, b: Building, time: number) => {
    const floorHeight = 80; const baseY = CANVAS_HEIGHT - 50;
    for (let f = 0; f < b.floors; f++) {
      const fy = baseY - (f + 1) * floorHeight;
      const fireLevel = b.windowFireLevels[f];
      const damage = b.structuralDamage[f];
      const destroyed = b.isFloorDestroyed[f];
      
      if (!destroyed) {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, fy, b.width, floorHeight);
        if (damage > 0) {
          ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.8, damage / 100)})`;
          ctx.fillRect(b.x, fy, b.width, floorHeight);
        }
        const winXPos = [b.x + 20, b.x + b.width - 50];
        winXPos.forEach(wx => {
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(wx, fy + 20, 30, 40);
          if (fireLevel > 5) drawFire(ctx, wx + 15, fy + 35, 45, 40, fireLevel, time);
        });
      } else {
        ctx.fillStyle = '#222';
        ctx.fillRect(b.x, fy + floorHeight - 10, b.width, 10);
      }
    }
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const time = Date.now();
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#020205'); bgGrad.addColorStop(1, '#0c0c1a');
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#0e0e0e'; ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
    buildingsRef.current.forEach(b => drawBuilding(ctx, b, time));
    
    emberParticlesRef.current.forEach(p => {
      ctx.fillStyle = `rgba(255, ${100 + p.life * 155}, 0, ${p.life})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    });

    rubbleParticlesRef.current.forEach(p => {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation); ctx.globalAlpha = p.life;
      ctx.fillStyle = '#333'; ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size); ctx.restore();
    });

    ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.roundRect(AMBULANCE_X, CANVAS_HEIGHT - 110, AMBULANCE_WIDTH, 60, 10); ctx.fill();
    ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(AMBULANCE_X+20, CANVAS_HEIGHT-50, 12, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(AMBULANCE_X+AMBULANCE_WIDTH-20, CANVAS_HEIGHT-50, 12, 0, Math.PI*2); ctx.fill();

    jumpersRef.current.forEach(j => {
      if (j.state === 'saved' || j.state === 'dead') {
        ctx.save(); ctx.font = '32px Arial'; ctx.textAlign = 'center';
        ctx.fillText(j.state === 'saved' ? '🚑' : '💔', j.x, j.y-25); ctx.restore(); return;
      }
      ctx.fillStyle = '#fef3c7'; ctx.beginPath(); ctx.arc(j.x, j.y-10, 8, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = j.color; ctx.beginPath(); ctx.roundRect(j.x-10, j.y-2, 20, 20, 5); ctx.fill();
    });
    
    stretchersRef.current.forEach((s, idx) => {
      if (settings.isMultiplayer || idx === 0) {
        ctx.save(); ctx.translate(s.x, CANVAS_HEIGHT - 60);
        ctx.fillStyle = idx === 0 ? '#4ade80' : '#60a5fa'; ctx.fillRect(0, 0, s.width, STRETCHER_HEIGHT);
        ctx.restore();
      }
    });
  }, [settings.isMultiplayer]);

  const loop = useCallback((time: number) => {
    if (lastTimeRef.current !== 0) update(time - lastTimeRef.current);
    lastTimeRef.current = time;
    if (canvasRef.current) { const ctx = canvasRef.current.getContext('2d'); if (ctx) draw(ctx); }
    requestRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [loop]);

  return <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-full shadow-inner" />;
};

export default Game;
