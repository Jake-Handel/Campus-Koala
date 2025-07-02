'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, BookOpen, Coffee, X, ArrowLeft } from 'lucide-react';
import { SnakeGame, Minesweeper, Tetris } from '@/components/games';
import { StudySession } from '../types';
import CelebrationModal from './modals/CelebrationModal';
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
      console.log('Break completed, closing BreakManager');
      onClose();
      return;
    }
    
    // Only show break options if this is after a study session
    // and not after a break
    if (completedSession?.type === 'study') {
      console.log('Showing break options after study session');
      setShowBreakOptions(true);
    }
  }, [completedSession, isBreakComplete, onClose]);
  
  // Don't render if this is a completed break session
  if (completedSession?.type === 'break' && completedSession.completed) {
    console.log('Not rendering BreakManager for completed break session');
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
    console.log('Game selected:', game);
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
    
    console.log('Creating break session with game:', breakSession);
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
      <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
        <h2 className="text-xl font-bold">Game would render here</h2>
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
          className="fixed inset-0 bg-black/15 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-8 w-full max-w-4xl relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Break Time! 🎉</h2>
            <p className="text-xl text-center text-gray-600 mb-10">
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
          console.log('GameModal onClose called');
          setShowGameModal(false);
        }}
        onSelectGame={handleGameSelect}
        currentSession={completedSession}
      />
      
      {/* Show the game in the main BreakManager modal if we have a game to show */}
      {completedSession?.metadata?.showGameSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md bg-white rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Select a Game</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-4xl bg-white rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
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
                className="text-gray-400 hover:text-gray-600"
                title="Back to game selection"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="w-full">
              {(() => {
                console.log('Rendering game type:', completedSession.metadata?.gameType);
                console.log('Session metadata:', completedSession.metadata);
                
                switch(completedSession.metadata?.gameType) {
                  case 'snake':
                    return (
                      <div className="w-full max-w-md mx-auto">
                        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                          <p className="font-medium">Game Mode: Snake</p>
                          <p className="text-xs text-yellow-700">Playing in break session</p>
                        </div>
                        <SnakeGame onGameOver={(score: number) => {
                          console.log('Game over! Score:', score);
                        }} />
                      </div>
                    );
                  case 'minesweeper':
                    return (
                      <div className="w-full overflow-auto">
                        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                          <p className="font-medium">Game Mode: Minesweeper</p>
                          <p className="text-xs text-yellow-700">Playing in break session</p>
                        </div>
                        <div className="w-full flex justify-center">
                          <Minesweeper onGameOver={(score: number) => {
                            console.log('Minesweeper game over! Score:', score);
                          }} />
                        </div>
                      </div>
                    );
                  case 'tetris':
                    return (
                      <div className="w-full overflow-auto">
                        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                          <p className="font-medium">Game Mode: Tetris</p>
                          <p className="text-xs text-yellow-700">Playing in break session</p>
                        </div>
                        <div className="w-full flex justify-center">
                          <Tetris onGameEnd={(score: number) => {
                            console.log('Tetris game over! Score:', score);
                          }} />
                        </div>
                      </div>
                    );
                  default:
                    console.warn('Unknown game type:', completedSession.metadata?.gameType);
                    return (
                      <div className="w-full max-w-md mx-auto">
                        <TestGame />
                      </div>
                    );
                }
              })()}
              
              <div className="mt-4 text-center">
                <button
                  onClick={onClose}
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back to study
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

const colorMap = {
  indigo: {
    bg: 'bg-indigo-50',
    hoverBg: 'bg-indigo-100',
    iconBg: 'bg-indigo-100',
    hoverIconBg: 'bg-indigo-200',
    text: 'text-indigo-600',
  },
  blue: {
    bg: 'bg-blue-50',
    hoverBg: 'bg-blue-100',
    iconBg: 'bg-blue-100',
    hoverIconBg: 'bg-blue-200',
    text: 'text-blue-600',
  },
  amber: {
    bg: 'bg-amber-50',
    hoverBg: 'bg-amber-100',
    iconBg: 'bg-amber-100',
    hoverIconBg: 'bg-amber-200',
    text: 'text-amber-600',
  },
};

function BreakOption({ icon, title, description, color, onClick }: BreakOptionProps) {
  const colors = colorMap[color];
  
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center p-6 rounded-xl ${colors.bg} hover:${colors.hoverBg} transition-colors duration-200 h-full`}
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${colors.iconBg} group-hover:${colors.hoverIconBg} transition-colors`}>
        <span className={colors.text}>{icon}</span>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-600 text-sm text-center">{description}</p>
    </button>
  );
}
