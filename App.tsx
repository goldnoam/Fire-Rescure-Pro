
import React, { useState, useCallback, useEffect } from 'react';
import { GameState, GameSettings, Language, FontSize } from './types';
import Game from './components/Game';
import Overlay from './components/Overlay';
import Controls from './components/Controls';
import { translations } from './translations';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [settings, setSettings] = useState<GameSettings>({
    isMultiplayer: false,
    firefighterFocus: 50,
    language: 'he',
    fontSize: 'medium'
  });
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(5);

  const t = translations[settings.language];

  // Local Text-to-Speech
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = settings.language === 'he' ? 'he-IL' : settings.language;
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  }, [settings.language]);

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
    speak(t.title + ". " + (isMulti ? t.multiPlayer : t.singlePlayer));
  };

  const handleRestart = () => {
    setGameState(GameState.MENU);
  };

  const handleReset = () => {
    setScore(0);
    setLevel(1);
    setLives(5);
    setGameState(GameState.PLAYING);
    speak(t.reset);
  };

  const handlePause = () => {
    if (gameState === GameState.PLAYING) {
      setGameState(GameState.PAUSED);
      speak(t.paused);
    } else if (gameState === GameState.PAUSED) {
      setGameState(GameState.PLAYING);
      speak(t.resume);
    }
  };

  useEffect(() => {
    if (gameState === GameState.GAMEOVER) {
      speak(t.gameOver + ". " + t.finalScore + ": " + score);
    }
  }, [gameState, score, t, speak]);

  return (
    <div className={`relative w-full h-screen overflow-hidden flex flex-col items-center justify-center font-sans transition-colors duration-300 font-size-${settings.fontSize} ${theme === 'dark' ? 'bg-[#121212]' : 'bg-[#f0f0f0]'} ${t.dir}`}>
      
      {/* Game Viewport Container */}
      <div 
        className={`game-container relative w-full max-w-[800px] aspect-[4/3] shadow-2xl overflow-hidden border-4 transition-all ${theme === 'dark' ? 'border-neutral-800 bg-black' : 'border-neutral-300 bg-white'}`}
        role="main"
        aria-label={t.title}
      >
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
          t={t}
          onStart={handleStartGame}
          onRestart={handleRestart}
          onReset={handleReset}
          onPause={handlePause}
          onSetSettings={setSettings}
          onToggleTheme={toggleTheme}
          onSpeak={speak}
        />

        {/* Ad Placeholder (Required by spec) */}
        <div className="absolute top-2 right-2 px-3 py-1 bg-yellow-500 text-black text-[10px] font-bold rounded animate-pulse pointer-events-none z-40">
          ADVERTISING
        </div>
      </div>

      {/* Mobile Controls */}
      {gameState === GameState.PLAYING && (
        <Controls 
          isMultiplayer={settings.isMultiplayer} 
          onPause={handlePause}
          t={t}
        />
      )}

      {/* Footer */}
      <footer className="mt-4 text-[11px] flex flex-col items-center gap-1 opacity-60 text-neutral-500 font-medium">
        <p>(C) Noam Gold AI 2026</p>
        <div className="flex gap-4">
          <a href="mailto:goldnoamai@gmail.com" className="hover:text-orange-500 transition-colors">Send Feedback</a>
          <span aria-hidden="true">|</span>
          <span>goldnoamai@gmail.com</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
