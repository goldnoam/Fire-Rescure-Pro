
import React from 'react';

interface ControlsProps {
  isMultiplayer: boolean;
  onPause: () => void;
  t: any;
}

const Controls: React.FC<ControlsProps> = ({ isMultiplayer, onPause, t }) => {
  const handleMove = (player: number, dir: string) => {
    window.dispatchEvent(new CustomEvent('game-move', { detail: { player, dir } }));
  };

  return (
    <div className="fixed bottom-0 left-0 w-full p-4 flex flex-col gap-4 pointer-events-none md:hidden z-40">
      <div className="flex justify-between items-end">
        {/* Player 1 Controls */}
        <div className="flex flex-col gap-4 items-center">
          <button 
            onTouchStart={() => handleMove(1, 'action')}
            onTouchEnd={() => handleMove(1, 'stopAction')}
            className="w-16 h-16 bg-blue-600/90 rounded-2xl flex flex-col items-center justify-center border-2 border-blue-400 shadow-lg pointer-events-auto active:bg-blue-400 active:scale-90 transition-all"
            aria-label={t.water}
          >
            <span className="text-white font-black text-[10px] opacity-60">W/S</span>
            <span className="text-white font-black text-xs">{t.water}</span>
          </button>
          <div className="flex gap-4 pointer-events-auto">
            <button 
              onTouchStart={() => handleMove(1, 'left')}
              onTouchEnd={() => handleMove(1, 'stop')}
              className="w-20 h-20 bg-neutral-800/90 rounded-2xl flex flex-col items-center justify-center border-2 border-neutral-600 active:bg-orange-600 active:scale-90 transition-all shadow-xl"
              aria-label="Move Left"
            >
              <span className="text-white text-[10px] font-black opacity-40 mb-1">A</span>
              <span className="text-3xl text-white leading-none">◀</span>
            </button>
            <button 
              onTouchStart={() => handleMove(1, 'right')}
              onTouchEnd={() => handleMove(1, 'stop')}
              className="w-20 h-20 bg-neutral-800/90 rounded-2xl flex flex-col items-center justify-center border-2 border-neutral-600 active:bg-orange-600 active:scale-90 transition-all shadow-xl"
              aria-label="Move Right"
            >
              <span className="text-white text-[10px] font-black opacity-40 mb-1">D</span>
              <span className="text-3xl text-white leading-none">▶</span>
            </button>
          </div>
        </div>

        {/* Center Pause */}
        <div className="pointer-events-auto mb-4">
          <button 
            onClick={onPause}
            className="w-14 h-14 bg-red-600/90 rounded-full flex items-center justify-center border-2 border-red-400 shadow-lg active:scale-90 transition-all"
            aria-label="Pause"
          >
            <span className="text-white text-xl">⏸</span>
          </button>
        </div>

        {/* Player 2 Controls (Multiplayer Only) */}
        {isMultiplayer ? (
          <div className="flex flex-col gap-4 items-center">
            <button 
              onTouchStart={() => handleMove(2, 'action')}
              onTouchEnd={() => handleMove(2, 'stopAction')}
              className="w-16 h-16 bg-blue-600/90 rounded-2xl flex items-center justify-center border-2 border-blue-400 shadow-lg pointer-events-auto active:bg-blue-400 active:scale-90 transition-all"
              aria-label={t.water}
            >
              <span className="text-white font-black text-xs">{t.water}</span>
            </button>
            <div className="flex gap-4 pointer-events-auto">
              <button 
                onTouchStart={() => handleMove(2, 'left')}
                onTouchEnd={() => handleMove(2, 'stop')}
                className="w-20 h-20 bg-blue-900/90 rounded-2xl flex items-center justify-center border-2 border-blue-700 active:bg-blue-500 active:scale-90 transition-all shadow-xl"
                aria-label="Player 2 Left"
              >
                <span className="text-3xl text-white leading-none">◀</span>
              </button>
              <button 
                onTouchStart={() => handleMove(2, 'right')}
                onTouchEnd={() => handleMove(2, 'stop')}
                className="w-20 h-20 bg-blue-900/90 rounded-2xl flex items-center justify-center border-2 border-blue-700 active:bg-blue-500 active:scale-90 transition-all shadow-xl"
                aria-label="Player 2 Right"
              >
                <span className="text-3xl text-white leading-none">▶</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-20" />
        )}
      </div>
    </div>
  );
};

export default Controls;
