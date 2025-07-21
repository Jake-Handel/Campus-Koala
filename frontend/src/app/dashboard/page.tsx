'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Task } from '@/types/Task';
import moment from 'moment';
import { 
  FiClipboard, 
  FiClock, 
  FiCalendar, 
  FiBookOpen, 
  FiPlus, 
  FiList, 
  FiAlertCircle, 
  FiCheckCircle 
} from 'react-icons/fi';

// Event interface - matches the one from calendar
interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  category?: string;
  color?: string;
  description?: string;
  allDay?: boolean;
}

export default function DashboardPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = theme === 'dark';
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [studyStats, setStudyStats] = useState({
    totalMinutes: 0,
    sessionsCount: 0,
    averageSession: 0,
    lastSession: null as string | null,
    lastSessionSubject: 'None',
    lastSessionTime: '',
    totalDuration: 0 // in seconds
  });
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchTasks();
    fetchEvents();
    fetchStudyStats();
    
    // Add custom CSS for border width
    const style = document.createElement('style');
    style.innerHTML = `
      .border-6 {
        border-width: 6px;
      }
    `;
    document.head.appendChild(style);
  }, [router]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(Array.isArray(data) ? data : []);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        const errorData = await response.json();
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudyStats = async () => {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`http://localhost:5000/api/study/sessions/stats?start_date=${today}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const stats = await response.json();
        
        
        // Get the most recent session for the last session date
        const sessionsResponse = await fetch('http://localhost:5000/api/study/sessions?limit=1', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json'
          }
        });
        
        let lastSession = null;
        let lastSessionSubject = 'None';
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json();

          if (sessionsData.sessions && sessionsData.sessions.length > 0) {
            const latestSession = sessionsData.sessions[0];
            lastSession = latestSession.end_time || latestSession.start_time || null;
            lastSessionSubject = latestSession.subject || 'Unnamed Session';
          }
        }
        
        // Convert seconds to minutes for display
        const totalMinutes = Math.round((stats.total_duration || 0) / 60);
        const breakMinutes = Math.round((stats.break_duration || 0) / 60);

        setStudyStats({
          totalMinutes: totalMinutes,
          totalDuration: stats.total_duration || 0,
          sessionsCount: stats.total_sessions || 0,
          averageSession: stats.total_sessions > 0 
            ? Math.round(totalMinutes / stats.total_sessions) 
            : 0,
          lastSession: lastSession ? new Date(lastSession).toLocaleDateString() : null,
          lastSessionSubject: lastSessionSubject,
          lastSessionTime: lastSession ? moment.utc(lastSession).local().fromNow() : 'No recent sessions'
        });
      }
    } catch (error) {
    }
  };

  const fetchEvents = async () => {
    try {

      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }
      

      let response;
      try {
        response = await fetch('http://localhost:5000/api/calendar/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'  // Include cookies in the request
        });
      } catch (fetchError) {
        return;
      }
      
      const contentType = response.headers.get('content-type');
      
      // Check if response is JSON
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        return;
      }

      if (response.ok) {
        const data = await response.json();

        
        if (!Array.isArray(data)) {
          return;
        }
        
        // Transform the events to match the Event interface
        const formattedEvents = data.map((event: any) => {
          try {
            const startDate = new Date(event.start);
            const endDate = new Date(event.end);
            
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
              return null;
            }
            
            
            return {
              ...event,
              start: startDate,
              end: endDate
            };
          } catch (error) {
            return null;
          }
        }).filter((event): event is Event => event !== null);
        
        const today = moment().startOf('day');
        const filteredEvents = formattedEvents.filter(event => 
          moment(event.start).isSameOrAfter(today)
        );
        
        setEvents(formattedEvents);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        const errorData = await response.json();
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
  
    fetchEvents();
  }, []); // Empty dependency array to run only on mount

  return (
    <div className="min-h-screen p-4 bg-transparent dark:bg-gray-900 transition-colors duration-200">
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Header */}
        <div className="flex justify-center">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            Dashboard
          </h1>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <button 
            onClick={() => router.push('/tasks')} 
            className="group relative overflow-hidden rounded-xl p-4 border-none shadow-md transition-all duration-300 text-white font-medium bg-gradient-to-r from-indigo-600 to-indigo-400 hover:from-indigo-700 hover:to-indigo-500 hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-102"
          >
            <div className="flex items-center">
              <div className="bg-white/20 rounded-lg p-2 mr-3">
                <FiClipboard className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-base font-bold">Create New Task</h4>
                <p className="text-xs text-white/80 mt-0.5">Add and manage your tasks</p>
              </div>
            </div>
            <div className="absolute -right-3 -bottom-3 w-10 h-10 rounded-full bg-white/10 group-hover:bg-white/20 transition-all duration-300"></div>
          </button>
          
          <button 
            onClick={() => router.push('/study-timer')} 
            className="group relative overflow-hidden rounded-xl p-4 border-none shadow-md transition-all duration-300 text-white font-medium bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-102"
          >
            <div className="flex items-center">
              <div className="bg-white/20 rounded-lg p-2 mr-3">
                <FiClock className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-base font-bold">FocusFlow</h4>
                <p className="text-xs text-white/80 mt-0.5">Focus with a timer</p>
              </div>
            </div>
            <div className="absolute -right-3 -bottom-3 w-10 h-10 rounded-full bg-white/10 group-hover:bg-white/20 transition-all duration-300"></div>
          </button>
          
          <button 
            onClick={() => router.push('/calendar')} 
            className="group relative overflow-hidden rounded-xl p-4 border-none shadow-md transition-all duration-300 text-white font-medium bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-102"
          >
            <div className="flex items-center">
              <div className="bg-white/20 rounded-lg p-2 mr-3">
                <FiCalendar className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-base font-bold">View Calendar</h4>
                <p className="text-xs text-white/80 mt-0.5">See your schedule</p>
              </div>
            </div>
            <div className="absolute -right-3 -bottom-3 w-10 h-10 rounded-full bg-white/10 group-hover:bg-white/20 transition-all duration-300"></div>
          </button>
        </div>


        {/* Task Stats and Recent Tasks */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Task Stats */}
          <div className="card p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative group bg-white dark:bg-gray-800/80 dark:border dark:border-gray-700/70">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true"></div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-500/5 dark:bg-indigo-400/10 rounded-full -ml-12 -mt-12 blur-2xl" aria-hidden="true" />
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-indigo-500/5 dark:bg-indigo-400/10 rounded-full -mr-5 -mb-5 blur-2xl" aria-hidden="true" />
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 dark:bg-indigo-400/20 rounded-full -mr-8 -mt-8 group-hover:bg-indigo-500/20 dark:group-hover:bg-indigo-400/30 transition-all duration-300"></div>
            <h3 className="text-xl font-bold mb-8 flex items-center text-indigo-700 dark:text-indigo-300">
              <FiCalendar className="w-6 h-6 mr-3" />
              Task Stats
            </h3>
            <div className="flex gap-8">
              {/* Left Side - Stats Boxes */}
              <div className="space-y-3 flex-1 w-1/2 relative">
                <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm p-4 rounded-lg border border-white/10 dark:border-gray-600/30 hover:border-white/20 dark:hover:border-gray-500/50 transition-all duration-300">
                  <div className="flex items-center justify-between gap-8">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-indigo-500/30' : 'bg-indigo-500/20'
                    }`}>
                      <FiList className={`w-5 h-5 ${isDark ? 'text-indigo-300' : 'text-indigo-500'}`} />
                    </div>
                      <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200 ml-3">Total Tasks</span>
                    </div>
                    <span className={`text-xl font-bold ${
                      isDark ? 'text-white' : 'text-indigo-900'
                    }`}>{tasks.length}</span>
                  </div>
                </div>

                <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm p-4 rounded-lg border border-white/10 dark:border-gray-600/30 hover:border-white/20 dark:hover:border-gray-500/50 transition-all duration-300">
                  <div className="flex items-center justify-between gap-8">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isDark ? 'bg-red-500/30' : 'bg-red-500/20'
                      }`}>
                        <FiAlertCircle className={`w-5 h-5 ${isDark ? 'text-red-300' : 'text-red-500'}`} />
                      </div>
                      <span className="text-sm font-medium text-red-800 dark:text-red-300 ml-3">High Priority</span>
                    </div>
                    <span className={`text-xl font-bold ${
                      isDark ? 'text-red-300' : 'text-red-900'
                    }`}>
                      {tasks.filter(t => t.priority === 3).length}
                    </span>
                  </div>
                </div>

                <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm p-4 rounded-lg border border-white/10 dark:border-gray-600/30 hover:border-white/20 dark:hover:border-gray-500/50 transition-all duration-300">
                  <div className="flex items-center justify-between gap-8">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isDark ? 'bg-emerald-500/30' : 'bg-emerald-500/20'
                      }`}>
                        <FiCheckCircle className={`w-5 h-5 ${isDark ? 'text-emerald-300' : 'text-emerald-500'}`} />
                      </div>
                      <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300 ml-3">Completed</span>
                    </div>
                    <span className={`text-xl font-bold ${
                      isDark ? 'text-emerald-300' : 'text-emerald-900'
                    }`}>
                      {tasks.filter(t => t.completed).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side - Completion Circle */}
              <div className="w-56 h-56 relative">
                <svg className="rotate-[135deg] w-full h-full" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  {/* Background Circle */}
                  <circle 
                    cx="24" cy="24" r="23.5" 
                    fill="none" 
                    className="stroke-current"
                    strokeWidth="1"
                    strokeDasharray="100 100"
                    strokeLinecap="round"
                    style={{
                      stroke: `hsl(${Math.round((tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0) / 100 * 150)}, 100%, 40%)`
                    }}
                  />

                  {/* Progress Circle */}
                  <circle 
                    cx="24" cy="24" r="23.5" 
                    fill="none" 
                    className="stroke-current"
                    strokeWidth="1.7"
                    strokeDasharray={`${(tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0)} 100`}
                    strokeLinecap="round"
                    style={{
                      stroke: `hsl(${Math.round((tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0) / 100 * 150)}, 100%, 30%)`
                    }}
                  />
                </svg>

                {/* Value Text */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10">
                  <span className="text-5xl font-bold" style={{
                    color: `hsl(${Math.round((tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0) / 100 * 150)}, 100%, 30%)`
                  }}>
                    {tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%
                  </span>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Completion Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="card p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative group bg-white dark:bg-gray-800/80 dark:border dark:border-gray-700/70">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true"></div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-500/5 dark:bg-emerald-400/10 rounded-full -ml-12 -mt-12 blur-2xl" aria-hidden="true" />
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-emerald-500/5 dark:bg-emerald-400/10 rounded-full -mr-5 -mb-5 blur-2xl" aria-hidden="true" />
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 dark:bg-emerald-400/20 rounded-full -mr-8 -mt-8 group-hover:bg-emerald-500/20 dark:group-hover:bg-emerald-400/30 transition-all duration-300"></div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-6 flex items-center text-emerald-700 dark:text-emerald-400">
                <FiClock className="w-6 h-6 mr-3" />
                Recent Tasks
                <span className="ml-auto text-xs font-normal bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full">
                  {tasks.length} total
                </span>
              </h3>
              
              <div className="space-y-3">
                {tasks.length > 0 ? (
                  tasks
                    .sort((a, b) => new Date(a.due_date || Date.now()).getTime() - new Date(b.due_date || Date.now()).getTime())
                    .slice(0, 3)
                    .map((task) => {
                      const priorityColors = {
                        high: 'bg-red-500 dark:bg-red-400',
                        medium: 'bg-yellow-500 dark:bg-yellow-400',
                        low: 'bg-indigo-400 dark:bg-indigo-300',
                        completed: 'bg-emerald-500 dark:bg-emerald-400'
                      };
                      
                      const priorityText = task.completed ? 'completed' : 
                                         task.priority === 3 ? 'high' : 
                                         task.priority === 2 ? 'medium' : 'low';
                      
                      return (
                        <div 
                          key={task.id} 
                          onClick={() => router.push(`/tasks`)}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600/90 border border-gray-100 dark:border-gray-600 hover:border-emerald-100 dark:hover:border-emerald-500/30 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer group"
                        >
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${priorityColors[priorityText]}`} />
                          <div className="flex-grow min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 group-hover:text-gray-900 dark:group-hover:text-white transition-colors truncate">
                              {task.title}
                            </p>
                            <div className="flex items-center mt-1 space-x-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                task.completed 
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' 
                                  : task.priority === 3 
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                    : task.priority === 2 
                                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                      : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                              }`}>
                                {task.completed ? 'Completed' : 
                                 `${task.priority === 1 ? 'Low' : task.priority === 2 ? 'Medium' : 'High'} Priority`}
                              </span>
                              {task.due_date && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {moment(task.due_date).fromNow()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-6">
                    <FiClipboard className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No tasks yet. Add one to get started!</p>
                  </div>
                )}
                
                <button 
                  onClick={() => router.push('/tasks')} 
                  className="w-full text-center text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 py-2 transition-colors rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 mt-2 flex items-center justify-center space-x-1 group"
                >
                  <span>View all tasks</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Events and Study Stats Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Upcoming Events */}
          <div className="card p-5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative group bg-white dark:bg-gray-800/80 dark:border dark:border-gray-700/70">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true"></div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/5 dark:bg-blue-400/10 rounded-full -ml-12 -mt-12 blur-2xl" aria-hidden="true" />
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-indigo-500/5 dark:bg-indigo-400/10 rounded-full -mr-5 -mb-5 blur-2xl" aria-hidden="true" />
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 dark:bg-blue-400/20 rounded-full -mr-8 -mt-8 group-hover:bg-blue-500/20 dark:group-hover:bg-blue-400/30 transition-all duration-300"></div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400 flex items-center">
                <FiCalendar className="w-5 h-5 mr-2" />
                Upcoming Events
              </h3>
              <button 
                onClick={() => router.push('/calendar')} 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center space-x-1 group"
              >
                <span className="group-hover:translate-x-0.5 transition-transform">View all events</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-3">
                  <div className="spinner"></div>
                  <p className="text-gray-500 dark:text-gray-400 mt-2 text-xs">Loading events...</p>
                </div>
              ) : events && events.filter(event => moment(event.start).isSameOrAfter(moment().startOf('day'))).length > 0 ? (
                [...events]
                  // Filter only upcoming events (today and future)
                  .filter(event => moment(event.start).isSameOrAfter(moment().startOf('day')))
                  // Sort by start date (closest first)
                  .sort((a, b) => a.start.getTime() - b.start.getTime())
                  .slice(0, 3) // Only show the 3 closest upcoming events
                  .map((event) => {
                    // Determine the category color
                    const categoryColors: { [key: string]: string } = {
                      'Study': 'rgba(63, 136, 197, 0.9)',
                      'Exam': 'rgba(255, 59, 48, 0.9)',
                      'Assignment': 'rgba(88, 86, 214, 0.9)',
                      'Meeting': 'rgba(52, 199, 89, 0.9)',
                      'Todo': 'rgba(175, 82, 222, 0.9)',
                      'Other': 'rgba(255, 149, 0, 0.9)'
                    };
                    
                    const eventColor = event.color || categoryColors[event.category || 'Other'] || categoryColors['Other'];
                    
                    return (
                      <div 
                        key={event.id} 
                        className="flex gap-3 p-2 rounded-lg bg-white/80 dark:bg-gray-800/90 hover:bg-opacity-100 dark:hover:bg-gray-700/90 shadow-sm hover:shadow transition-all duration-300 border border-gray-100 dark:border-gray-600/50 hover:border-opacity-70 transform hover:-translate-y-0.5 group backdrop-blur-sm"
                        style={{
                          borderLeft: `3px solid ${eventColor}`,
                          background: `linear-gradient(to right, ${eventColor}0A, ${eventColor}03)`,
                          borderColor: `${eventColor}30`,
                          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        {/* Date column */}
                        <div className="flex flex-col items-center min-w-[60px] text-center">
                          <div 
                            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl shadow-sm mb-1"
                            style={{
                              background: `linear-gradient(145deg, ${eventColor.replace('0.9', '1')}, ${eventColor.replace('0.9', '0.6')} 70%, ${eventColor.replace('0.9', '0.4')} 100%)`,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              transform: 'translateZ(0)'
                            }}
                          >
                            <span className="text-black dark:text-white font-bold text-lg leading-none">
                              {moment(event.start).format('D')}
                            </span>
                            <span className="text-black/90 dark:text-white/90 text-xs font-medium mt-0.5">
                              {moment(event.start).format('MMM').toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 tracking-wide">
                            {moment(event.start).format('ddd').toUpperCase()}
                          </span>
                      </div>
                      
                      {/* Event details */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span 
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: eventColor }}
                          />
                          <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-0.5 line-clamp-1 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                            {event.title}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">
                          {event.description || 'No description provided'}
                        </p>
                        <div className="flex items-center mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                          <FiClock className="w-3 h-3 mr-1 text-blue-500" />
                          <span>{moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}</span>
                        </div>
                      </div>
                    </div>
                  )}  
                  )
              ) : (
                <div className="flex flex-col items-center justify-center py-4">
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">No upcoming events</p>
                  <button 
                    onClick={() => router.push('/calendar?newEvent=true')} 
                    className="flex items-center justify-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors group"
                  >
                    <FiPlus className="w-3 h-3" />
                    <span>Add Event</span>
                  </button>
                    </div>
                  )}
                </div>
          </div>
          
          {/* Study Stats Widget */}
          <div className="lg:col-span-1">
          <div className="card p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative group bg-white dark:bg-gray-800/80 dark:border dark:border-gray-700/70 h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 dark:from-amber-500/10 dark:to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true"></div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/5 dark:bg-amber-400/10 rounded-full -ml-12 -mt-12 blur-2xl" aria-hidden="true" />
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-orange-500/5 dark:bg-orange-400/10 rounded-full -mr-5 -mb-5 blur-2xl" aria-hidden="true" />
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 dark:bg-amber-400/20 rounded-full -mr-8 -mt-8 group-hover:bg-amber-500/20 dark:group-hover:bg-amber-400/30 transition-all duration-300"></div>
            
            <div className="relative z-10 h-full flex flex-col">
              <h3 className="text-xl font-bold mb-6 flex items-center text-amber-700 dark:text-amber-400">
                <FiBookOpen className="w-6 h-6 mr-3" />
                Study Stats
                <button 
                  onClick={() => router.push('/study-timer')}
                  className="ml-auto text-xs font-normal bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/40 px-3 py-1.5 rounded-full transition-all duration-200 flex items-center"
                >
                  <FiPlus className="w-3.5 h-3.5 mr-1.5" />
                  New Session
                </button>
              </h3>
              
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-2xl">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {/* Total Study Time */}
                    <div className="p-3 sm:p-4 rounded-xl bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600/90 border border-gray-100 dark:border-gray-600 hover:border-amber-100 dark:hover:border-amber-500/30 transition-all duration-300 shadow-sm hover:shadow-md">
                      <div className="flex items-center">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mr-2 sm:mr-3">
                          <FiClock className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5 truncate">Total Time</p>
                          <p className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 truncate">
                            {studyStats.totalMinutes} <span className="text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400">min</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Sessions Count */}
                    <div className="p-3 sm:p-4 rounded-xl bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600/90 border border-gray-100 dark:border-gray-600 hover:border-amber-100 dark:hover:border-amber-500/30 transition-all duration-300 shadow-sm hover:shadow-md">
                      <div className="flex items-center">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mr-2 sm:mr-3">
                          <FiBookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5 truncate">Sessions</p>
                          <p className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
                            {studyStats.sessionsCount} <span className="text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400">total</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Average Session */}
                    <div className="p-3 sm:p-4 rounded-xl bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600/90 border border-gray-100 dark:border-gray-600 hover:border-amber-100 dark:hover:border-amber-500/30 transition-all duration-300 shadow-sm hover:shadow-md">
                      <div className="flex items-center">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mr-2 sm:mr-3">
                          <FiClock className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5 truncate">Avg. Session</p>
                          <p className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
                            {studyStats.averageSession} <span className="text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400">min</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Most Recent Session */}
                    <div className="p-3 sm:p-4 rounded-xl bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600/90 border border-gray-100 dark:border-gray-600 hover:border-amber-100 dark:hover:border-amber-500/30 transition-all duration-300 shadow-sm hover:shadow-md">
                      <div className="flex items-center">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mr-2 sm:mr-3">
                          <FiClock className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5 truncate">Last Session</p>
                          <p className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 truncate">
                            {studyStats.lastSessionSubject}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {studyStats.lastSessionTime || 'No recent sessions'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}