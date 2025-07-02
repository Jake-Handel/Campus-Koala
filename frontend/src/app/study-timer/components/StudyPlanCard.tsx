// frontend/src/app/study-timer/components/StudyPlanCard.tsx
'use client';

import { useState } from 'react';
import { Plus, CheckCircle, Clock as ClockIcon } from 'lucide-react';
import { DayPlanItem } from '../types';

interface StudyPlanCardProps {
  dayPlan: DayPlanItem[];
  currentSession: { id: string } | null;
  onAddSession: () => void;
  onStartSession: (session: DayPlanItem) => void;
}

export default function StudyPlanCard({
  dayPlan,
  currentSession,
  onAddSession,
  onStartSession,
}: StudyPlanCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Study Plan</h3>
        <button 
          onClick={onAddSession}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          title="Add new session"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      
      {dayPlan.length > 0 ? (
        <>
          <div className="relative flex flex-col items-center py-6">
            <div className="relative w-48 h-48 mb-4">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="6"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * (dayPlan.filter(s => s.completed).length / Math.max(1, dayPlan.length)))}
                  transform="rotate(-90 50 50)"
                  className="transition-all duration-700 ease-in-out"
                />
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">
                  {Math.round((dayPlan.filter(s => s.completed).length / Math.max(1, dayPlan.length)) * 100)}%
                </span>
                <span className="text-sm text-gray-500">
                  {dayPlan.filter(s => s.completed).length} of {dayPlan.length} sessions
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Today's Plan
            </h4>
            <div className="overflow-y-auto pr-2">
              <div className="space-y-2 max-h-[120px] overflow-y-auto">
                {dayPlan.map((session) => {
                  const isCurrent = session.id === currentSession?.id;
                  const isBreak = session.type === 'break';
                  const breakDuration = isBreak 
                    ? session.duration 
                    : Math.ceil(session.duration / 3);
                  
                  return (
                    <div 
                      key={session.id} 
                      className={`relative flex items-start p-3 rounded-lg transition-colors ${
                        session.completed 
                          ? 'bg-green-50' 
                          : isCurrent
                            ? 'bg-indigo-50'
                            : 'hover:bg-gray-50'
                      }`}
                      onClick={() => !session.completed && onStartSession(session)}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-r ${
                        session.completed 
                          ? 'bg-green-500' 
                          : isCurrent
                            ? 'bg-indigo-500' 
                            : 'bg-transparent'
                      }`} />
                      
                      <div className="flex-1 min-w-0 pl-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              session.completed 
                                ? 'text-green-800' 
                                : isCurrent 
                                  ? 'text-indigo-800' 
                                  : 'text-gray-800'
                            }`}>
                              {isBreak ? 'Break Time' : session.subject}
                            </p>
                            <div className="flex items-center mt-1">
                              <ClockIcon className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0" />
                              <span className="text-xs text-gray-500">
                                {isBreak ? breakDuration : session.duration} min
                                {isBreak && ' break'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {session.completed && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Done
                              </span>
                            )}
                            {isBreak && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                                +{breakDuration} min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-6 h-6 text-indigo-600" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No study sessions planned</h4>
          <p className="text-gray-500 mb-4">Add sessions to create your study plan</p>
          <button
            onClick={onAddSession}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            Start Planning
          </button>
        </div>
      )}
    </div>
  );
}