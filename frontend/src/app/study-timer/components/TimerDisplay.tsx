'use client';

import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Play, Pause, RotateCw, Plus, Gamepad } from 'lucide-react';
import { StudySession } from '../types';
import { useEffect, useMemo, useCallback, useState } from 'react';
import GameModal from './modals/GameModal';

interface TimerDisplayProps {
  currentSession: StudySession | null;
  timeRemaining: number;
  isActive: boolean;
  isPaused: boolean;
  onStartPause: () => void;
  onStart: () => void;
  onReset: () => void;
  onShowTimerOptions: () => void;
  formatTime: (seconds: number) => string;
}

export default function TimerDisplay({
  currentSession,
  timeRemaining,
  isActive,
  isPaused,
  onStartPause,
  onStart,
  onReset,
  onShowTimerOptions,
  formatTime,
}: TimerDisplayProps) {
  const controls = useAnimation();
  const circumference = 2 * Math.PI * 48;
  const [showGameModal, setShowGameModal] = useState(false);
  
  // Calculate progress based on time remaining
  const progress = useMemo(() => {
    if (!currentSession) return 0;
    const totalSeconds = (currentSession.duration || 1) * 60;
    return Math.max(0, Math.min(1, timeRemaining / totalSeconds));
  }, [timeRemaining, currentSession]);

  // Animate the progress smoothly
  useEffect(() => {
    const offset = circumference * (1 - progress);
    controls.start({
      strokeDashoffset: offset,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 100
      }
    });
  }, [progress, controls, circumference]);
  
  return (
    <div className="p-8 relative">
      {/* Game Indicator */}
      {currentSession?.type === 'break' && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          className="absolute top-4 left-4 cursor-pointer"
          onClick={() => setShowGameModal(true)}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-lg">
            <Gamepad className="w-5 h-5 text-white" />
          </div>
        </motion.div>
      )}

      <div className="flex flex-col items-center justify-center py-4">
        <div className="relative w-72 h-72 md:w-80 md:h-80 mb-6">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle 
              cx="50" 
              cy="50" 
              r="48" 
              fill="none" 
              className="stroke-gray-200 dark:stroke-gray-700"
              strokeWidth="4"
            />
            <motion.circle 
              cx="50" 
              cy="50" 
              r="48" 
              fill="none" 
              className={currentSession?.type === 'break' ? 'stroke-emerald-500' : 'stroke-indigo-600 dark:stroke-indigo-500'}
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ 
                strokeDashoffset: circumference,
                strokeDasharray: circumference 
              }}
              animate={controls}
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%',
                willChange: 'stroke-dashoffset',
              }}
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className={`text-5xl md:text-6xl font-mono font-bold ${
              currentSession?.type === 'break' 
                ? 'text-emerald-600 dark:text-emerald-500' 
                : 'text-indigo-700 dark:text-indigo-400'
            }`}>
              {formatTime(timeRemaining)}
            </div>
            <div className={`mt-2 text-sm font-semibold ${
              currentSession?.type === 'break' 
                ? 'text-emerald-500 dark:text-emerald-400' 
                : 'text-indigo-500 dark:text-indigo-400'
            }`}>
              {currentSession?.type === 'break' ? 'Break Time' : 'Focus Time'}
            </div>
            {currentSession?.subject && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                {currentSession.subject}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-center space-x-6 mt-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onReset}
            className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            title="Reset Timer"
            disabled={!currentSession}
          >
            <RotateCw className={`w-5 h-5 ${!currentSession ? 'opacity-30' : ''}`} />
          </motion.button>
          
          {!isActive ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onStart}
              className="p-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all duration-200 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30"
              title="Start"
            >
              <Play className="w-7 h-7" fill="currentColor" />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onStartPause}
              className="p-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all duration-200 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                <Play className="w-7 h-7" fill="currentColor" />
              ) : (
                <Pause className="w-7 h-7" fill="currentColor" />
              )}
            </motion.button>
          )}
          
          <button 
            onClick={onShowTimerOptions}
            className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            title="Timer Options"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {showGameModal && (
          <GameModal 
            isOpen={showGameModal}
            onClose={() => setShowGameModal(false)}
            onSelectGame={(game) => {
              // Update session metadata with selected game
              if (currentSession) {
                currentSession.metadata = {
                  ...currentSession.metadata,
                  gameType: game,
                  showGame: true
                };
              }
              setShowGameModal(true);
            }}
            currentSession={currentSession}
          />
        )}
      </AnimatePresence>
    </div>
  )
}