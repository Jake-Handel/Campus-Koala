'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/types/Task';
import moment from 'moment';
import { FiClipboard } from 'react-icons/fi';
import { FiClock } from 'react-icons/fi';
import { FiCalendar } from 'react-icons/fi';
import { FiBookOpen } from 'react-icons/fi';
import { FiPlus } from 'react-icons/fi';
import { FiList } from 'react-icons/fi';
import { FiAlertCircle } from 'react-icons/fi';
import { FiCheckCircle } from 'react-icons/fi';

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
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      console.log('Making GET request to fetch events');
      
      const response = await fetch('http://localhost:5000/api/calendar/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching events:', errorData.error || 'Failed to fetch events');
        throw new Error(errorData.error || 'Failed to fetch events');
      }

      const data = await response.json();
      console.log('Raw events data:', data); // Log the raw data to debug

      // Define event categories with colors
      const eventCategories = [
        { name: 'Study', color: 'rgba(63, 136, 197, 0.7)' },
        { name: 'Exam', color: 'rgba(255, 59, 48, 0.7)' },
        { name: 'Assignment', color: 'rgba(88, 86, 214, 0.7)' },
        { name: 'Meeting', color: 'rgba(52, 199, 89, 0.7)' },
        { name: 'Other', color: 'rgba(255, 149, 0, 0.7)' },
      ];

      // Add validation for the event data
      const processedEvents = (data || []).map((event: any) => {
        // Log the event data to debug
        console.log('Processing event:', event);
        
        const processedEvent = {
          id: event.id?.toString() || Date.now().toString(),
          title: event.title || 'Untitled Event',
          start: event.start ? new Date(event.start) : new Date(),
          end: event.end ? new Date(event.end) : new Date(),
          category: event.category || 'Other',
          color: eventCategories.find(cat => cat.name === event.category)?.color,
          allDay: event.allDay || false,
          location: event.location,
          description: event.description
        };

        // Validate dates
        if (isNaN(processedEvent.start.getTime()) || isNaN(processedEvent.end.getTime())) {
          console.warn('Invalid date for event:', event);
          return null;
        }

        return processedEvent;
      }).filter((event: any) => event !== null);

      console.log('Processed events:', processedEvents); // Log processed events
      setEvents(processedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      // Set an empty array if there's an error
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('Component mounted, fetching events');
    fetchEvents();
  }, []); // Empty dependency array to run only on mount

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-center items-center">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-indigo-500">Dashboard</h1>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-3 md:grid-cols-3">
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
            onClick={() => router.push('/planner')} 
            className="group relative overflow-hidden rounded-xl p-4 border-none shadow-md transition-all duration-300 text-white font-medium bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-102"
          >
            <div className="flex items-center">
              <div className="bg-white/20 rounded-lg p-2 mr-3">
                <FiClock className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-base font-bold">Start Study Session</h4>
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
          <div className="card p-6 bg-gradient-to-br from-indigo-50 to-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-indigo-100 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full -ml-12 -mt-12 blur-2xl" aria-hidden="true" />
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full -mr-5 -mb-5 blur-2xl" aria-hidden="true" />
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full -mr-8 -mt-8 group-hover:bg-indigo-500/20 transition-all duration-300"></div>
            <h3 className="text-xl font-bold mb-8 flex items-center text-indigo-700">
              <FiCalendar className="w-6 h-6 mr-3" />
              Task Stats
            </h3>
            <div className="flex gap-8">
              {/* Left Side - Stats Boxes */}
              <div className="space-y-3 flex-1 w-1/2 relative">
                <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex items-center justify-between gap-8">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <FiList className="w-5 h-5 text-indigo-500" />
                      </div>
                      <span className="text-sm font-medium text-indigo-800 ml-3">Total Tasks</span>
                    </div>
                    <span className="text-xl font-bold text-indigo-900">{tasks.length}</span>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex items-center justify-between gap-8">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                        <FiAlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                      <span className="text-sm font-medium text-red-800 ml-3">High Priority</span>
                    </div>
                    <span className="text-xl font-bold text-red-900">
                      {tasks.filter(t => t.priority === 3).length}
                    </span>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex items-center justify-between gap-8">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <FiCheckCircle className="w-5 h-5 text-emerald-500" />
                      </div>
                      <span className="text-sm font-medium text-emerald-800 ml-3">Completed</span>
                    </div>
                    <span className="text-xl font-bold text-emerald-900">
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
                  <div className="text-sm text-gray-600 mt-2">Completion Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="card p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full -ml-12 -mt-12 blur-2xl" aria-hidden="true" />
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -mr-5 -mb-5 blur-2xl" aria-hidden="true" />
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full -mr-8 -mt-8 group-hover:bg-emerald-500/20 transition-all duration-300"></div>
            <h3 className="text-xl font-bold mb-8 flex items-center text-emerald-700">
              <FiClock className="w-6 h-6 mr-3" />
              Recent Tasks
            </h3>
            <div className="space-y-3">
              {tasks
                .sort((a, b) => new Date(b.due_date || Date.now()).getTime() - new Date(a.due_date || Date.now()).getTime())
                .slice(0, 3)
                .map((task) => (
                  <div key={task.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all duration-300 shadow-sm hover:shadow group">
                    <div className={`w-3 h-3 rounded-full ${task.completed ? 'bg-emerald-500' : task.priority === 3 ? 'bg-red-500' : task.priority === 2 ? 'bg-yellow-500' : 'bg-indigo-400'}`} />
                    <div className="flex-grow">
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                        {task.title}
                      </p>
                      <p className={`text-xs ${task.completed 
                        ? 'text-emerald-500' 
                        : task.priority === 3 
                          ? 'text-red-500' 
                          : task.priority === 2 
                            ? 'text-yellow-500' 
                            : 'text-indigo-500'}`}
                      >
                        {task.completed ? 'Completed' 
                          : `${task.priority === 1 ? 'Low' : task.priority === 2 ? 'Medium' : 'High'} Priority`
                        }
                      </p>
                      <p className="text-xs text-gray-500 mt-0.25">
                        {task.due_date ? moment(task.due_date).fromNow() : 'No due date'}
                      </p>
                    </div>
                  </div>
                ))}
              <button 
                onClick={() => router.push('/tasks')} 
                className="w-full text-center text-sm font-medium text-gray-700 hover:text-gray-900 py-1.5 transition-colors rounded-lg hover:bg-gray-100"
              >
                View all tasks →
              </button>
            </div>
          </div>
        </div>

        {/* Upcoming Events Widget */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-blue-100 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -mr-8 -mt-8 group-hover:bg-blue-500/20 transition-all duration-300"></div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-blue-700 flex items-center">
                <FiCalendar className="w-5 h-5 mr-2" />
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
                  <p className="text-gray-500 mt-2 text-xs">Loading events...</p>
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
                          <FiClock className="w-3 h-3 mr-1 text-blue-500" />
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
          <div className="card p-4 bg-gradient-to-br from-amber-50 to-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-amber-100 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full -mr-8 -mt-8 group-hover:bg-amber-500/20 transition-all duration-300"></div>
            <h3 className="text-lg font-bold mb-3 flex items-center text-amber-700">
              <FiBookOpen className="w-5 h-5 mr-2" />
              Study Stats
            </h3>
            <div className="flex flex-col items-center justify-center h-44 bg-gradient-to-br from-amber-50 to-white rounded-xl border border-dashed border-amber-200 relative overflow-hidden group">
              <div className="absolute inset-0 bg-grid-amber-500/[0.05] bg-[size:16px_16px]" aria-hidden="true"></div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-amber-500/10 rounded-full group-hover:bg-amber-500/20 transition-all duration-500"></div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-amber-500/10 rounded-full group-hover:bg-amber-500/20 transition-all duration-500"></div>
              
              <svg className="w-10 h-10 text-amber-400 mb-3 animate-pulse" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-amber-600 font-medium text-sm">Study statistics coming soon</p>
              <p className="text-xs text-gray-500 mt-1">Track your progress and study habits</p>
              
              <button className="mt-4 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-md transition-all duration-300 flex items-center">
                <FiPlus className="w-3.5 h-3.5 mr-1" />
                Add Study Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}