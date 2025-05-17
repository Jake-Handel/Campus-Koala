'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { FiPlus, FiX } from 'react-icons/fi';
import type { ReactElement } from 'react';
import { Event } from './types';

interface NewEvent {
  title: string;
  start: string;
  end: string;
  location: string;
  category: string;
  color: string;
  description: string;
}

const CalendarComponent = dynamic(
  () => import('./calendar-component'),
  { ssr: false }
);

const eventCategories = [
  { name: 'Study', color: 'rgba(63, 136, 197, 0.9)' },
  { name: 'Exam', color: 'rgba(255, 59, 48, 0.9)' },
  { name: 'Assignment', color: 'rgba(88, 86, 214, 0.9)' },
  { name: 'Meeting', color: 'rgba(52, 199, 89, 0.9)' },
  { name: 'Todo', color: 'rgba(175, 82, 222, 0.9)' },
  { name: 'Other', color: 'rgba(255, 149, 0, 0.9)' },
];

export default function CalendarPage(): ReactElement {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete'>('create');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState<NewEvent>({
    title: '',
    start: '',
    end: '',
    location: '',
    category: 'Other',
    color: eventCategories.find(cat => cat.name === 'Other')?.color || '#FF9500',
    description: '',
  });

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
    setModalType('edit');
  };

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setIsModalOpen(true);
      setModalType('create');
    } else if (e.key === 'Escape') {
      setIsModalOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/calendar/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch events');
      }

      const data = await response.json();
      const processedEvents = data.map((event: any) => ({
        ...event,
        id: event.id.toString(),
        start: new Date(event.start),
        end: new Date(event.end),
        color: eventCategories.find(cat => cat.name === event.category)?.color || 'rgba(128, 128, 128, 0.9)',
        className: `event-${(event.category || 'other').toLowerCase()}`
      }));

      setEvents(processedEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
      toast.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/calendar/${selectedEvent.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title: selectedEvent.title,
          description: selectedEvent.description,
          start_time: selectedEvent.start.toISOString(),
          end_time: selectedEvent.end.toISOString(),
          category: selectedEvent.category,
          location: selectedEvent.location
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update event');
      }

      await fetchEvents();
      setIsModalOpen(false);
      setSelectedEvent(null);
      toast.success('Event updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
      toast.error(error);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/calendar/${selectedEvent.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete event');
      }

      await fetchEvents();
      setIsModalOpen(false);
      setSelectedEvent(null);
      toast.success('Event deleted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
      toast.error(error);
    }
  };

  const handleDeleteEventClick = () => {
    if (!selectedEvent) return;
    setModalType('delete');
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) {
      toast.error('Please fill in all required fields');
      setError('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const eventData = {
        title: newEvent.title,
        start_time: new Date(newEvent.start).toISOString(),
        end_time: new Date(newEvent.end).toISOString(),
        location: newEvent.location,
        category: newEvent.category,
        description: newEvent.description
      };

      const response = await fetch('http://localhost:5000/api/calendar/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }

      await fetchEvents();
      setIsModalOpen(false);
      setNewEvent({
        title: '',
        start: '',
        end: '',
        location: '',
        category: 'Other',
        color: eventCategories.find(cat => cat.name === 'Other')?.color || '#FF9500',
        description: ''
      });
      toast.success('Event created successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
      toast.error(error);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setNewEvent({
      title: '',
      start: '',
      end: '',
      location: '',
      category: 'Other',
      color: eventCategories.find(cat => cat.name === 'Other')?.color || '#FF9500',
      description: ''
    });
  };

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-center items-center">
          <h1 className="text-3xl font-bold bg-clip-text text-indigo-500">Calendar</h1>
        </div>

        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => {
              setIsModalOpen(true);
              setModalType('create');
            }}
            className="inline-flex items-center px-5 py-3 rounded-xl border-2 border-indigo-500 text-sm font-medium text-indigo-600 bg-indigo-200 backdrop-blur-sm hover:bg-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
          >
            <FiPlus className="mr-2 h-5 w-5" aria-hidden="true" />
            Add Event
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="h-[80vh]">
            <CalendarComponent
              events={events}
              onSelectEvent={handleEventSelect}
              className="w-full"
            />
          </div>
        </div>

        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 overflow-y-auto z-50"
            >
              <div className="flex items-center justify-center min-h-screen">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl mx-4"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-500">
                      {modalType === 'create' ? 'Create Event' : modalType === 'edit' ? 'Edit Event' : 'Delete Event'}
                    </h2>
                    <button
                      onClick={handleModalClose}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FiX className="h-6 w-6" />
                    </button>
                  </div>

                  {modalType === 'create' || modalType === 'edit' ? (
                    <form className="space-y-6">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-800 mb-2">
                          Title
                        </label>
                        <div className="mt-1 relative rounded-xl shadow-sm">
                          <input
                            type="text"
                            id="title"
                            value={modalType === 'create' ? newEvent.title : selectedEvent?.title || ''}
                            onChange={(e) => {
                              if (modalType === 'create') {
                                setNewEvent(prev => ({ ...prev, title: e.target.value }));
                              } else {
                                setSelectedEvent(prev => prev ? { ...prev, title: e.target.value } : null);
                              }
                            }}
                            className="block w-full px-5 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-white/50 backdrop-blur-sm placeholder:text-gray-400 sm:text-sm"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="start" className="block text-sm font-medium text-gray-800 mb-2">
                          Start Time
                        </label>
                        <div className="mt-1 relative rounded-xl shadow-sm">
                          <div className="flex space-x-2">
                            <div className="flex-1">
                              <input
                                type="date"
                                id="startDate"
                                value={modalType === 'create' 
                                  ? newEvent.start.split('T')[0]
                                  : selectedEvent?.start.toLocaleDateString('en-CA')}
                                onChange={(e) => {
                                  const newDate = e.target.value;
                                  
                                  if (modalType === 'create') {
                                    const time = newEvent.start.includes('T') ? newEvent.start.split('T')[1] : '00:00';
                                    setNewEvent(prev => ({
                                      ...prev,
                                      start: `${newDate}T${time}`
                                    }));
                                  } else if (selectedEvent) {
                                    const newStart = new Date(selectedEvent.start);
                                    const [year, month, day] = newDate.split('-').map(Number);
                                    newStart.setFullYear(year, month - 1, day);
                                    setSelectedEvent({ ...selectedEvent, start: newStart });
                                  }
                                }}
                                className="block w-full px-5 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-white/50 backdrop-blur-sm placeholder:text-gray-400 sm:text-sm"
                                required
                              />
                            </div>
                            <div className="flex-1">
                              <input
                                type="time"
                                id="startTime"
                                value={modalType === 'create' 
                                  ? (newEvent.start.includes('T') ? newEvent.start.split('T')[1].substring(0, 5) : '00:00')
                                  : selectedEvent?.start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                onChange={(e) => {
                                  const newTime = e.target.value;
                                  
                                  if (modalType === 'create') {
                                    const date = newEvent.start.split('T')[0];
                                    setNewEvent(prev => ({
                                      ...prev,
                                      start: `${date}T${newTime}`
                                    }));
                                  } else if (selectedEvent) {
                                    const newStart = new Date(selectedEvent.start);
                                    const [hours, minutes] = newTime.split(':').map(Number);
                                    newStart.setHours(hours, minutes, 0, 0);
                                    setSelectedEvent({ ...selectedEvent, start: newStart });
                                  }
                                }}
                                className="block w-full px-5 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-white/50 backdrop-blur-sm placeholder:text-gray-400 sm:text-sm"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="end" className="block text-sm font-medium text-gray-800 mb-2">
                          End Time
                        </label>
                        <div className="mt-1 relative rounded-xl shadow-sm">
                          <div className="flex space-x-2">
                            <div className="flex-1">
                              <input
                                type="date"
                                id="endDate"
                                value={modalType === 'create' 
                                  ? newEvent.end.split('T')[0]
                                  : selectedEvent?.end.toLocaleDateString('en-CA')}
                                onChange={(e) => {
                                  const newDate = e.target.value;
                                  
                                  if (modalType === 'create') {
                                    const time = newEvent.end.includes('T') ? newEvent.end.split('T')[1] : '00:00';
                                    setNewEvent(prev => ({
                                      ...prev,
                                      end: `${newDate}T${time}`
                                    }));
                                  } else if (selectedEvent) {
                                    const newEnd = new Date(selectedEvent.end);
                                    // Create a new date in the local timezone with the selected date
                                    const [year, month, day] = newDate.split('-').map(Number);
                                    newEnd.setFullYear(year, month - 1, day);
                                    // Preserve the time portion
                                    const hours = newEnd.getHours();
                                    const minutes = newEnd.getMinutes();
                                    newEnd.setHours(hours, minutes, 0, 0);
                                    setSelectedEvent({ ...selectedEvent, end: newEnd });
                                  }
                                }}
                                className="block w-full px-5 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-white/50 backdrop-blur-sm placeholder:text-gray-400 sm:text-sm"
                                required
                              />
                            </div>
                            <div className="flex-1">
                              <input
                                type="time"
                                id="endTime"
                                value={modalType === 'create' 
                                  ? (newEvent.end.includes('T') ? newEvent.end.split('T')[1].substring(0, 5) : '00:00')
                                  : selectedEvent?.end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                onChange={(e) => {
                                  const newTime = e.target.value;
                                  
                                  if (modalType === 'create') {
                                    const date = newEvent.end.split('T')[0];
                                    setNewEvent(prev => ({
                                      ...prev,
                                      end: `${date}T${newTime}`
                                    }));
                                  } else if (selectedEvent) {
                                    const newEnd = new Date(selectedEvent.end);
                                    const [hours, minutes] = newTime.split(':').map(Number);
                                    newEnd.setHours(hours, minutes, 0, 0);
                                    setSelectedEvent({ ...selectedEvent, end: newEnd });
                                  }
                                }}
                                className="block w-full px-5 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-white/50 backdrop-blur-sm placeholder:text-gray-400 sm:text-sm"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-800 mb-2">
                          Category
                        </label>
                        <div className="mt-1 relative rounded-xl shadow-sm">
                          <select
                            id="category"
                            value={modalType === 'create' ? newEvent.category : selectedEvent?.category || 'Other'}
                            onChange={(e) => {
                              if (modalType === 'create') {
                                setNewEvent(prev => ({ ...prev, category: e.target.value }));
                              } else {
                                setSelectedEvent(prev => prev ? { ...prev, category: e.target.value } : null);
                              }
                            }}
                            className="block w-full px-5 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-white/50 backdrop-blur-sm placeholder:text-gray-400 sm:text-sm"
                          >
                            {eventCategories.map(cat => (
                              <option key={cat.name} value={cat.name}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-800 mb-2">
                          Location (optional)
                        </label>
                        <div className="mt-1 relative rounded-xl shadow-sm">
                          <input
                            type="text"
                            id="location"
                            value={modalType === 'create' ? newEvent.location : selectedEvent?.location || ''}
                            onChange={(e) => {
                              if (modalType === 'create') {
                                setNewEvent(prev => ({ ...prev, location: e.target.value }));
                              } else {
                                setSelectedEvent(prev => prev ? { ...prev, location: e.target.value } : null);
                              }
                            }}
                            className="block w-full px-5 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-white/50 backdrop-blur-sm placeholder:text-gray-400 sm:text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-800 mb-2">
                          Description (optional)
                        </label>
                        <div className="mt-1 relative rounded-xl shadow-sm">
                          <textarea
                            id="description"
                            rows={4}
                            value={modalType === 'create' ? newEvent.description : selectedEvent?.description || ''}
                            onChange={(e) => {
                              if (modalType === 'create') {
                                setNewEvent(prev => ({ ...prev, description: e.target.value }));
                              } else {
                                setSelectedEvent(prev => prev ? { ...prev, description: e.target.value } : null);
                              }
                            }}
                            className="block w-full px-5 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-white/50 backdrop-blur-sm placeholder:text-gray-400 sm:text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-4">
                        <>
                            <button
                              type="button"
                              onClick={handleModalClose}
                              className="inline-flex justify-center py-3 px-6 border border-gray-200 shadow-sm text-sm font-medium rounded-xl text-gray-800 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={modalType === 'create' ? handleCreateEvent : modalType === 'edit' ? handleUpdateEvent : handleDeleteEvent}
                              className={`
                                inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2
                                ${modalType === 'create' ? 'text-white bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-500/90 hover:to-blue-500/90 focus:ring-blue-500' :
                                modalType === 'edit' ? 'text-white bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-500/90 hover:to-blue-500/90 focus:ring-blue-500' :
                                'text-white bg-red-500 hover:bg-red-500/90 focus:ring-red-500'
                              }
                              `}
                            >
                              {modalType === 'create' ? 'Create' : modalType === 'edit' ? 'Update' : 'Delete'}
                            </button>
                            {modalType === 'edit' && (
                              <button
                                type="button"
                                onClick={handleDeleteEventClick}
                                className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-red-500 hover:bg-red-500/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                Delete
                              </button>
                            )}
                          </>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center">
                      <h3 className="text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-500 mb-6">
                        Are you sure you want to delete this event?
                      </h3>
                      <div className="mt-8 flex justify-center space-x-4">
                        <button
                          type="button"
                          onClick={handleModalClose}
                          className="inline-flex justify-center py-3 px-6 border border-gray-200 shadow-sm text-sm font-medium rounded-xl text-gray-800 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteEvent}
                          className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-red-500 hover:bg-red-500/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && (
          <div className="flex justify-center items-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
