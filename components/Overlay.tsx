
import React from 'react';
import { GameState, GameSettings } from '../types';

interface OverlayProps {
  gameState: GameState;
  score: number;
  level: number;
  lives: number;
  settings: GameSettings;
  theme: 'dark' | 'light';
  onStart: (multi: boolean) => void;
  onRestart: () => void;
  onReset: () => void;
  onPause: () => void;
  onSetSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  onToggleTheme: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ 
  gameState, score, level, lives, settings, theme,
  onStart, onRestart, onReset, onPause, onSetSettings, onToggleTheme 
}) => {
  if (gameState === GameState.PLAYING) {
    return (
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none text-white font-bold drop-shadow-md z-30">
        <div className="flex flex-col gap-1">
          <div className="bg-black/50 px-3 py-1 rounded">Score: {score}</div>
          <div className="bg-black/50 px-3 py-1 rounded text-blue-300">Level: {level}</div>
        </div>
        <div className="flex flex-col items-end gap-1 pointer-events-auto">
          <div className="flex gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full ${i < lives ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]' : 'bg-neutral-700'}`}
              />
            ))}
          </div>
          <button 
            onClick={onPause}
            className="bg-black/50 hover:bg-neutral-800 p-2 rounded text-xs transition-colors"
          >
            ⏸ Pause
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`${theme === 'dark' ? 'bg-neutral-800 border-neutral-600' : 'bg-white border-neutral-300 text-neutral-900'} border-2 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl flex flex-col gap-6`}>
        
        {gameState === GameState.MENU && (
          <>
            <div className="flex justify-between items-center mb-2">
              <button onClick={onToggleTheme} className="p-2 rounded-full hover:bg-neutral-700/20 text-xl">
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <h1 className="text-4xl font-black text-orange-500 uppercase tracking-tighter">Fire Rescue Pro</h1>
              <div className="w-8" />
            </div>
            
            <p className={theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}>הצילו את האזרחים מהבניינים הבוערים! העבירו אותם לאמבולנס במהירות.</p>
            
            <div className="space-y-4">
              <div className={`${theme === 'dark' ? 'bg-neutral-700/50' : 'bg-neutral-100'} p-4 rounded-lg`}>
                <label className="text-sm font-semibold mb-2 block">מיקוד צוותים: {settings.firefighterFocus}% כיבוי</label>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={settings.firefighterFocus}
                  onChange={(e) => onSetSettings(s => ({ ...s, firefighterFocus: parseInt(e.target.value) }))}
                  className="w-full accent-orange-500"
                />
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => onStart(false)}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold transition-all transform active:scale-95"
                >
                  שחקן יחיד
                </button>
                <button 
                  onClick={() => onStart(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-all transform active:scale-95"
                >
                  זוג שחקנים
                </button>
              </div>
            </div>
          </>
        )}

        {gameState === GameState.PAUSED && (
          <>
            <h2 className="text-3xl font-bold">המשחק נעצר</h2>
            <div className="flex flex-col gap-3">
              <button 
                onClick={onPause}
                className="bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-xl font-bold text-xl"
              >
                המשך
              </button>
              <button 
                onClick={onReset}
                className="bg-neutral-600 hover:bg-neutral-500 text-white py-3 rounded-xl font-bold"
              >
                אפס משחק
              </button>
              <button 
                onClick={onRestart}
                className="text-neutral-500 hover:text-orange-500 transition-colors"
              >
                חזרה לתפריט
              </button>
            </div>
          </>
        )}

        {gameState === GameState.GAMEOVER && (
          <>
            <h2 className="text-4xl font-bold text-red-500">המשחק נגמר</h2>
            <div className={`${theme === 'dark' ? 'bg-neutral-900/50' : 'bg-neutral-100'} p-6 rounded-xl space-y-2`}>
              <p className="text-neutral-400">ציון סופי</p>
              <p className="text-5xl font-black">{score}</p>
              <p className="text-sm text-blue-400">הגעת לשלב {level}</p>
            </div>
            <button 
              onClick={onRestart}
              className="bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-xl font-bold text-xl shadow-lg"
            >
              נסה שוב
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Overlay;
