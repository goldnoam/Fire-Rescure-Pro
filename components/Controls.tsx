
import React from 'react';

interface ControlsProps {
  isMultiplayer: boolean;
  onPause: () => void;
}

const Controls: React.FC<ControlsProps> = ({ isMultiplayer, onPause }) => {
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
            className="w-16 h-16 bg-blue-500/80 rounded-full flex flex-col items-center justify-center border-2 border-white pointer-events-auto active:bg-blue-300"
          >
            <span className="text-white font-bold text-xs">W/S</span>
            <span className="text-white font-bold">מים</span>
          </button>
          <div className="flex gap-4 pointer-events-auto">
            <button 
              onTouchStart={() => handleMove(1, 'left')}
              onTouchEnd={() => handleMove(1, 'stop')}
              className="w-20 h-20 bg-neutral-800/80 rounded-full flex flex-col items-center justify-center border-2 border-neutral-600 active:bg-orange-500 transition-colors"
            >
              <span className="text-white text-xs font-bold">A</span>
              <span className="text-3xl text-white">◀</span>
            </button>
            <button 
              onTouchStart={() => handleMove(1, 'right')}
              onTouchEnd={() => handleMove(1, 'stop')}
              className="w-20 h-20 bg-neutral-800/80 rounded-full flex flex-col items-center justify-center border-2 border-neutral-600 active:bg-orange-500 transition-colors"
            >
              <span className="text-white text-xs font-bold">D</span>
              <span className="text-3xl text-white">▶</span>
            </button>
          </div>
        </div>

        {/* Center Pause */}
        <div className="pointer-events-auto mb-4">
          <button 
            onClick={onPause}
            className="w-14 h-14 bg-red-600/80 rounded-full flex items-center justify-center border-2 border-red-400"
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
              className="w-16 h-16 bg-blue-500/80 rounded-full flex items-center justify-center border-2 border-white pointer-events-auto active:bg-blue-300"
            >
              <span className="text-white font-bold">מים</span>
            </button>
            <div className="flex gap-4 pointer-events-auto">
              <button 
                onTouchStart={() => handleMove(2, 'left')}
                onTouchEnd={() => handleMove(2, 'stop')}
                className="w-20 h-20 bg-blue-800/80 rounded-full flex items-center justify-center border-2 border-blue-600 active:bg-blue-500 transition-colors"
              >
                <span className="text-3xl text-white">◀</span>
              </button>
              <button 
                onTouchStart={() => handleMove(2, 'right')}
                onTouchEnd={() => handleMove(2, 'stop')}
                className="w-20 h-20 bg-blue-800/80 rounded-full flex items-center justify-center border-2 border-blue-600 active:bg-blue-500 transition-colors"
              >
                <span className="text-3xl text-white">▶</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-40" />
        )}
      </div>
    </div>
  );
};

export default Controls;
