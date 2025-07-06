'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { AnimatePresence } from 'framer-motion';
import { Play, Plus, X, Clock, Coffee, CheckCircle, RotateCw, ChevronDown, ChevronUp, Gamepad2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudySession, DayPlanItem } from './types';
import { 
  TimerDisplay, 
  StudyPlanCard, 
  TimerOptionsModal, 
  CelebrationModal,
  BreakManager,
  ContinueStudying
} from './components';

// Default study session duration in minutes
const DEFAULT_STUDY_DURATION = 25;
const DEFAULT_BREAK_DURATION = 5;

export default function StudyPlanner() {
  const { theme } = useTheme();
  // State for modals and UI
  const [showTimerOptions, setShowTimerOptions] = useState(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [showContinueStudying, setShowContinueStudying] = useState<boolean>(false);
  const [showBreakManager, setShowBreakManager] = useState<boolean>(false);
  const [isInBreakFlow, setIsInBreakFlow] = useState<boolean>(false);
  
  // Session and timer state
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [dayPlan, setDayPlan] = useState<DayPlanItem[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isActive, setIsActive] = useState(false);
  
  // Session configuration
  const [newStudySession, setNewStudySession] = useState({
    subject: 'Focus Session',
    duration: 25, // 25 minutes default
    break_duration: 5, // 5 minutes default break
  });
  
  // Initialize timer with default duration
  useEffect(() => {
    setTimeRemaining(newStudySession.duration * 60);
  }, [newStudySession.duration]);
  
  const timerRef = useRef<NodeJS.Timeout>();
  
  // Clear the timer interval
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  // Save session to backend
  const saveSessionToBackend = useCallback(async (session: StudySession) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const now = new Date();
      const sessionToSave = {
        subject: session.subject || 'Study Session',
        type: session.type || 'study',
        duration: session.duration || 0,
        break_duration: session.break_duration || 0,
        start_time: session.startTime || now,
        end_time: session.end_time || now,
        completed: true,
        notes: session.notes || '',
        created_at: session.created_at || now,
        updated_at: now
      };

      const response = await fetch('http://localhost:5000/api/study/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(sessionToSave, (key, value) => 
          value instanceof Date ? value.toISOString() : value
        )
      });

      const responseText = await response.text();
      if (!response.ok) {
        const errorMsg = `Failed to save session: ${response.status} ${response.statusText} - ${responseText}`;
        throw new Error(errorMsg);
      }

      const responseData = responseText ? JSON.parse(responseText) : {};
      
      return responseData;
    } catch (error) {
      throw error; // Re-throw to allow caller to handle the error
    }
  }, []);

  // Handle session completion
  const handleSessionComplete = useCallback(async () => {
    clearTimer();
    
    const prev = currentSession;
    if (!prev) return;
    
    // Determine if this is a break session
    const isBreak = prev.type === 'break';

    // Calculate end time based on start time and duration
    const startTime = prev.startTime ? new Date(prev.startTime) : new Date();
    const durationInMs = (prev.duration || 0) * 60 * 1000; // Convert minutes to ms
    const endTime = new Date(startTime.getTime() + durationInMs);

    // Update session state
    const completedSession = { 
      ...prev, 
      completed: true, 
      completed_at: new Date(),
      startTime: startTime,
      end_time: endTime,
      duration: prev.duration || 0,
      break_duration: prev.break_duration || 0,
      subject: prev.subject || (isBreak ? 'Break' : 'Study Session'),
      type: prev.type // Preserve the session type
    };

    // Update local state
    setCurrentSession(completedSession);
    
    // Close all modals
    setShowBreakManager(false);
    setShowCelebration(false);
    setShowContinueStudying(false);

    // Handle break session completion
    if (isBreak) {
      setShowContinueStudying(true);
    } 
    // Handle study session completion
    else {
      setShowCelebration(true);
    }
    
    // Update day plan to mark session as completed
    setDayPlan(currentPlan => 
      currentPlan
        .filter(session => session.id !== prev.id)
        .map(item => 
          item.id === prev.id ? { ...item, completed: true } : item
        )
    );
    
    try {
      await saveSessionToBackend(completedSession);
    } catch (error) {
    }
    
    setIsActive(false);
    setIsPaused(false);
  }, [clearTimer, currentSession]);
  
  // Pause the timer
  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
      setIsPaused(true);
    }
  }, []);

  // Start or resume the timer
  const startOrResumeTimer = useCallback(() => {
    // Ensure we have the latest state values
    const currentSessionValue = currentSession;
    const timeRemainingValue = timeRemaining;
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    
    // Get the session type with fallback
    const sessionType = currentSessionValue?.type || 'study';
    
    // For break sessions, always use the session's duration
    // For study sessions, use the remaining time or the session's duration
    let effectiveDuration;
    let remainingTime = timeRemainingValue;
    
    if (sessionType === 'break') {
      // For breaks, always use the break duration
      effectiveDuration = currentSessionValue?.duration || 1; // Default to 1 minute if not set
      remainingTime = effectiveDuration * 60; // Always reset to full break duration
    } else {
      // For study sessions, use remaining time or session duration
      effectiveDuration = currentSessionValue?.duration || newStudySession.duration;
      remainingTime = timeRemainingValue > 0 ? timeRemainingValue : effectiveDuration * 60;
    }
    
    // Update the time remaining if needed
    if (timeRemainingValue <= 0 || sessionType === 'break') {
      const newTimeRemaining = sessionType === 'break' ? effectiveDuration * 60 : remainingTime;
      setTimeRemaining(newTimeRemaining);
      
      // If we had to set the time remaining, we need to wait for the state update
      setTimeout(() => {
        startTimerWithDuration(effectiveDuration, sessionType);
      }, 0);
      return;
    }
    
    // Otherwise start the timer with the current remaining time
    startTimerWithDuration(effectiveDuration, sessionType);
  }, [isActive, isPaused, timeRemaining, currentSession, newStudySession.duration]);
  
  // Helper function to start the timer with a specific duration
  const startTimerWithDuration = useCallback((duration: number, sessionType: string) => {
    // Update timer state
    setIsActive(true);
    setIsPaused(false);
    
    // Store the start time for accurate elapsed time calculation
    const startTime = Date.now();
    const initialRemaining = timeRemaining > 0 ? timeRemaining : duration * 60;
    
    // Clear any existing timer (just to be safe)
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Start the timer
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, initialRemaining - elapsed);
      
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        clearTimer();
        handleSessionComplete();
      }
    }, 1000);
  }, [timeRemaining, clearTimer, handleSessionComplete]);

  // Toggle between play/pause
  const togglePlayPause = useCallback(() => {
    if (!isActive) {
      // If timer is not active, start it
      startOrResumeTimer();
    } else if (isPaused) {
      // If paused, resume
      startOrResumeTimer();
    } else {
      // If running, pause
      pauseTimer();
    }
  }, [isActive, isPaused, pauseTimer, startOrResumeTimer]);

  // Start a free study session
  const startFreeStudy = useCallback(() => {
    const duration = newStudySession.duration || 25; // Default to 25 minutes if not set
    const breakDuration = Math.max(1, Math.floor(duration / 3)); // 1/3 of study time for break
    
    if (duration <= 0) {
      return;
    }
    
    const newSession: StudySession = {
      id: `session-${Date.now()}`,
      subject: newStudySession.subject || 'Free Study',
      duration: duration,
      break_duration: breakDuration,
      type: 'study',
      created_at: new Date(),
      isCurrent: true,
      completed: false
    };
    
    setCurrentSession(newSession);
    setTimeRemaining(duration * 60);
    setShowTimerOptions(false);
    startOrResumeTimer();
  }, [newStudySession.duration, newStudySession.subject, startOrResumeTimer, setCurrentSession, setTimeRemaining, setShowTimerOptions]);
  

  // Start a planned study session with custom details
  const startPlannedSession = useCallback(({ subject, duration }: { subject: string; duration: number }) => {
    const breakDuration = Math.max(1, Math.floor(duration / 3));
    const sessionId = `session-${Date.now()}`;
    
    const newSession: StudySession = {
      id: sessionId,
      subject: subject || 'Planned Session',
      duration: duration,
      break_duration: breakDuration,
      type: 'study',
      created_at: new Date(),
      isCurrent: true,
      completed: false
    };
    
    // Create a day plan item that matches DayPlanItem type
    const newPlanItem: DayPlanItem = {
      id: sessionId,
      subject: subject || 'Planned Session',
      duration: duration,
      break_duration: breakDuration,
      type: 'study',
      completed: false
    };
    
    // Update newStudySession state with the latest values
    setNewStudySession(prev => ({
      ...prev,
      subject,
      duration
    }));
    
    // Reset timer state before starting new session
    clearTimer();
    setIsActive(false);
    setIsPaused(false);
    
    setCurrentSession(newSession);
    setDayPlan(prev => [...prev, newPlanItem]);
    setTimeRemaining(duration * 60);
    setShowTimerOptions(false);
  }, [clearTimer]);
  
  // Reset the timer
  const resetTimer = useCallback(() => {
    clearTimer();
    setIsActive(false);
    setIsPaused(false);
    if (currentSession) {
      setTimeRemaining(currentSession.duration * 60);
    } else {
      setTimeRemaining(0);
    }
  }, [clearTimer, currentSession]);
  
  // Start a specific session
  const startSession = useCallback((session: StudySession) => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }

    const isBreak = session.type === 'break';
    const duration = isBreak 
      ? Math.max(1, session.duration || 1)  // Ensure at least 1 minute for breaks
      : (session.duration > 0 ? session.duration : newStudySession.duration);

    // Ensure we have a clean start time
    const startTime = new Date();
    
    // Create a new session object ensuring type is preserved
    const updatedSession: StudySession = {
      ...session,
      type: isBreak ? 'break' as const : 'study' as const, // Ensure type is explicitly set and typed
      duration,
      isCurrent: true,
      completed: false,
      startTime: startTime, // Set the start time to now
      end_time: new Date(startTime.getTime() + duration * 60 * 1000), // Calculate end time based on start time
      created_at: session.created_at || startTime,
      subject: session.subject || (isBreak ? 'Break' : 'Study Session'),
      id: session.id || `session-${Date.now()}`,
      break_duration: session.break_duration || 0
    };
    


    // Reset timer state
    setIsActive(true);
    setIsPaused(false);
    
    // Update the current session state
    setCurrentSession(updatedSession);
    setTimeRemaining(duration * 60);

    // Start the timer with the correct session type
    startTimerWithDuration(duration, isBreak ? 'break' : 'study');
  }, [newStudySession.duration, startTimerWithDuration]);
  
  // Cache for in-flight requests to prevent duplicates
  const activeRequests = useRef<Record<string, Promise<StudySession[]>>>({});
  // Cache for session data with a timestamp
  const sessionCache = useRef<{
    data: StudySession[];
    timestamp: number;
  } | null>(null);
  
  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);
  
  // Start timer function for the play button
  const handleStartTimer = () => {
    if (!currentSession) {
      if (dayPlan.length > 0) {
        const sessionToStart = {
          ...dayPlan[0],
          id: `session-${Date.now()}`,
          created_at: new Date(),
          isCurrent: true,
          completed: false,
          type: dayPlan[0].type as 'study' | 'break',
          subject: dayPlan[0].subject || 'Study Session',
          break_duration: dayPlan[0].break_duration || DEFAULT_BREAK_DURATION
        };
        startSession(sessionToStart);
      } else {
        startFreeStudy();
      }
    } else {
      startOrResumeTimer();
    }
  };

  // Handle start session from day plan
  const handleStartSession = (session: DayPlanItem) => {
    const newSession: StudySession = {
      ...session,
      id: `session-${Date.now()}`,
      created_at: new Date(),
      isCurrent: true,
      completed: false,
      type: session.type as 'study' | 'break',
      subject: session.subject || 'Study Session',
      break_duration: session.break_duration || DEFAULT_BREAK_DURATION
    };
    startSession(newSession);
  };

  // Format time in MM:SS format
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };



  // Handle break start
  const handleStartBreak = (breakSession: StudySession) => {
    // Close any open modals
    setShowCelebration(false);
    setShowContinueStudying(false);
    setShowBreakManager(false);
    
    // Calculate break duration as 1/3 of the study session duration
    const studyDuration = currentSession?.duration || newStudySession.duration;
    const breakDuration = breakSession.duration || Math.max(1, Math.floor(studyDuration / 3)); // Use provided duration or calculate
    
    // Create a proper break session, preserving any metadata from the break session
    const breakSessionToStart: StudySession = {
      ...breakSession, // This includes any game metadata
      id: breakSession.id || `break-${Date.now()}`,
      type: 'break',
      subject: breakSession.subject || 'Break',
      duration: breakDuration,
      break_duration: 0,
      isCurrent: true,
      completed: false,
      created_at: breakSession.created_at || new Date(),
      startTime: new Date(),
      end_time: new Date(Date.now() + breakDuration * 60 * 1000), // Set proper end time
      notes: breakSession.notes || ''
    };
    
    // Update the current session with the new break session
    setCurrentSession(breakSessionToStart);
    
    // Start the break session
    startSession(breakSessionToStart);
    setIsInBreakFlow(true);
    
    // If this is a game break, ensure the BreakManager stays open
    if (breakSession.metadata?.showGame) {
      setShowBreakManager(true);
    }
    
  };

  return (
    <div className="min-h-screen bg-transparent dark:bg-gray-900 p-4 md:p-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">FocusFlow</h1>
          <p className="text-gray-600 dark:text-gray-300">Stay focused and track your study sessions</p>
        </header>
        
        {/* Main Content */}
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - Timer (70% width) */}
            <div className="w-full lg:w-8/12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-colors duration-200">
              <TimerDisplay
                currentSession={currentSession}
                timeRemaining={timeRemaining}
                isActive={isActive}
                isPaused={isPaused}
                onStartPause={togglePlayPause}
                onReset={resetTimer}
                onShowTimerOptions={() => setShowTimerOptions(true)}
                formatTime={formatTime}
                onStart={handleStartTimer}
              />
            </div>
            
            {/* Right Column - Study Plan */}
            <div className="w-full lg:w-4/12">
              <StudyPlanCard
                dayPlan={dayPlan}
                currentSession={currentSession}
                onAddSession={() => setShowTimerOptions(true)}
                onStartSession={handleStartSession}
              />
            </div>
          </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {showTimerOptions && (
            <TimerOptionsModal
              key="timer-options"
              isOpen={showTimerOptions}
              isDark={theme === 'dark'}
              onClose={() => setShowTimerOptions(false)}
              onStartFreeStudy={startFreeStudy}
              onStartPlannedSession={startPlannedSession}
            />
          )}

          {/* Show Celebration after study session */}
          {showCelebration && currentSession?.type === 'study' && (
            <CelebrationModal
              key="celebration-modal"
              isOpen={showCelebration}
              onClose={() => {
                setShowCelebration(false);
                setTimeout(() => setShowBreakManager(true), 100);
                
                const breakSession: StudySession = {
                  id: `break-${Date.now()}`,
                  type: 'break',
                  subject: 'Break',
                  duration: Math.max(1, Math.floor((currentSession?.duration || newStudySession.duration) / 3)),
                  break_duration: 0,
                  isCurrent: true,
                  completed: false,
                  created_at: new Date(),
                  startTime: new Date(),
                  end_time: new Date(),
                  notes: ''
                };
                setCurrentSession(breakSession);
              }}
              message="Great job! Time for a break?"
            />
          )}

          {/* Single source of truth for BreakManager */}
          {showBreakManager && currentSession?.type === 'break' && !currentSession.completed && (
            <BreakManager
              key={`break-manager-${currentSession.id}`}
              isBreakComplete={false}
              onStartBreak={(breakSession) => {
                const updatedSession = {
                  ...currentSession,
                  ...breakSession,
                  isCurrent: true,
                  metadata: {
                    ...currentSession.metadata,
                    ...breakSession.metadata
                  }
                };
                setCurrentSession(updatedSession);
                handleStartBreak(updatedSession);
              }}
              onClose={() => {
                // Only close the BreakManager if we're not in a game break
                if (!currentSession?.metadata?.showGame) {
                  setShowBreakManager(false);
                  setCurrentSession(currentSession);
                  setTimeRemaining(currentSession.duration * 60);
                }
              }}
              breakDuration={currentSession.duration || Math.max(1, Math.floor((currentSession?.duration || newStudySession.duration) / 3))}
              completedSession={currentSession}
            />
          )}

        </AnimatePresence>

        <AnimatePresence>
          {showContinueStudying && (
            <ContinueStudying
              key="continue-studying"
              isOpen={showContinueStudying}
              onStartStudy={() => {
                setShowContinueStudying(false);
                setTimeRemaining(newStudySession.duration * 60);
                startPlannedSession({
                  subject: 'Study Session',
                  duration: newStudySession.duration
                });
                setTimeRemaining(newStudySession.duration * 60);
              }}
              onTakeBreak={() => {
                setShowContinueStudying(false);
                handleStartBreak({
                  id: `break-${Date.now()}`,
                  type: 'break',
                  subject: 'Break',
                  duration: newStudySession.break_duration || DEFAULT_BREAK_DURATION,
                  break_duration: 0,
                  isCurrent: true,
                  completed: false,
                  created_at: new Date(),
                  startTime: new Date(),
                  end_time: new Date(),
                  notes: ''
                });
                handleStartBreak({  
                  id: `break-${Date.now()}`,
                  type: 'break',
                  subject: 'Break',
                  duration: newStudySession.break_duration || DEFAULT_BREAK_DURATION,
                  break_duration: 0, 
                  isCurrent: true,
                  completed: false,
                  created_at: new Date(),
                  startTime: new Date(),
                  end_time: new Date(),
                  notes: ''
                });
              }}
              onClose={() => {
                setShowContinueStudying(false);
                setTimeRemaining(newStudySession.duration * 60);
              }}
            />
          )}
        </AnimatePresence>
    </div>
  );
}