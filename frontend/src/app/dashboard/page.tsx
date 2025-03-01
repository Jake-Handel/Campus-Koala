'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/types/Task';
import moment from 'moment';
import { FaMapMarkerAlt } from 'react-icons/fa';

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
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  console.log('Current tasks:', tasks);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchTasks();
    fetchEvents();
    
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
        console.log('Fetched tasks:', data);
        setTasks(Array.isArray(data) ? data : []);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        const errorData = await response.json();
        console.error('Error fetching tasks:', errorData.error);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/calendar/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('Failed to fetch events');
        return;
      }
      
      const data = await response.json();
      
      // Define event categories with colors
      const eventCategories = [
        { name: 'Study', color: 'rgba(63, 136, 197, 0.7)' },
        { name: 'Exam', color: 'rgba(255, 59, 48, 0.7)' },
        { name: 'Assignment', color: 'rgba(88, 86, 214, 0.7)' },
        { name: 'Meeting', color: 'rgba(52, 199, 89, 0.7)' },
        { name: 'Other', color: 'rgba(255, 149, 0, 0.7)' },
      ];
      
      const processedEvents = data.map((event: any) => ({
        ...event,
        id: event.id.toString(),
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        color: eventCategories.find(cat => cat.name === event.category)?.color,
      }));
      
      setEvents(processedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-indigo-600">Dashboard</h1>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-5 md:grid-cols-3">
          <div className="card p-4 bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-indigo-100 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full -mr-10 -mt-10 group-hover:bg-indigo-500/20 transition-all duration-300"></div>
            <h3 className="text-lg font-semibold mb-1 flex items-center text-indigo-700">
              <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zM6 12a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V12zm2.25 0a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zM6 15a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V15zm2.25 0a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zM6 18a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V18zm2.25 0a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75z" clipRule="evenodd" />
              </svg>
              Pending
            </h3>
            {isLoading ? (
              <div className="flex justify-center items-center h-16">
                <div className="spinner"></div>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="relative flex justify-center items-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-indigo-600">
                      {tasks.filter(t => !t.completed).length}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Tasks To Do</p>
                  <p className="text-xs text-indigo-500 font-medium mt-1">{Math.round((tasks.filter(t => !t.completed).length / (tasks.length || 1)) * 100)}% of total</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="card p-4 bg-gradient-to-br from-red-50 to-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-red-100 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -mr-10 -mt-10 group-hover:bg-red-500/20 transition-all duration-300"></div>
            <h3 className="text-lg font-semibold mb-1 flex items-center text-red-700">
              <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
              High Priority
            </h3>
            {isLoading ? (
              <div className="flex justify-center items-center h-16">
                <div className="spinner"></div>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="relative flex justify-center items-center">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-red-500">
                      {tasks.filter(t => t.priority === 3).length}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Tasks Need Attention</p>
                  <p className="text-xs text-red-500 font-medium mt-1">Due soon</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="card p-4 bg-gradient-to-br from-emerald-50 to-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-emerald-100 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-all duration-300"></div>
            <h3 className="text-lg font-semibold mb-1 flex items-center text-emerald-700">
              <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
              </svg>
              Completed
            </h3>
            {isLoading ? (
              <div className="flex justify-center items-center h-16">
                <div className="spinner"></div>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="relative flex justify-center items-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center relative">
                    <svg className="w-16 h-16 absolute top-0 left-0 transform -rotate-90">
                      <circle 
                        className="text-emerald-200" 
                        strokeWidth="4" 
                        stroke="currentColor" 
                        fill="transparent" 
                        r="24" 
                        cx="32" 
                        cy="32"
                      />
                      <circle 
                        className="text-emerald-500" 
                        strokeWidth="4" 
                        strokeDasharray={24 * 2 * Math.PI} 
                        strokeDashoffset={24 * 2 * Math.PI * (1 - (tasks.filter(t => t.completed).length / (tasks.length || 1)))} 
                        strokeLinecap="round" 
                        stroke="currentColor" 
                        fill="transparent" 
                        r="24" 
                        cx="32" 
                        cy="32"
                      />
                    </svg>
                    <span className="text-lg font-bold text-emerald-600 z-10">
                      {tasks.filter(t => t.completed).length}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Tasks Completed</p>
                  <p className="text-xs text-emerald-500 font-medium mt-1">{tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}% completion rate</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions and Recent Tasks */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-4 bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-indigo-100 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full -mr-10 -mt-10 group-hover:bg-indigo-500/20 transition-all duration-300"></div>
            <h3 className="text-lg font-semibold mb-3 flex items-center text-indigo-700">
              <svg className="w-5 h-5 mr-2 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
              </svg>
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => router.push('/tasks')} 
                className="group relative overflow-hidden rounded-lg p-3 border-none shadow-sm transition-all duration-300 text-white font-medium bg-gradient-to-r from-indigo-600 to-indigo-400 hover:from-indigo-700 hover:to-indigo-500 hover:shadow-md transform hover:-translate-y-1"
              >
                <div className="flex items-center">
                  <div className="bg-white/20 rounded-lg p-2 mr-3">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="text-base font-semibold">Create New Task</h4>
                    <p className="text-xs text-white/80">Add and manage your tasks</p>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-white/10 group-hover:bg-white/20 transition-all duration-300"></div>
              </button>
              
              <button 
                onClick={() => router.push('/study-timer')} 
                className="group relative overflow-hidden rounded-lg p-3 border-none shadow-sm transition-all duration-300 text-white font-medium bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 hover:shadow-md transform hover:-translate-y-1"
              >
                <div className="flex items-center">
                  <div className="bg-white/20 rounded-lg p-2 mr-3">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="text-base font-semibold">Start Study Session</h4>
                    <p className="text-xs text-white/80">Focus with a timer</p>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-white/10 group-hover:bg-white/20 transition-all duration-300"></div>
              </button>
              
              <button 
                onClick={() => router.push('/calendar')} 
                className="group relative overflow-hidden rounded-lg p-3 border-none shadow-sm transition-all duration-300 text-white font-medium bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 hover:shadow-md transform hover:-translate-y-1"
              >
                <div className="flex items-center">
                  <div className="bg-white/20 rounded-lg p-2 mr-3">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                      <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="text-base font-semibold">View Calendar</h4>
                    <p className="text-xs text-white/80">See your schedule</p>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-white/10 group-hover:bg-white/20 transition-all duration-300"></div>
              </button>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="card p-4 bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-purple-100 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-all duration-300"></div>
            <h3 className="text-lg font-semibold mb-3 flex items-center text-purple-700">
              <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zm9.375 12h-9.375a1.875 1.875 0 01-1.875-1.875v-11.25c0-1.036.84-1.875 1.875-1.875h9.375a1.875 1.875 0 011.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875z" clipRule="evenodd" />
              </svg>
              Recent Tasks
            </h3>
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-3">
                  <div className="spinner"></div>
                  <p className="text-gray-500 mt-2 text-sm">Loading tasks...</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-3">
                  <p className="text-gray-500 text-sm">No tasks found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks
                    .sort((a, b) => {
                      // Sort by priority (high to low) and then by completed status
                      if (a.priority !== b.priority) return b.priority - a.priority;
                      if (a.completed !== b.completed) return a.completed ? 1 : -1;
                      return 0;
                    })
                    .slice(0, 3) // Only show top 3 most important tasks
                    .map((task) => (
                      <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-white hover:bg-purple-50 border border-purple-100 hover:border-purple-200 transition-colors shadow-sm hover:shadow group">
                        <div className={`w-3 h-3 rounded-full ${task.completed ? 'bg-emerald-500' : task.priority === 3 ? 'bg-red-500' : task.priority === 2 ? 'bg-yellow-500' : 'bg-indigo-400'}`} />
                        <div className="flex-grow">
                          <p className="text-sm text-gray-800 font-medium group-hover:text-purple-800 transition-colors">
                            {task.title}
                          </p>
                          <p className={`text-xs ${task.completed 
                            ? 'text-emerald-500' 
                            : task.priority === 3 
                              ? 'text-red-500 font-medium' 
                              : task.priority === 2 
                                ? 'text-yellow-500 font-medium' 
                                : 'text-indigo-400'}`}
                          >
                            {task.completed 
                              ? 'Completed' 
                              : `${task.priority === 1 ? 'Low' : task.priority === 2 ? 'Medium' : 'High'} Priority`
                            }
                          </p>
                          {task.due_date && (
                            <span className="text-gray-400 text-xs block mt-0.5">
                              Due: {new Date(task.due_date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric'
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => router.push('/tasks')} 
                      className="w-full text-center text-xs font-medium text-purple-600 hover:text-purple-800 py-1 transition-colors"
                    >
                      View all tasks →
                    </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Upcoming Events Widget */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-blue-100 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-all duration-300"></div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-blue-700 flex items-center">
                <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                  <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
                </svg>
                Upcoming Events
              </h3>
              <button 
                onClick={() => router.push('/calendar')} 
                className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center"
              >
                View All
                <svg className="w-3 h-3 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-3">
                  <div className="spinner"></div>
                  <p className="text-gray-500 mt-2 text-sm">Loading events...</p>
                </div>
              ) : events && events.length > 0 ? (
                [...events]
                  // Filter only upcoming events (today and future)
                  .filter(event => moment(event.start).isSameOrAfter(moment().startOf('day')))
                  // Sort by start date (closest first)
                  .sort((a, b) => a.start.getTime() - b.start.getTime())
                  .slice(0, 3) // Only show the 3 closest upcoming events
                  .map((event) => (
                    <div key={event.id} className="flex gap-3 p-2 rounded-lg bg-white hover:bg-blue-50 shadow-sm hover:shadow transition-all duration-300 border border-blue-100 hover:border-blue-200 transform hover:-translate-y-0.5 border-l-3 border-l-blue-500 group">
                      {/* Date column */}
                      <div className="flex flex-col items-center justify-center min-w-[50px] text-center">
                        <div 
                          className="flex flex-col items-center justify-center w-10 h-10 rounded-lg shadow-sm bg-gradient-to-br from-blue-500 to-blue-600" 
                        >
                          <span className="text-white font-bold text-base">
                            {moment(event.start).format('D')}
                          </span>
                          <span className="text-white text-[10px] font-medium">
                            {moment(event.start).format('MMM')}
                          </span>
                        </div>
                        <span className="text-[10px] mt-0.5 text-gray-500 font-medium">
                          {moment(event.start).format('ddd')}
                        </span>
                      </div>
                      
                      {/* Event details */}
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-700 text-sm mb-0.5 line-clamp-1 group-hover:text-blue-800 transition-colors">
                          {event.title}
                        </h4>
                        <p className="text-xs text-gray-600 line-clamp-1">
                          {event.description || 'No description provided'}
                        </p>
                        <div className="flex items-center mt-1 text-[10px] text-gray-500">
                          <svg className="w-3 h-3 mr-1 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                          </svg>
                          <span>{moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}</span>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600 text-sm mb-2">No upcoming events</p>
                  <button 
                    onClick={() => router.push('/calendar')} 
                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    Add Event
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="card p-4 bg-gradient-to-br from-amber-50 to-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-amber-100 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10 group-hover:bg-amber-500/20 transition-all duration-300"></div>
            <h3 className="text-lg font-semibold mb-3 flex items-center text-amber-700">
              <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
              </svg>
              Study Stats
            </h3>
            <div className="flex flex-col items-center justify-center h-44 bg-gradient-to-br from-amber-50 to-white rounded-xl border border-dashed border-amber-200 relative overflow-hidden group">
              <div className="absolute inset-0 bg-grid-amber-500/[0.05] bg-[size:16px_16px]" aria-hidden="true"></div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-amber-500/10 rounded-full group-hover:bg-amber-500/20 transition-all duration-500"></div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-amber-500/10 rounded-full group-hover:bg-amber-500/20 transition-all duration-500"></div>
              
              <svg className="w-10 h-10 text-amber-400 mb-3 animate-pulse" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-amber-600 font-medium text-sm">Study statistics coming soon</p>
              <p className="text-xs text-gray-500 mt-1">Track your progress and study habits</p>
              
              <button className="mt-4 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-md transition-all duration-300 flex items-center">
                <svg className="w-3.5 h-3.5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Add Study Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}