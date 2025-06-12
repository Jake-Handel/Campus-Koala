'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, BookOpen, Coffee, X } from 'lucide-react';
import { StudySession } from '../types';
import CelebrationModal from './modals/CelebrationModal';

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
    const breakSession: StudySession = {
      id: `break-${Date.now()}`,
      type: 'break',
      subject: option === 'game' ? 'Game Break' : option === 'coffee' ? 'Coffee Break' : 'Free Study',
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
