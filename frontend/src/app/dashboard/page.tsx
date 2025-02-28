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
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card p-6 text-center bg-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200">
            <h3 className="text-lg font-semibold mb-2">Pending</h3>
            {isLoading ? (
              <div className="flex justify-center items-center h-24">
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                <div className="relative inline-flex justify-center items-center mb-2">
                  <div className="w-24 h-24 rounded-full border-6 border-indigo-100 flex items-center justify-center">
                    <span className="text-3xl font-bold text-indigo-600">
                      {tasks.filter(t => !t.completed).length}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Tasks To Do</p>
              </>
            )}
          </div>
          <div className="card p-6 text-center bg-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200">
            <h3 className="text-lg font-semibold mb-2">High Priority</h3>
            {isLoading ? (
              <div className="flex justify-center items-center h-24">
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                <div className="relative inline-flex justify-center items-center mb-2">
                  <div className="w-24 h-24 rounded-full border-6 border-red-100 flex items-center justify-center">
                    <span className="text-3xl font-bold text-red-500">
                      {tasks.filter(t => t.priority === 3).length}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Tasks Need Attention</p>
              </>
            )}
          </div>
          <div className="card p-6 text-center bg-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200">
            <h3 className="text-lg font-semibold mb-2">Completed</h3>
            {isLoading ? (
              <div className="flex justify-center items-center h-24">
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                <div className="relative inline-flex justify-center items-center mb-2">
                  <svg className="w-24 h-24 transform -rotate-90">
                    {/* Background circle */}
                    <circle 
                      className="text-gray-200" 
                      strokeWidth="6" 
                      stroke="currentColor" 
                      fill="transparent" 
                      r="36" 
                      cx="48" 
                      cy="48"
                    />
                    {/* Progress circle */}
                    <circle 
                      className="text-indigo-500" 
                      strokeWidth="6" 
                      strokeDasharray={36 * 2 * Math.PI} 
                      strokeDashoffset={36 * 2 * Math.PI * (1 - (tasks.filter(t => t.completed).length / (tasks.length || 1)))} 
                      strokeLinecap="round" 
                      stroke="currentColor" 
                      fill="transparent" 
                      r="36" 
                      cx="48" 
                      cy="48"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-indigo-600">
                      {tasks.filter(t => t.completed).length}
                    </span>
                    <span className="text-xs text-gray-500">of {tasks.length}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Tasks Completed</p>
              </>
            )}
          </div>
        </div>

        {/* Quick Actions and Recent Tasks */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-6 bg-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200">
            <h3 className="text-xl font-bold text-indigo-600 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => router.push('/tasks')} 
                className="btn w-full border-none shadow-md transition-all duration-300 text-white font-medium bg-gradient-to-r from-indigo-600 to-indigo-400 hover:from-indigo-700 hover:to-indigo-500 hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Create New Task
              </button>
              <button 
                onClick={() => router.push('/study-timer')} 
                className="btn w-full border-none shadow-md transition-all duration-300 text-white font-medium bg-gradient-to-r from-indigo-500 to-purple-400 hover:from-indigo-600 hover:to-purple-500 hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Start Study Session
              </button>
              <button 
                onClick={() => router.push('/calendar')} 
                className="btn w-full border-none shadow-md transition-all duration-300 text-white font-medium bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 hover:shadow-lg transform hover:-translate-y-0.5"
              >
                View Calendar
              </button>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="card p-6 bg-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200">
            <h3 className="text-xl font-bold text-indigo-600 mb-4">Recent Tasks</h3>
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="spinner"></div>
                  <p className="text-gray-500 mt-2">Loading tasks...</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">No tasks found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks
                    .sort((a, b) => {
                      // Sort by priority (high to low) and then by completed status
                      if (a.priority !== b.priority) return b.priority - a.priority;
                      if (a.completed !== b.completed) return a.completed ? 1 : -1;
                      return 0;
                    })
                    .slice(0, 3) // Only show top 3 most important tasks
                    .map((task) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 hover:border-indigo-200 transition-colors">
                        <div className={`w-2 h-2 rounded-full ${task.completed ? 'bg-indigo-500' : task.priority === 3 ? 'bg-red-500' : task.priority === 2 ? 'bg-yellow-500' : 'bg-indigo-400'}`} />
                        <p className="text-sm text-black">
                          {task.title}
                          <span className={`ml-2 ${task.completed 
                            ? 'text-indigo-500' 
                            : task.priority === 3 
                              ? 'text-red-500 font-medium' 
                              : task.priority === 2 
                                ? 'text-yellow-500 font-medium' 
                                : 'text-indigo-400'}`}
                          >
                            {task.completed 
                              ? '(Completed)' 
                              : `(${task.priority === 1 ? 'Low' : task.priority === 2 ? 'Medium' : 'High'} Priority)`
                            }
                          </span>
                          {task.due_date && (
                            <span className="text-gray-400 ml-2">
                              Due: {new Date(task.due_date).toLocaleDateString('en-US', { 
                                weekday: 'short',
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Upcoming Events Widget */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-6 bg-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-indigo-600">Upcoming Events</h3>
              <button 
                onClick={() => router.push('/calendar')} 
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                View All
              </button>
            </div>
            
            <div className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-gray-600">Loading events...</p>
              ) : events && events.length > 0 ? (
                [...events]
                  // Filter only upcoming events (today and future)
                  .filter(event => moment(event.start).isSameOrAfter(moment().startOf('day')))
                  // Sort by start date (closest first)
                  .sort((a, b) => a.start.getTime() - b.start.getTime())
                  .slice(0, 3) // Only show the 3 closest upcoming events
                  .map((event) => (
                    <div key={event.id} className="flex gap-4 p-4 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 shadow-sm hover:shadow-md transition-all duration-300 border border-indigo-100 hover:border-indigo-200 transform hover:-translate-y-1 border-l-4 border-indigo-500">
                      {/* Date column */}
                      <div className="flex flex-col items-center justify-center min-w-[60px] text-center">
                        <div 
                          className="flex flex-col items-center justify-center w-12 h-12 rounded-lg shadow-sm bg-gradient-to-br from-indigo-500 to-indigo-600" 
                        >
                          <span className="text-white font-bold text-lg">
                            {moment(event.start).format('D')}
                          </span>
                          <span className="text-white text-xs font-medium">
                            {moment(event.start).format('MMM')}
                          </span>
                        </div>
                        <span className="text-xs mt-1 text-gray-500 font-medium">
                          {moment(event.start).format('ddd')}
                        </span>
                      </div>
                      
                      {/* Event details */}
                      <div className="flex-1">
                        <h4 className="font-semibold text-indigo-600 mb-1 line-clamp-1">
                          {event.title}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {event.description || 'No description provided'}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <svg className="w-3 h-3 mr-1 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                          </svg>
                          <span>{moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}</span>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-600 mb-2">No upcoming events</p>
                  <button 
                    onClick={() => router.push('/calendar')} 
                    className="btn btn-sm btn-primary"
                  >
                    Add Event
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="card p-6 bg-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200">
            {/* Placeholder for future widget */}
            <h3 className="text-xl font-bold text-indigo-600 mb-4">Study Stats</h3>
            <div className="flex flex-col items-center justify-center h-48 bg-indigo-50/50 rounded-xl border border-dashed border-indigo-200">
              <svg className="w-12 h-12 text-indigo-300 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-indigo-500 font-medium">Study statistics coming soon</p>
              <p className="text-sm text-gray-500 mt-1">Track your progress and study habits</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}