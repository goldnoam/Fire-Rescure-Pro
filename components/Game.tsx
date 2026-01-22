
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  GameState, Building, Jumper, Stretcher, WaterParticle, EmberParticle, RubbleParticle, PowerUp, PowerUpType, GameSettings 
} from '../types';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, BUILDINGS_DATA, STRETCHER_WIDTH, 
  STRETCHER_HEIGHT, JUMPER_SIZE, GRAVITY, BOUNCE_FACTOR, 
  STRETCHER_SPEED, FIRE_GROWTH_RATE, 
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
    windowFireLevels: new Array(b.floors).fill(0).map(() => Math.random() < 0.2 ? 10 + Math.random() * 5 : 0),
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
  const lastTimeRef = useRef<number>(0);
  const internalLivesRef = useRef<number>(INITIAL_LIVES);
  const internalLevelRef = useRef<number>(1);
  const internalScoreRef = useRef<number>(0);
  
  // Rescue progression
  const rescuedInLevelRef = useRef<number>(0);
  const getLevelGoal = (lvl: number) => (lvl === 1 ? 3 : 3 + (lvl - 1) * 7);

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
      internalLivesRef.current = INITIAL_LIVES;
      internalLevelRef.current = 1;
      internalScoreRef.current = 0;
      rescuedInLevelRef.current = 0;
      setLives(INITIAL_LIVES);
      setLevel(1);
      setScore(0);
      
      // Dispatch initial goal
      window.dispatchEvent(new CustomEvent('update-goal', { 
        detail: { current: 0, goal: getLevelGoal(1) } 
      }));
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
        if (dir === 'left') keysRef.current.add('KeyA');
        if (dir === 'right') keysRef.current.add('KeyD');
        if (dir === 'action') keysRef.current.add('KeyW');
        if (dir === 'stop') { keysRef.current.delete('KeyA'); keysRef.current.delete('KeyD'); }
        if (dir === 'stopAction') keysRef.current.delete('KeyW');
      } else {
        if (dir === 'left') keysRef.current.add('ArrowLeft');
        if (dir === 'right') keysRef.current.add('ArrowRight');
        if (dir === 'action') keysRef.current.add('Space');
        if (dir === 'stop') { keysRef.current.delete('ArrowLeft'); keysRef.current.delete('ArrowRight'); }
        if (dir === 'stopAction') keysRef.current.delete('Space');
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
      b.windowFireLevels.some((lvl, idx) => lvl > 10 && !b.isFloorDestroyed[idx])
    );
    if (burningBuildings.length === 0) return;

    const building = burningBuildings[Math.floor(Math.random() * burningBuildings.length)];
    const bIndex = buildingsRef.current.indexOf(building);
    const validFloors = building.windowFireLevels
      .map((lvl, idx) => (lvl > 10 && !building.isFloorDestroyed[idx]) ? idx : -1)
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
      vx: (Math.random() - 0.5) * (1.5 + internalLevelRef.current * 0.2),
      vy: -1.5 - (internalLevelRef.current * 0.1),
      state: 'jumping',
      color: `hsla(${Math.random() * 360}, 80%, 75%, 0.9)`,
      hasShield: activeEffectsRef.current.shield > 0
    });
  }, []);

  const spawnRubble = (x: number, y: number, width: number) => {
    for(let i=0; i<15; i++) {
      rubbleParticlesRef.current.push({
        x: x + Math.random() * width,
        y: y + Math.random() * 20,
        vx: (Math.random() - 0.5) * 12,
        vy: -5 - Math.random() * 10,
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.8,
        size: 8 + Math.random() * 20,
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

    Object.keys(activeEffectsRef.current).forEach((key) => {
      const k = key as PowerUpType;
      if (activeEffectsRef.current[k] > 0) {
        activeEffectsRef.current[k] = Math.max(0, activeEffectsRef.current[k] - deltaTime);
      }
    });

    // Difficulty Scaling: Quadratic increase for faster difficulty ramp
    const difficultyScaling = 0.4 + (Math.pow(internalLevelRef.current, 2) * 0.2);

    buildingsRef.current.forEach(b => {
      const growthModifier = (1 - (settings.firefighterFocus / 100)) * 1.5;
      b.windowFireLevels.forEach((lvl, i) => {
        if (b.isFloorDestroyed[i]) {
          b.windowFireLevels[i] = Math.max(0, lvl - 0.1);
          return;
        }

        let change = lvl > 0 ? FIRE_GROWTH_RATE * difficultyScaling * growthModifier : 0;
        if (i > 0) {
          const heatBelow = b.windowFireLevels[i-1];
          if (heatBelow > 25) change += (heatBelow - 25) * 0.01 * difficultyScaling;
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

        if (lvl > 50 && Math.random() < 0.08) {
          emberParticlesRef.current.push({
            x: b.x + Math.random() * b.width,
            y: CANVAS_HEIGHT - 50 - (i + 1) * 80 + 40,
            vx: (Math.random() - 0.5) * 2.5,
            vy: -1.5 - Math.random() * 2.5,
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

    emberParticlesRef.current.forEach(p => { p.x += p.vx + Math.sin(Date.now()/500); p.y += p.vy; p.life -= 0.015; });
    emberParticlesRef.current = emberParticlesRef.current.filter(p => p.life > 0);

    rubbleParticlesRef.current.forEach(p => { 
      p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.rotation += p.vr; p.life -= 0.005; 
      if (p.y > CANVAS_HEIGHT - 50) { p.y = CANVAS_HEIGHT - 50; p.vy = 0; p.vx = 0; p.vr = 0; }
    });
    rubbleParticlesRef.current = rubbleParticlesRef.current.filter(p => p.life > 0);

    const totalFirePower = buildingsRef.current.reduce((acc, b) => acc + b.windowFireLevels.reduce((f, l) => f + (l > 10 ? 1 : 0), 0), 0);
    // Jumper spawn chance now also depends heavily on difficulty scaling
    const spawnChance = (totalFirePower * 0.0025) * difficultyScaling;
    if (Math.random() < spawnChance) spawnJumper();
    if (Math.random() < POWERUP_SPAWN_CHANCE) spawnPowerUp();

    const processPlayer = (idx: number, leftKeys: string[], rightKeys: string[], actionKeys: string[]) => {
      const s = stretchersRef.current[idx];
      const speed = activeEffectsRef.current.speed > 0 ? STRETCHER_SPEED * 1.6 : STRETCHER_SPEED;
      
      const moveLeft = leftKeys.some(k => keysRef.current.has(k));
      const moveRight = rightKeys.some(k => keysRef.current.has(k));
      const sprayWater = actionKeys.some(k => keysRef.current.has(k));

      if (moveLeft) s.x = Math.max(0, s.x - speed);
      if (moveRight) s.x = Math.min(CANVAS_WIDTH - s.width, s.x + speed);
      
      if (sprayWater) {
        const count = activeEffectsRef.current.water > 0 ? 12 : 7;
        for (let i = 0; i < count; i++) {
          waterParticlesRef.current.push({
            x: s.x + s.width / 2, y: CANVAS_HEIGHT - 65,
            vx: (Math.random() - 0.5) * (activeEffectsRef.current.water > 0 ? 12 : 8),
            vy: -16 - Math.random() * 10, life: 1.0
          });
        }
      }

      if (s.x + s.width > AMBULANCE_X && s.occupants > 0) {
        const count = s.occupants;
        internalScoreRef.current += count * (15 + internalLevelRef.current * 10);
        setScore(internalScoreRef.current);
        
        rescuedInLevelRef.current += count;
        s.occupants = 0;
        
        const currentGoal = getLevelGoal(internalLevelRef.current);
        window.dispatchEvent(new CustomEvent('update-goal', { 
          detail: { current: rescuedInLevelRef.current, goal: currentGoal } 
        }));

        if (rescuedInLevelRef.current >= currentGoal) {
          internalLevelRef.current += 1;
          rescuedInLevelRef.current = 0;
          setLevel(internalLevelRef.current);
          window.dispatchEvent(new CustomEvent('update-goal', { 
            detail: { current: 0, goal: getLevelGoal(internalLevelRef.current) } 
          }));
        }
      }
    };

    if (!settings.isMultiplayer) {
      processPlayer(0, ['KeyA', 'ArrowLeft'], ['KeyD', 'ArrowRight'], ['KeyW', 'ArrowUp', 'Space']);
    } else {
      processPlayer(0, ['KeyA'], ['KeyD'], ['KeyW']);
      processPlayer(1, ['ArrowLeft'], ['ArrowRight'], ['Space']);
    }

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
      p.x += p.vx; p.y += p.vy; p.vy += 0.4; p.life -= 0.035;
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
              j.x > s.x - 20 && j.x < s.x + s.width + 20 && j.vy > 0) {
            if (s.occupants < s.maxOccupants) {
              s.occupants++; j.state = 'saved'; j.lingerTimer = INDICATOR_DURATION;
            } else { j.vy *= BOUNCE_FACTOR; j.y = CANVAS_HEIGHT - 67; }
          }
        });
        if (j.y > CANVAS_HEIGHT - 55) {
          if (j.hasShield) { j.hasShield = false; j.vy = -14; j.y = CANVAS_HEIGHT - 60; }
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
    if (intensity <= 3) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const flicker = Math.sin(time / 60 + x) * 8;
    const baseHeight = (h * (0.5 + intensity / 80) + flicker);
    const grad = ctx.createLinearGradient(x, y + h/2, x, y - baseHeight);
    grad.addColorStop(0, 'rgba(255, 30, 0, 0.9)');
    grad.addColorStop(0.4, 'rgba(255, 150, 0, 0.7)');
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
        let offsetX = 0;
        let offsetY = 0;
        if (damage > 35 || fireLevel > DAMAGE_THRESHOLD) {
          const shakeMag = (damage / 10) + (fireLevel > DAMAGE_THRESHOLD ? (fireLevel - DAMAGE_THRESHOLD) / 3 : 0);
          offsetX = (Math.random() - 0.5) * shakeMag;
          offsetY = (Math.random() - 0.5) * shakeMag;
        }

        ctx.fillStyle = b.color;
        ctx.fillRect(b.x + offsetX, fy + offsetY, b.width, floorHeight);
        
        if (damage > 0) {
          ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.85, damage / 90)})`;
          ctx.fillRect(b.x + offsetX, fy + offsetY, b.width, floorHeight);
          
          if (damage > 65) {
            const glowVal = (Math.sin(time / 140) * 0.25) + 0.25;
            ctx.fillStyle = `rgba(255, 40, 0, ${glowVal})`;
            ctx.fillRect(b.x + offsetX, fy + offsetY, b.width, floorHeight);
          }

          if (damage > 20) {
            ctx.strokeStyle = `rgba(0, 0, 0, ${0.4 + (damage / 100)})`;
            ctx.lineWidth = 1 + (damage / 20);
            ctx.beginPath();
            ctx.moveTo(b.x + offsetX + 20, fy + offsetY + 15);
            ctx.lineTo(b.x + offsetX + 40, fy + offsetY + 50);
            if (damage > 55) ctx.lineTo(b.x + offsetX + 20, fy + offsetY + 85);
            ctx.moveTo(b.x + b.width + offsetX - 25, fy + offsetY + 20);
            ctx.lineTo(b.x + b.width + offsetX - 60, fy + offsetY + 60);
            if (damage > 75) ctx.lineTo(b.x + b.width + offsetX - 20, fy + offsetY + 90);
            ctx.stroke();
          }
        }

        const winXPos = [b.x + 20, b.x + b.width - 50];
        winXPos.forEach(wx => {
          if (damage > 75) {
            ctx.strokeStyle = `rgba(255, 0, 0, ${(Math.sin(time / 80) * 0.6) + 0.4})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(wx + offsetX - 3, fy + 17 + offsetY, 36, 46);
          }
          ctx.fillStyle = '#080808'; 
          ctx.fillRect(wx + offsetX, fy + 20 + offsetY, 30, 40);
          if (fireLevel > 3) drawFire(ctx, wx + 15 + offsetX, fy + 35 + offsetY, 45, 40, fireLevel, time);
        });
      } else {
        ctx.fillStyle = '#040404';
        ctx.fillRect(b.x, fy + floorHeight - 25, b.width, 25);
        if (Math.random() < 0.25) {
            emberParticlesRef.current.push({
                x: b.x + Math.random() * b.width,
                y: fy + floorHeight - 20,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 5,
                life: 0.7 + Math.random() * 0.3,
                size: 1 + Math.random() * 4
            });
        }
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
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size); ctx.restore();
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
