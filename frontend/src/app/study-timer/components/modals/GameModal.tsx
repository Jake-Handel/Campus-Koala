'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad, Bomb, Blocks, Sparkles, ArrowLeft } from 'lucide-react';
import React, { useState } from 'react';
import { SnakeGame, Minesweeper } from '@/components/games';

interface StudySession {
  id: string;
  subject: string;
  duration: number;
  break_duration?: number;
  type: 'study' | 'break';
  isCurrent?: boolean;
  completed: boolean;
  completed_at?: Date;
  created_at: Date;
  updated_at?: Date;
  startTime?: Date;
  end_time?: Date;
  notes?: string;
  user_id?: number;
  metadata?: {
    gameType?: string;
    showGame?: boolean;
    [key: string]: any;
  };
}

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGame: (game: 'snake' | 'minesweeper' | 'tetris') => void;
  currentSession?: StudySession | null;
}

export default function GameModal({ isOpen, onClose, onSelectGame, currentSession = null }: GameModalProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [gameScore, setGameScore] = useState(0);

  const handleGameSelect = (game: 'snake' | 'minesweeper' | 'tetris') => {
    setSelectedGame(game);
    onSelectGame(game);
  };

  const handleBack = () => {
    setSelectedGame(null);
  };

  const handleGameOver = (score: number) => {
    setGameScore(score);
    // You can add any additional game over handling here
  };
  const games = [
    { 
      id: 'snake', 
      name: 'Snake', 
      icon: <Gamepad />, 
      color: 'from-emerald-500 to-teal-500',
      bg: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30',
      hover: 'hover:shadow-emerald-100 dark:hover:shadow-emerald-900/20',
      darkHover: 'dark:hover:bg-emerald-900/20',
      iconColor: 'text-white dark:text-gray-100'
    },
    { 
      id: 'minesweeper', 
      name: 'Minesweeper', 
      icon: <Bomb />, 
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30',
      hover: 'hover:shadow-amber-100 dark:hover:shadow-amber-900/20',
      darkHover: 'dark:hover:bg-amber-900/20',
      iconColor: 'text-white dark:text-gray-100'
    },
    { 
      id: 'tetris', 
      name: 'Tetris', 
      icon: <Blocks />, 
      color: 'from-indigo-500 to-purple-500',
      bg: 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30',
      hover: 'hover:shadow-indigo-100 dark:hover:shadow-indigo-900/20',
      darkHover: 'dark:hover:bg-indigo-900/20',
      iconColor: 'text-white dark:text-gray-100'
    },
  ];

  const renderContent = () => {
    console.log('GameModal renderContent called', { selectedGame, currentSession });
    
    if (selectedGame) {
      console.log('Selected game:', selectedGame);
      // Render the selected game
      if (selectedGame === 'snake') {
        return (
          <div className="w-full max-w-md p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <SnakeGame onGameOver={handleGameOver} />
            <button
              onClick={handleBack}
              className="mt-4 flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to games
            </button>
          </div>
        );
      }
      
      if (selectedGame === 'minesweeper') {
        return (
          <div className="w-full max-w-4xl p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <Minesweeper onGameOver={handleGameOver} />
            <button
              onClick={handleBack}
              className="mt-4 flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to games
            </button>
          </div>
        );
      }
    }
    
    // If we're in a break session that should show a game
    if (currentSession?.metadata?.showGame) {
      console.log('Current session with showGame:', currentSession.metadata);
      const gameType = currentSession.metadata.gameType;
      console.log('Game type from metadata:', gameType);
      
      if (gameType === 'snake') {
        return (
          <div className="w-full max-w-md p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <SnakeGame onGameOver={handleGameOver} />
            <button
              onClick={handleBack}
              className="mt-4 flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to games
            </button>
          </div>
        );
      }
      
      if (gameType === 'minesweeper') {
        return (
          <div className="w-full max-w-4xl p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <Minesweeper onGameOver={handleGameOver} />
            <button
              onClick={handleBack}
              className="mt-4 flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to games
            </button>
          </div>
        );
      }
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-200"
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-indigo-400 to-purple-400 dark:from-emerald-500 dark:via-indigo-500 dark:to-purple-500"></div>
        
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Take a Break
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Select a game to refresh your mind</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 -mt-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3">
              {games.map((game) => (
                <motion.button
                  key={game.id}
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleGameSelect(game.id as 'snake' | 'minesweeper' | 'tetris')}
                  className={`flex items-center p-4 rounded-xl transition-all hover:shadow-lg ${game.bg} ${game.hover} ${game.darkHover} border border-white/50 dark:border-gray-600/30 relative overflow-hidden group`}
                >
                  {/* Animated gradient border effect */}
                  <div className={`absolute inset-0.5 rounded-lg bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-70 transition-opacity -z-10 blur-md group-hover:blur-lg`}></div>
                  
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${game.color} ${game.iconColor} flex-shrink-0`}>
                    {React.cloneElement(game.icon, {
                      className: 'w-6 h-6'
                    })}
                  </div>
                  
                  <div className="ml-4 text-left">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">{game.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Classic {game.name.toLowerCase()} game</p>
                  </div>
                  
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <Sparkles className="w-5 h-5 text-amber-400 dark:text-amber-300" />
                  </div>
                </motion.button>
              ))}
            </div>
            
            <div className="pt-2">
              <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                Games help refresh your mind between study sessions
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm transition-colors duration-200"
          onClick={(e) => {
            // Close modal when clicking on the backdrop
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          {renderContent()}
        </div>
      )}
    </AnimatePresence>
  );
}
