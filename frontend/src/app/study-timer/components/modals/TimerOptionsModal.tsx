// frontend/src/app/study-timer/components/modals/TimerOptionsModal.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Book, Clock as ClockIcon } from 'lucide-react';
import React, { useState } from 'react';

interface TimerOptionsModalProps {
  onClose: () => void;
  onStartFreeStudy: () => void;
  onStartPlannedSession: (session: { subject: string; duration: number }) => void;
  isOpen: boolean;
  isDark: boolean;
}

export default function TimerOptionsModal({
  onClose,
  onStartFreeStudy,
  onStartPlannedSession,
  isOpen,
  isDark
}: TimerOptionsModalProps) {
  const [sessionType, setSessionType] = useState<'free' | 'planned' | null>(null);
  const [sessionDetails, setSessionDetails] = useState({
    subject: '',
    duration: 25 // Default 25 minutes
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSessionDetails(prev => ({
      ...prev,
      [name]: name === 'duration' ? Math.max(1, Math.min(120, Number(value))) : value
    }));
  };

  const handleStartPlanned = () => {
    if (sessionType === 'planned' && sessionDetails.subject.trim() === '') {
      alert('Please enter a session name');
      return;
    }
    onStartPlannedSession(sessionDetails);
    onClose();
  };

  const handleStartFree = () => {
    onStartFreeStudy();
    onClose();
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl transition-colors duration-200"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Start New Session</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                aria-label="Close"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {sessionType === null ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Start New Session</h3>
                  <button
                    onClick={() => setSessionType('free')}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 border border-gray-100 dark:border-gray-600 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center">
                      <div className="p-2.5 bg-indigo-50 rounded-lg">
                        <Clock className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="ml-3 text-left">
                        <p className="font-medium text-gray-900 dark:text-white">Free Study</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Quick start without saving</p>
                      </div>
                    </div>
                    <Plus className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors" />
                  </button>
                  
                  <button
                    onClick={() => setSessionType('planned')}
                    className="w-full group flex items-center justify-between p-4 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 border border-gray-100 dark:border-gray-600 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center">
                      <div className="p-2.5 bg-indigo-50 rounded-lg">
                        <Book className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="ml-3 text-left">
                        <p className="font-medium text-gray-900 dark:text-white">Planned Session</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Customize name and duration</p>
                      </div>
                    </div>
                    <Plus className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors" />
                  </button>
                </div>
              ) : sessionType === 'planned' ? (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Session Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={sessionDetails.subject}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
                        placeholder="e.g., Math Homework"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration (minutes)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="duration"
                        name="duration"
                        min="1"
                        max="120"
                        value={sessionDetails.duration}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 appearance-none text-gray-900 dark:text-white"
                      />
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <ClockIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200">
                        Break: {Math.max(1, Math.floor(sessionDetails.duration / 3))} min
                      </span>
                    </p>
                  </div>
                  
                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={() => setSessionType(null)}
                      className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleStartPlanned}
                      className="flex-1 px-4 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:shadow-md"
                    >
                      Start Session
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-indigo-700 dark:text-indigo-300">
                          Free Study mode starts a timer without saving to your study plan.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setSessionType(null)}
                      className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleStartFree}
                      className="flex-1 px-4 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:shadow-md"
                    >
                      Start Free Study
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}