'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Plus, X, Clock, Coffee, CheckCircle, RotateCw, ChevronDown, ChevronUp, Gamepad2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { duration } from 'moment';

// Color constants
const COLORS = {
  primary: {
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
  },
  secondary: {
    500: '#ec4899',
    600: '#db2777',
  },
  success: {
    500: '#10b981',
  },
  warning: {
    500: '#f59e0b',
  },
  danger: {
    500: '#ef4444',
  },
  gray: {
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    700: '#374151',
    900: '#111827',
  },
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
    },
  },
};

interface StudySession {
  id: string;
  subject: string;
  duration: number;
  break_duration: number;
  type?: 'study' | 'break';
  isCurrent?: boolean;
  completed: boolean;
  completed_at?: Date;
  created_at: Date;
}



export default function StudyPlanner() {
  const [showTimerOptions, setShowTimerOptions] = useState(false);
  const [showDayPlanner, setShowDayPlanner] = useState(false);
  const [dayPlan, setDayPlan] = useState<Array<{
    id: string;
    subject: string;
    duration: number;
    break_duration: number;
    type: 'study' | 'break';
  }>>([]);
  
  const [newStudySession, setNewStudySession] = useState({
    subject: '',
    duration: 25,
  });

  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [showBreakOptions, setShowBreakOptions] = useState<boolean>(false);
  const [breakDuration, setBreakDuration] = useState<number>(5); // Default 5 minutes
  const [isPaused, setIsPaused] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  // Timer control functions
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const startCountdown = useCallback((duration: number) => {
    console.log('Starting countdown with duration:', duration);
    clearTimer();
    setTimeRemaining(duration);
    setIsActive(true);
    setIsPaused(false);
    console.log('Timer started. isActive:', true, 'isPaused:', false);

    const endTime = Date.now() + (duration * 1000);
    
    // Update the timer immediately
    const updateTimer = () => {
      const now = Date.now();
      const timeLeft = Math.max(0, Math.ceil((endTime - now) / 1000));
      
      setTimeRemaining(timeLeft);
      
      if (timeLeft <= 0) {
        console.log('Timer reached zero in updateTimer');
        clearInterval(timerRef.current);
        setIsActive(false);
        timerRef.current = undefined;
        return true;
      }
      return false;
    };
    
    // Initial update
    updateTimer();
    
    // Set up interval for subsequent updates
    timerRef.current = setInterval(updateTimer, 100);
    
    // Cleanup function for the interval
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
    };
  }, [clearTimer]);
  
  // Start a break session
  const startBreak = useCallback((duration: number) => {
    console.log('Starting break for', duration, 'minutes');
    setShowBreakOptions(false);
    
    // Create a new break session
    const breakSession: StudySession = {
      id: `break-${Date.now()}`,
      subject: 'Break Time',
      duration: duration, // Already in minutes
      break_duration: 0,
      type: 'break',
      isCurrent: true,
      completed: false,
      created_at: new Date()
    };
    
    setCurrentSession(breakSession);
    startCountdown(breakSession.duration * 60); // Convert to seconds
  }, [startCountdown]);

  const handleSessionComplete = useCallback(() => {
    console.log('handleSessionComplete called');
    setCurrentSession(prevSession => {
      if (!prevSession) {
        console.log('No previous session found');
        return null;
      }
      
      console.log('Session completed:', prevSession);
      
      // Update the session to completed
      const updatedSession = {
        ...prevSession,
        completed: true,
        completed_at: new Date(),
      };
      
      // Show break options if it was a study session
      if (prevSession.type === 'study') {
        console.log('Showing break options for study session');
        setShowBreakOptions(true);
      }
      
      return updatedSession;
    });
  }, []);

  const moveToNextSession = useCallback(() => {
    if (!currentSession) return;
    
    const currentIndex = dayPlan.findIndex(s => s.id === currentSession.id);
    if (currentIndex < dayPlan.length - 1) {
      const nextSession = dayPlan[currentIndex + 1];
      setCurrentSession({
        ...nextSession,
        isCurrent: true,
        completed: false,
        created_at: new Date()
      });
      startCountdown(nextSession.duration * 60);
    } else {
      setDayPlan([]);
      setCurrentSession(null);
      setIsPaused(false);
      setIsActive(false);
    }
  }, [currentSession, dayPlan, startCountdown]);
  
  useEffect(() => {
    if (timeRemaining <= 0 && isActive) {
      clearTimer();
      
      if (dayPlan.length > 0) {
        moveToNextSession();
      } else {
        setShowCelebration(true);
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b'],
        });
        
        const timer = setTimeout(() => {
          confetti.reset();
          setShowCelebration(false);
          handleSessionComplete();
        }, 5000);
        
        return () => {
          clearTimeout(timer);
          confetti.reset();
        };
      }
    }
  }, [timeRemaining, isActive, clearTimer, handleSessionComplete, dayPlan, moveToNextSession]);

  // Handle timer completion and celebration
  useEffect(() => {
    if (timeRemaining === 0 && isActive === false && currentSession) {
      console.log('Timer completed, showing celebration');
      
      // Show celebration immediately
      setShowCelebration(true);
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b'],
      });
      
      // After celebration, show break options if it's a study session
      const timer = setTimeout(() => {
        console.log('Celebration complete, showing break options');
        setShowCelebration(false);
        
        if (currentSession.type === 'study') {
          console.log('Showing break options');
          setShowBreakOptions(true);
        }
      }, 3000);
      
      return () => {
        clearTimeout(timer);
        confetti.reset();
      };
    }
  }, [timeRemaining, isActive, currentSession]);

  useEffect(() => {
    if (timeRemaining <= 0 && isActive) {
      clearTimer();
      handleSessionComplete();
    }
  }, [timeRemaining, isActive, clearTimer, handleSessionComplete]);

  const startTimer = useCallback(() => {
    if (!currentSession) return;
    const initialTime = currentSession.duration * 60;
    startCountdown(initialTime);
  }, [currentSession, startCountdown]);

  // Start a free study session
  const startFreeStudy = useCallback(() => {
    const newSession: StudySession = {
      id: Date.now().toString(),
      subject: 'Focus Session',
      duration: 25,
      break_duration: 5,
      type: 'study',
      isCurrent: true,
      completed: false,
      created_at: new Date()
    };
    
    setCurrentSession(newSession);
    setTimeRemaining(newSession.duration * 60);
    setIsActive(true);
    setShowTimerOptions(false);
  }, []);

  const pauseTimer = useCallback(() => {
    clearTimer();
    setIsPaused(true);
    setIsActive(false);
  }, [clearTimer]);

  const stopTimer = useCallback(() => {
    clearTimer();
    setIsPaused(false);
    setIsActive(false);
    setTimeRemaining(0);
    setCurrentSession(null);
  }, [clearTimer]);

  // Modal functions
  const handleCreateSession = useCallback(() => {
    setIsModalOpen(true);
    // Reset form with default values
    setNewStudySession({
      subject: '',
      duration: 25,
    });
  }, []);
  
  const startOrResumeTimer = useCallback((sessionToStart?: StudySession) => {
    console.log('startOrResumeTimer called with session:', sessionToStart);
    console.log('Current state:', { isPaused, currentSession, timeRemaining });
    
    // If a specific session is provided, set it as current
    if (sessionToStart) {
      console.log('Starting specific session:', sessionToStart.subject);
      const initialTime = sessionToStart.duration * 60;
      setCurrentSession(sessionToStart);
      setTimeRemaining(initialTime);
      setIsPaused(false);
      setIsActive(true);
      startCountdown(initialTime);
      return;
    }
    
    if (isPaused) {
      // If paused, resume with the current timeRemaining
      console.log('Resuming timer with remaining time:', timeRemaining);
      setIsPaused(false);
      setIsActive(true);
      startCountdown(timeRemaining);
    } else if (currentSession) {
      // If we have a current session (completed or not), start it from the beginning
      const initialTime = currentSession.duration * 60;
      console.log('Starting current session from beginning:', currentSession.subject);
      setTimeRemaining(initialTime);
      setIsPaused(false);
      setIsActive(true);
      startCountdown(initialTime);
    } else {
      // Otherwise, open the modal to create a new session
      console.log('No current session, opening create modal');
      handleCreateSession();
    }
  }, [currentSession, isPaused, startCountdown, handleCreateSession, timeRemaining]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setNewStudySession({
      subject: '',
      duration: 25,
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault(); // Prevent default form submission
      if (isSubmitting) return;
      
      setIsSubmitting(true);
      try {
        const breakDuration = Math.ceil(newStudySession.duration / 3);
        const sessionData = {
          subject: newStudySession.subject.trim(),
          duration: newStudySession.duration,
          break_duration: breakDuration,
        };

        const createdSession: StudySession = {
          id: crypto.randomUUID(),
          ...sessionData,
          completed: false,
          created_at: new Date(),
        };

        setCurrentSession(createdSession);
        handleCloseModal();
        
        // Start the countdown with the new session's duration
        startCountdown(createdSession.duration * 60);
      } catch (error) {
        console.error('Error creating session:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, newStudySession, handleCloseModal, startCountdown]
  );

  // Add a study session to the day plan
  const addToDayPlan = useCallback(() => {
    if (!newStudySession.subject.trim() || newStudySession.duration <= 0) return;
    
    const breakDuration = Math.ceil(newStudySession.duration / 3); // One-third of study time as break
    
    setDayPlan(prev => [
      ...prev,
      {
        id: `study-${Date.now()}`,
        subject: newStudySession.subject,
        duration: newStudySession.duration,
        break_duration: breakDuration,
        type: 'study' as const
      },
      {
        id: `break-${Date.now() + 1}`,
        subject: 'Break',
        duration: breakDuration,
        break_duration: 0,
        type: 'break' as const
      }
    ]);
    
    // Reset the form but keep the duration for convenience
    setNewStudySession(prev => ({
      subject: '',
      duration: prev.duration, // Keep the same duration for the next session
    }));
  }, [newStudySession]);
  
  // Remove a session from the day plan
  const removeFromDayPlan = useCallback((id: string) => {
    setDayPlan(prev => prev.filter(session => session.id !== id));
  }, []);
  
  // Start the planned day
  const startPlannedDay = useCallback(() => {
    if (dayPlan.length === 0) return;
    
    // Convert day plan to sessions (both study and break)
    const daySessions: StudySession[] = dayPlan.map(session => ({
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      subject: session.subject,
      duration: session.duration,
      break_duration: session.break_duration,
      type: session.type,
      completed: false,
      created_at: new Date(),
    }));
    
    if (daySessions.length > 0) {
      // Add to sessions and start the first one
      setCurrentSession({
        ...daySessions[0],
        isCurrent: true
      });
      startCountdown(daySessions[0].duration * 60);
      setShowDayPlanner(false);
    }
  }, [dayPlan, startCountdown]);
  
  // Start a day of studying
  const startDay = useCallback(() => {
    setShowTimerOptions(false);
    setShowDayPlanner(true);
  }, []);

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            FocusFlow
          </h1>
          <div className="pt-3 flex gap-4 justify-center">
            <motion.button
              onClick={startFreeStudy}
              whileHover={{ y: -2, backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-indigo-100/80 text-indigo-700 rounded-full font-medium transition-all duration-200 border-2 border-indigo-200/80 hover:border-indigo-300/90 flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              <Play className="w-5 h-5" />
              <span>Quick Start</span>
            </motion.button>
            <motion.button
              onClick={startDay}
              whileHover={{ y: -2, backgroundColor: 'rgba(79, 70, 229, 0.1)' }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-white/80 text-indigo-700 rounded-full font-medium transition-all duration-200 border-2 border-indigo-100 hover:border-indigo-200 flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              <Clock className="w-5 h-5" />
              <span>Plan Session</span>
            </motion.button>
          </div>
        </motion.div>
        
        {/* Timer Display */}
        <motion.div 
          className="bg-white rounded-2xl shadow-lg p-8 mb-8 relative overflow-hidden border border-gray-200"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
        >
          {/* Circular Progress Background */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="#f3f4f6" 
                strokeWidth="8"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={currentSession?.type === 'break' ? '#10b981' : '#4f46e5'}
                strokeWidth="8"
                strokeLinecap="round"
                initial={{ pathLength: 1 }}
                animate={{
                  pathLength: currentSession 
                    ? timeRemaining / (currentSession.duration * 60)
                    : 1
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="origin-center -rotate-90"
              />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="flex flex-col items-center justify-center py-12">
              {/* Phase Indicator */}
              <div className={`px-4 py-1.5 rounded-full text-sm font-medium mb-8 ${
                currentSession?.type === 'break' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
              }`}>
                {currentSession?.type === 'break' ? 'TAKE A BREAK' : currentSession ? 'FOCUS TIME' : 'READY TO FOCUS'}
              </div>
              
              {/* Timer Display */}
              <div className="flex items-center justify-center my-8">
                <div className="text-center">
                  <div className="flex items-center justify-center">
                    <div className="w-28 text-center">
                      <div className="text-xs font-medium text-gray-500 mb-1 tracking-wider uppercase">Minutes</div>
                      <div className="text-8xl font-bold font-sans text-gray-900 leading-none tracking-tight">
                        {currentSession ? Math.floor(timeRemaining / 60).toString().padStart(2, '0') : '00'}
                      </div>
                    </div>
                    <div className="text-7xl font-bold text-indigo-500 mx-6 leading-none mt-4">:</div>
                    <div className="w-28 text-center">
                      <div className="text-xs font-medium text-gray-500 mb-1 tracking-wider uppercase">Seconds</div>
                      <div className="text-8xl font-bold font-sans text-gray-900 leading-none tracking-tight">
                        {currentSession ? (timeRemaining % 60).toString().padStart(2, '0') : '00'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Current Subject */}
              <div className={`text-xl font-medium max-w-md truncate ${
                currentSession?.type === 'break' ? 'text-green-700' : 'text-indigo-700'
              } mb-8`}>
                {currentSession?.subject || 'No active session'}
              </div>
              
              {/* Controls */}
              <div className="flex flex-wrap justify-center gap-4 mt-6">
                {isActive ? (
                  <motion.button
                    key="pause"
                    whileHover={{ y: -2, backgroundColor: 'rgba(245, 158, 11, 0.15)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={pauseTimer}
                    className="px-6 py-3 bg-amber-100/70 text-amber-800 rounded-full font-medium transition-all duration-200 border-2 border-amber-200/80 hover:border-amber-300/90 flex items-center justify-center gap-2 backdrop-blur-sm"
                  >
                    <Pause className="w-5 h-5" />
                    <span>Pause</span>
                  </motion.button>
                ) : (
                  <motion.button
                    key="start"
                    whileHover={{ y: -2, backgroundColor: 'rgba(99, 102, 241, 0.15)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startOrResumeTimer()}
                    className="px-6 py-3 bg-indigo-100/80 text-indigo-700 rounded-full font-medium transition-all duration-200 border-2 border-indigo-200/80 hover:border-indigo-300/90 flex items-center justify-center gap-2 backdrop-blur-sm"
                  >
                    <Play className="w-5 h-5" />
                    <span>{currentSession ? 'Resume' : 'Start Focus'}</span>
                  </motion.button>
                )}
                
                <motion.button
                  whileHover={{ y: -2, backgroundColor: 'rgba(243, 244, 246, 0.8)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={stopTimer}
                  className="px-6 py-3 bg-white/80 text-gray-700 rounded-full font-medium transition-all duration-200 border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center gap-2 backdrop-blur-sm"
                >
                  <RotateCw className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Timer Options Modal */}
        <AnimatePresence>
          {showTimerOptions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowTimerOptions(false)}
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Start Timer</h3>
                  <button
                    onClick={() => setShowTimerOptions(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <button
                    onClick={startFreeStudy}
                    className="w-full p-4 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium">Free study</span>
                    <span className="text-sm text-indigo-500">Start now</span>
                  </button>
                  
                  <button
                    onClick={startDay}
                    className="w-full p-4 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium">Start Day</span>
                    <span className="text-sm text-green-500">Plan your day</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      
      {/* Day Planner Modal */}
      <AnimatePresence>
        {showDayPlanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDayPlanner(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Plan Your Study Day</h3>
                <button
                  onClick={() => setShowDayPlanner(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Add Session Form */}
                <div className="bg-white/50 backdrop-blur-sm p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Add Study Session</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={newStudySession.subject}
                      onChange={(e) => setNewStudySession(prev => ({...prev, subject: e.target.value}))}
                      placeholder="What are you studying?"
                      className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    />
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="number"
                          value={newStudySession.duration}
                          onChange={(e) => setNewStudySession(prev => ({...prev, duration: parseInt(e.target.value) || 25}))}
                          min="1" /* For testing */
                          max="120"
                          step="1"
                          className="w-24 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none transition-all duration-200"
                        />
                      </div>
                      <button
                        onClick={addToDayPlan}
                        disabled={!newStudySession.subject.trim()}
                        className="px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-md"
                      >
                        <Plus className="w-5 h-5" />
                        <span className="sr-only sm:not-sr-only">Add</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Sessions List */}
                {dayPlan.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-800">Your Study Plan</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                          {dayPlan.reduce((acc, curr) => acc + curr.duration, 0)} min total
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {dayPlan.map((session, index) => (
                        <motion.div 
                          key={session.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className={`group relative flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                            session.type === 'break' 
                              ? 'bg-blue-50 border-l-4 border-blue-400' 
                              : 'bg-white border-l-4 border-indigo-400 shadow-sm hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${
                              session.type === 'break' 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'bg-indigo-100 text-indigo-600'
                            }`}>
                              {session.type === 'break' ? (
                                <Coffee className="w-5 h-5" />
                              ) : (
                                <Clock className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <div className={`font-medium ${
                                session.type === 'break' ? 'text-blue-800' : 'text-gray-800'
                              }`}>
                                {session.type === 'break' ? 'Break' : session.subject}
                              </div>
                              <div className="text-sm text-gray-500">
                                {session.duration} minutes
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromDayPlan(session.id)}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Remove session"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="pt-2">
                      <button
                        onClick={startPlannedDay}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 font-medium flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg"
                      >
                        <Play className="w-5 h-5" />
                        Start Study Plan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-7 h-7 text-indigo-400" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-700 mb-1">No sessions planned yet</h4>
                    <p className="text-gray-500 max-w-xs mx-auto">Add your first study session to create your perfect study plan</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Celebration Effect */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-2xl text-center"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Great Job!</h3>
              <p className="text-gray-600">Session completed successfully!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Break Options Modal */}
      <AnimatePresence>
        {showBreakOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowBreakOptions(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white rounded-2xl p-8 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Coffee className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Break Time!</h3>
                <p className="text-gray-600 mb-6">How would you like to spend your break?</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentSession && (
                    <>
                      <motion.button
                        whileHover={{ y: -2, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => startBreak(Math.ceil(currentSession.duration / 3))}
                        className="p-6 bg-indigo-50 rounded-xl border-2 border-indigo-100 hover:border-indigo-200 transition-all duration-200 text-center w-full"
                      >
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Gamepad2 className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">Play Games</h4>
                        <p className="text-sm text-gray-500">{Math.ceil(currentSession.duration / 3)} minutes - Relax with some fun games</p>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ y: -2, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => startBreak(Math.ceil(currentSession.duration / 3))}
                        className="p-6 bg-amber-50 rounded-xl border-2 border-amber-100 hover:border-amber-200 transition-all duration-200 text-center w-full"
                      >
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Clock className="w-6 h-6 text-amber-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">Free Time</h4>
                        <p className="text-sm text-gray-500">{Math.ceil(currentSession.duration / 3)} minutes - Take a break your way</p>
                      </motion.button>
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => setShowBreakOptions(false)}
                  className="mt-6 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  Skip break
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}