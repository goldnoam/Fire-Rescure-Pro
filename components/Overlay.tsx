
import React, { useState, useEffect } from 'react';
import { GameState, GameSettings, Language, FontSize } from '../types';

interface OverlayProps {
  gameState: GameState;
  score: number;
  level: number;
  lives: number;
  settings: GameSettings;
  theme: 'dark' | 'light';
  t: any;
  onStart: (multi: boolean) => void;
  onRestart: () => void;
  onReset: () => void;
  onPause: () => void;
  onSetSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  onToggleTheme: () => void;
  onSpeak: (text: string) => void;
}

const Overlay: React.FC<OverlayProps> = ({ 
  gameState, score, level, lives, settings, theme, t,
  onStart, onRestart, onReset, onPause, onSetSettings, onToggleTheme, onSpeak 
}) => {
  const [goalData, setGoalData] = useState({ current: 0, goal: 3 });

  useEffect(() => {
    const handleGoalUpdate = (e: any) => setGoalData(e.detail);
    window.addEventListener('update-goal', handleGoalUpdate);
    return () => window.removeEventListener('update-goal', handleGoalUpdate);
  }, []);

  const languages: { code: Language; label: string }[] = [
    { code: 'he', label: 'עברית' },
    { code: 'en', label: 'English' },
    { code: 'zh', label: '中文' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
  ];

  const fontSizes: FontSize[] = ['small', 'medium', 'large'];

  if (gameState === GameState.PLAYING) {
    return (
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none text-white font-bold drop-shadow-md z-30">
        <div className="flex flex-col gap-1">
          <div className="bg-black/60 px-3 py-1 rounded backdrop-blur-sm" aria-live="polite">
            {t.score.replace('{val}', score)}
          </div>
          <div className="bg-black/60 px-3 py-1 rounded text-blue-300 backdrop-blur-sm">
            {t.level.replace('{val}', level)}
          </div>
          <div className="bg-black/60 px-3 py-1 rounded text-green-400 backdrop-blur-sm text-xs mt-1">
            {t.goalProgress.replace('{current}', goalData.current).replace('{goal}', goalData.goal)}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex gap-1" role="img" aria-label={`${lives} lives remaining`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full transition-all duration-300 ${i < lives ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-neutral-800'}`}
              />
            ))}
          </div>
          <button 
            onClick={onPause}
            className="bg-black/60 hover:bg-neutral-800 p-2 rounded text-xs transition-colors backdrop-blur-sm"
            aria-label={t.paused}
          >
            ⏸ {t.paused}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`${theme === 'dark' ? 'bg-[#1e1e1e] border-neutral-700 text-white' : 'bg-white border-neutral-200 text-neutral-900'} border-2 p-8 rounded-3xl max-w-lg w-full text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col gap-5 overflow-y-auto max-h-[95vh]`}>
        
        {gameState === GameState.MENU && (
          <>
            <div className="flex justify-between items-center">
              <button 
                onClick={onToggleTheme} 
                className="p-3 rounded-xl hover:bg-neutral-700/20 text-2xl"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <h1 className="text-4xl font-black text-orange-500 uppercase tracking-tighter drop-shadow-lg">{t.title}</h1>
              <div className="w-10" />
            </div>
            
            <p className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>{t.subtitle}</p>
            
            <div className="space-y-4 text-right">
              <div className={`${theme === 'dark' ? 'bg-orange-600/10 border-orange-500/20' : 'bg-orange-50 border-orange-200'} border p-4 rounded-2xl text-start`}>
                <h3 className="text-sm font-bold text-orange-500 mb-2">🎮 {t.controls}</h3>
                <p className="text-xs mb-1 font-medium">{t.goal}</p>
                <ul className="text-xs space-y-1 opacity-80 list-disc list-inside">
                  <li>{t.p1Keys}</li>
                  <li>{t.p2Keys}</li>
                </ul>
              </div>

              <div className={`${theme === 'dark' ? 'bg-neutral-800/50' : 'bg-neutral-100'} p-4 rounded-2xl space-y-4`}>
                <div className="flex flex-col gap-2 text-start">
                  <label className="text-xs font-bold uppercase opacity-60">🌐 Language / שפה</label>
                  <div className="flex flex-wrap gap-2">
                    {languages.map(lang => (
                      <button 
                        key={lang.code}
                        onClick={() => {
                          onSetSettings(s => ({ ...s, language: lang.code }));
                          onSpeak(lang.label);
                        }}
                        className={`px-3 py-1 text-xs rounded-full border transition-all ${settings.language === lang.code ? 'bg-orange-600 border-orange-600 text-white' : 'border-neutral-500 hover:border-orange-500'}`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-start">
                  <label className="text-xs font-bold uppercase opacity-60">📏 Font Size / גודל גופן</label>
                  <div className="flex gap-2">
                    {fontSizes.map(size => (
                      <button 
                        key={size}
                        onClick={() => {
                          onSetSettings(s => ({ ...s, fontSize: size }));
                          onSpeak(size);
                        }}
                        className={`flex-1 py-1 text-xs rounded-full border transition-all capitalize ${settings.fontSize === size ? 'bg-blue-600 border-blue-600 text-white' : 'border-neutral-500 hover:border-blue-500'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-start">
                  <label className="text-xs font-bold uppercase opacity-60">⚙️ {t.fireFocus.replace('{val}', settings.firefighterFocus)}</label>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={settings.firefighterFocus}
                    onChange={(e) => onSetSettings(s => ({ ...s, firefighterFocus: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    aria-label="Firefighter Focus Slider"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => onStart(false)}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white py-4 rounded-2xl font-black text-lg transition-all transform active:scale-95 shadow-xl"
                >
                  {t.singlePlayer}
                </button>
                <button 
                  onClick={() => onStart(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-lg transition-all transform active:scale-95 shadow-xl"
                >
                  {t.multiPlayer}
                </button>
              </div>
            </div>
          </>
        )}

        {gameState === GameState.PAUSED && (
          <>
            <h2 className="text-4xl font-black text-orange-500">{t.paused}</h2>
            <div className="flex flex-col gap-3">
              <button 
                onClick={onPause}
                className="bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-2xl font-black text-2xl shadow-lg"
              >
                {t.resume}
              </button>
              <button 
                onClick={onReset}
                className="bg-neutral-600 hover:bg-neutral-500 text-white py-4 rounded-2xl font-black text-lg"
              >
                {t.reset}
              </button>
              <button 
                onClick={onRestart}
                className="text-neutral-500 hover:text-orange-500 font-bold transition-colors mt-4"
              >
                {t.backToMenu}
              </button>
            </div>
          </>
        )}

        {gameState === GameState.GAMEOVER && (
          <>
            <h2 className="text-5xl font-black text-red-600 tracking-tighter italic">{t.gameOver}</h2>
            <div className={`${theme === 'dark' ? 'bg-neutral-900' : 'bg-neutral-100'} p-8 rounded-3xl border-2 border-orange-500/20`}>
              <p className="text-neutral-500 uppercase font-bold text-xs mb-1">{t.finalScore}</p>
              <p className="text-7xl font-black drop-shadow-lg">{score}</p>
              <p className="text-blue-500 font-bold mt-2">{t.level.replace('{val}', level)}</p>
            </div>
            <button 
              onClick={() => onStart(settings.isMultiplayer)}
              className="bg-orange-600 hover:bg-orange-500 text-white py-5 rounded-2xl font-black text-2xl shadow-[0_10px_20px_rgba(234,88,12,0.3)] transition-all transform active:scale-95"
            >
              {t.tryAgain}
            </button>
            <button 
              onClick={onRestart}
              className="text-neutral-500 hover:text-orange-500 font-bold"
            >
              {t.backToMenu}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Overlay;
