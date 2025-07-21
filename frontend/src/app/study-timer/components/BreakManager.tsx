'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, BookOpen, Coffee, X, ArrowLeft } from 'lucide-react';
import { SnakeGame, Minesweeper, Tetris } from '@/components/games';
import { StudySession } from '../types';
import GameModal from './modals/GameModal';

interface BreakManagerProps {
  onStartBreak: (session: StudySession) => void;
  onClose: () => void;
  isBreakComplete: boolean;
  breakDuration: number;
  completedSession?: StudySession | null;
}

export default function BreakManager({
  onStartBreak,
  onClose,
  isBreakComplete,
  breakDuration,
  completedSession,
}: BreakManagerProps) {
  const [showBreakOptions, setShowBreakOptions] = useState(true);
  const [showGameModal, setShowGameModal] = useState(false);
  
  // Handle break completion state and visibility
  useEffect(() => {
    // If this is a break session and it's marked as complete, close the modal
    if (completedSession?.type === 'break' && isBreakComplete) {
      onClose();
      return;
    }
    
    // Only show break options if this is after a study session
    // and not after a break
    if (completedSession?.type === 'study') {
      setShowBreakOptions(true);
    }
  }, [completedSession, isBreakComplete, onClose]);
  
  // Don't render if this is a completed break session
  if (completedSession?.type === 'break' && completedSession.completed) {
    return null;
  }

  const handleBreakOptionSelect = (option: 'game' | 'free' | 'coffee') => {
    if (option === 'game') {
      setShowGameModal(true);
      return;
    }
    
    const breakSession: StudySession = {
      id: `break-${Date.now()}`,
      type: 'break',
      subject: option === 'coffee' ? 'Coffee Break' : 'Free Study',
      duration: breakDuration,
      break_duration: 0,
      isCurrent: true,
      completed: false,
      created_at: new Date(),
      startTime: new Date(),
      end_time: new Date(),
      notes: ''
    };
    onStartBreak(breakSession);
    onClose();
  };
  
  const handleGameSelect = (game: 'snake' | 'minesweeper' | 'tetris') => {
    // Close the game selection modal
    setShowGameModal(false);
    
    // Create a break session with the selected game
    const breakSession: StudySession = {
      id: `break-${Date.now()}`,
      type: 'break',
      subject: `Game: ${game.charAt(0).toUpperCase() + game.slice(1)}`,
      duration: breakDuration,
      break_duration: 0,
      isCurrent: true,
      completed: false,
      created_at: new Date(),
      startTime: new Date(),
      end_time: new Date(Date.now() + breakDuration * 60 * 1000),
      notes: `Playing ${game} during break`,
      metadata: { 
        gameType: game,
        showGame: true, // This will be used to show the game in the modal
        showGameSelection: false // This will be used to control game selection visibility
      }
    };
    
    onStartBreak(breakSession);
  };
  
  // Handle going back to game selection
  const handleBackToGames = () => {
    if (!completedSession) return;
    
    const updatedSession: StudySession = {
      ...completedSession,
      metadata: {
        ...completedSession.metadata,
        showGame: false,
        showGameSelection: true,
        gameType: undefined
      }
    };
    

    onStartBreak(updatedSession);
  };

  // Simple fallback component if no game is available
  function TestGame() {
    return (
      <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded-lg">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Game would render here</h2>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">

      {showBreakOptions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/15 dark:bg-black/30 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-4xl relative transition-colors duration-200"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">Break Time! 🎉</h2>
            <p className="text-xl text-center text-gray-600 dark:text-gray-300 mb-10">
              How would you like to spend your {breakDuration}-minute break?
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <BreakOption
                icon={<Gamepad2 className="w-8 h-8" />}
                title="Play a Game"
                description="Relax with a quick game"
                color="indigo"
                onClick={() => handleBreakOptionSelect('game')}
              />
              <BreakOption
                icon={<BookOpen className="w-8 h-8" />}
                title="Free Study"
                description="Study without a timer"
                color="blue"
                onClick={() => handleBreakOptionSelect('free')}
              />
              <BreakOption
                icon={<Coffee className="w-8 h-8" />}
                title="Take a Break"
                description="Relax and recharge"
                color="amber"
                onClick={() => handleBreakOptionSelect('coffee')}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
      
      <GameModal 
        isOpen={showGameModal} 
        onClose={() => {
          setShowGameModal(false);
        }}
        onSelectGame={handleGameSelect}
        currentSession={completedSession}
      />
      
      {/* Show the game in the main BreakManager modal if we have a game to show */}
      {completedSession?.metadata?.showGameSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Select a Game</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <GameModal 
              isOpen={true}
              onClose={onClose}
              onSelectGame={handleGameSelect}
              currentSession={completedSession}
            />
          </div>
        </div>
      )}
      {completedSession?.metadata?.showGame && !showGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60">
          <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {completedSession.subject}
              </h2>
              <button
                onClick={() => {
                  // Clear the game from the session metadata to go back to game selection
                  if (completedSession?.metadata?.showGame) {
                    const updatedSession = {
                      ...completedSession,
                      metadata: {
                        ...completedSession.metadata,
                        showGame: false,
                        gameType: undefined
                      }
                    };
                    // Update the current session to clear the game
                    if (onStartBreak) {
                      onStartBreak(updatedSession);
                    }
                  } else {
                    // If no game is active, close the modal
                    onClose();
                  }
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                title="Back to game selection"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="w-full">
              {(() => {
                switch(completedSession.metadata?.gameType) {
                  case 'snake':
                    return (
                      <div className="w-full max-w-md mx-auto">
                        <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm">
                          <p className="font-medium text-yellow-800 dark:text-yellow-200">Game Mode: Snake</p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300">Playing in break session</p>
                        </div>
                        <SnakeGame onGameOver={(score: number) => {
                        }} />
                      </div>
                    );
                  case 'minesweeper':
                    return (
                      <div className="w-full overflow-auto">
                        <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm">
                          <p className="font-medium text-yellow-800 dark:text-yellow-200">Game Mode: Minesweeper</p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300">Playing in break session</p>
                        </div>
                        <div className="w-full flex justify-center">
                          <Minesweeper onGameOver={(score: number) => {
                          }} />
                        </div>
                      </div>
                    );
                  case 'tetris':
                    return (
                      <div className="w-full overflow-auto">
                        <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm">
                          <p className="font-medium text-yellow-800 dark:text-yellow-200">Game Mode: Tetris</p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300">Playing in break session</p>
                        </div>
                        <div className="w-full flex justify-center">
                          <Tetris onGameEnd={(score: number) => {
                          }} />
                        </div>
                      </div>
                    );
                  default:
                    return (
                      <div className="w-full max-w-md mx-auto">
                        <TestGame />
                      </div>
                    );
                }
              })()}
              
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowGameModal(true)}
                  className="inline-flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back to Games
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface BreakOptionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'indigo' | 'blue' | 'amber';
  onClick: () => void;
}

type ColorType = 'indigo' | 'blue' | 'amber';

const colorMap: Record<ColorType, { bg: string; hoverBg: string; text: string }> = {
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    hoverBg: 'bg-indigo-100 dark:bg-indigo-900/50',
    text: 'text-indigo-700 dark:text-indigo-300',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    hoverBg: 'bg-blue-100 dark:bg-blue-900/50',
    text: 'text-blue-700 dark:text-blue-300',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    hoverBg: 'bg-amber-100 dark:bg-amber-900/50',
    text: 'text-amber-700 dark:text-amber-300',
  },
};

function BreakOption({ icon, title, description, color, onClick }: BreakOptionProps) {
  const colors = colorMap[color as ColorType];
  
  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-6 rounded-xl cursor-pointer transition-all duration-200 ${colors.bg} hover:${colors.hoverBg} dark:hover:bg-opacity-50`}
    >
      <div className={`p-3 rounded-full ${colors.bg} dark:bg-opacity-20 mb-4`}>
        {React.cloneElement(icon as React.ReactElement, {
          className: `${colors.text}`
        })}
      </div>
      <h3 className={`text-lg font-semibold ${colors.text} mb-1`}>
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-300 text-center">{description}</p>
    </div>
  );
}
