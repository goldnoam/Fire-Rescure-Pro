
import React, { useState, useEffect } from 'react';
import { GameState, GameSettings } from './types';
import Game from './components/Game';
import Overlay from './components/Overlay';
import Controls from './components/Controls';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [settings, setSettings] = useState<GameSettings>({
    isMultiplayer: false,
    firefighterFocus: 50,
  });
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(5);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.className = newTheme === 'dark' ? 'dark-theme' : 'light-theme';
  };

  const handleStartGame = (isMulti: boolean) => {
    setSettings(prev => ({ ...prev, isMultiplayer: isMulti }));
    setGameState(GameState.PLAYING);
    setScore(0);
    setLevel(1);
    setLives(5);
  };

  const handleRestart = () => {
    setGameState(GameState.MENU);
  };

  const handleReset = () => {
    setScore(0);
    setLevel(1);
    setLives(5);
    setGameState(GameState.PLAYING);
  };

  const handlePause = () => {
    if (gameState === GameState.PLAYING) setGameState(GameState.PAUSED);
    else if (gameState === GameState.PAUSED) setGameState(GameState.PLAYING);
  };

  return (
    <div className={`relative w-full h-screen overflow-hidden flex flex-col items-center justify-center font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
      
      {/* Game Viewport Container */}
      <div className={`game-container relative w-full max-w-[800px] aspect-[4/3] shadow-2xl overflow-hidden border-4 ${theme === 'dark' ? 'border-neutral-800 bg-black' : 'border-neutral-300 bg-white'}`}>
        <Game 
          gameState={gameState}
          settings={settings}
          setScore={setScore}
          setLevel={setLevel}
          setLives={setLives}
          setGameState={setGameState}
        />

        <Overlay 
          gameState={gameState}
          score={score}
          level={level}
          lives={lives}
          settings={settings}
          theme={theme}
          onStart={handleStartGame}
          onRestart={handleRestart}
          onReset={handleReset}
          onPause={handlePause}
          onSetSettings={setSettings}
          onToggleTheme={toggleTheme}
        />

        {/* Ad Placeholder */}
        <div className="absolute top-2 right-2 px-3 py-1 bg-yellow-500 text-black text-[10px] font-bold rounded animate-pulse pointer-events-none z-40">
          ADVERTISING
        </div>
      </div>

      {/* Mobile Controls */}
      {gameState === GameState.PLAYING && (
        <Controls 
          isMultiplayer={settings.isMultiplayer} 
          onPause={handlePause}
        />
      )}

      {/* Footer */}
      <footer className="mt-4 text-[10px] flex flex-col items-center gap-1 opacity-50 text-neutral-500">
        <p>(C) Noam Gold AI 2026</p>
        <div className="flex gap-4">
          <a href="mailto:goldnoamai@gmail.com" className="hover:underline">Send Feedback</a>
          <span>goldnoamai@gmail.com</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
