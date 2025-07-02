// frontend/src/app/study-timer/components/TimerDisplay.tsx
'use client';

import { motion, useAnimation } from 'framer-motion';
import { Play, Pause, RotateCw, Plus } from 'lucide-react';
import { StudySession } from '../types';
import { useEffect, useMemo, useCallback } from 'react';

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
    <div className="p-8">
      <div className="flex flex-col items-center justify-center py-4">
        <div className="relative w-72 h-72 md:w-80 md:h-80 mb-6">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle 
              cx="50" 
              cy="50" 
              r="48" 
              fill="none" 
              stroke="#f0f4ff" 
              strokeWidth="4"
            />
            <motion.circle 
              cx="50" 
              cy="50" 
              r="48" 
              fill="none" 
              stroke={currentSession?.type === 'break' ? '#10b981' : '#4f46e5'} 
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
              currentSession?.type === 'break' ? 'text-emerald-600' : 'text-indigo-700'
            }`}>
              {formatTime(timeRemaining)}
            </div>
            <div className={`mt-2 text-sm font-semibold ${
              currentSession?.type === 'break' ? 'text-emerald-500' : 'text-indigo-500'
            }`}>
              {currentSession?.type === 'break' ? 'Break Time' : 'Focus Time'}
            </div>
            {currentSession?.subject && (
              <div className="mt-2 text-sm text-gray-500 font-medium">
                {currentSession.subject}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-center space-x-6 mt-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onReset}
            className="p-2.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors duration-200"
            title="Reset Timer"
            disabled={!currentSession}
          >
            <RotateCw className={`w-5 h-5 ${!currentSession ? 'opacity-30' : ''}`} />
          </motion.button>
          
          {!isActive ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onStart}
              className="p-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-200"
              title="Start"
            >
              <Play className="w-7 h-7" fill="currentColor" />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onStartPause}
              className="p-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-200"
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
            className="p-2.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors duration-200"
            title="Timer Options"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}