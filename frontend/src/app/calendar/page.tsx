'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import moment from 'moment';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { FiPlus } from 'react-icons/fi';
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

// Event interface is imported from './types'

const eventCategories = [
  { name: 'Study', color: '#4338CA' },  // Indigo-700 for better contrast
  { name: 'Exam', color: '#DC2626' },    // Red-600 kept for urgency
  { name: 'Assignment', color: '#2563EB' }, // Blue-600 for better visibility
  { name: 'Meeting', color: '#059669' },   // Emerald-600 for softer meetings
  { name: 'Other', color: '#6B7280' },    // Gray-500 for better contrast
];

export default function CalendarPage(): ReactElement {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([{
    id: '1',
    title: 'Sample Study Session',
    start: new Date(2025, 1, 20, 10, 0), // February 20, 2025, 10:00 AM
    end: new Date(2025, 1, 20, 12, 0),   // February 20, 2025, 12:00 PM
    category: 'Study',
    color: '#4338CA',
    description: 'Math study session'
  },
  {
    id: '2',
    title: 'Assignment Due',
    start: new Date(2025, 1, 22),        // February 22, 2025
    end: new Date(2025, 1, 22),
    category: 'Assignment',
    color: '#2563EB',
    description: 'Physics Assignment'
  }]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState<NewEvent>({
    title: '',
    start: '',
    end: '',
    location: '',
    category: 'Other',
    color: eventCategories.find(cat => cat.name === 'Other')?.color || '#6B7280',
    description: '',
  });

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    setIsEditOpen(true);
  };

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setIsCreateOpen(true);
    } else if (e.key === 'Escape') {
      setIsCreateOpen(false);
      setIsEditOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    // Initialize the calendar
    setIsLoading(false);
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
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      const processedEvents = data.map((event: any) => ({
        ...event,
        id: event.id.toString(),
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        color: eventCategories.find(cat => cat.name === event.category)?.color,
        className: `event-${event.category.toLowerCase()} shadow-sm hover:shadow-lg rounded-lg transition-all duration-300 ease-in-out`
      }));
      setEvents(processedEvents);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch events';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      const response = await fetch(`http://localhost:5000/api/calendar/${selectedEvent.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          title: selectedEvent.title,
          description: selectedEvent.description,
          start_time: selectedEvent.start.toISOString(),
          end_time: selectedEvent.end.toISOString(),
          category: selectedEvent.category,
          location: selectedEvent.location
        }),
      });
      
      if (!response.ok) throw new Error('Failed to update event');
      
      const data = await response.json();
      setEvents(events.map(e => e.id === selectedEvent.id ? {
        ...data,
        id: data.id.toString(),
        start: new Date(data.start_time),
        end: new Date(data.end_time),
        color: eventCategories.find(cat => cat.name === data.category)?.color,
        className: `event-${data.category.toLowerCase()} shadow-sm hover:shadow-md transition-shadow duration-200`
      } : e));
      
      setIsEditOpen(false);
      setSelectedEvent(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update event';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    setIsProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/calendar/${selectedEvent.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      
      if (!response.ok) throw new Error('Failed to delete event');
      
      setEvents(events.filter(e => e.id !== selectedEvent.id));
      setIsDeleteOpen(false);
      setIsEditOpen(false);
      setSelectedEvent(null);
      toast.success('Event deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete event';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) {
      toast.error('Please fill in all required fields');
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);

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
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) throw new Error('Failed to create event');
      
      const newEventData = await response.json();
      setEvents([...events, {
        ...newEventData,
        start: new Date(newEventData.start_time),
        end: new Date(newEventData.end_time),
        color: eventCategories.find(cat => cat.name === newEventData.category)?.color,
        className: `event-${newEventData.category.toLowerCase()} shadow-sm hover:shadow-lg rounded-lg transition-all duration-300 ease-in-out`
      }]);
      
      setIsCreateOpen(false);
      setNewEvent({
        title: '',
        start: '',
        end: '',
        location: '',
        category: 'Other',
        color: eventCategories.find(cat => cat.name === 'Other')?.color || '#6B7280',
        description: ''
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 relative">
      <Toaster position="top-right" />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-10"
      >
        <div className="relative w-full max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-4xl font-bold text-emerald-600 bg-clip-text text-transparent text-center">
              Calendar
            </h1>
            <div className="mt-3 inline-flex items-center px-4 py-2.5 rounded-full bg-emerald-90 dark:bg-emerald-300/20 border border-emerald-100 dark:border-emerald-800 shadow-sm">
              <span className="text-base text-emerald-700 dark:text-emerald-600 font-medium">
                {isLoading ? "Loading..." : `${events.length} ${events.length === 1 ? 'Event' : 'Events'}`}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="absolute top-0 right-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors duration-200"
          >
            <FiPlus className="w-5 h-5" />
            New Event
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4">{error}</div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-[80vh]">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="h-[80vh] bg-white/80 dark:bg-gray-900/90 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden border border-gray-200/50 dark:border-gray-800/50">
            <CalendarComponent
              events={events}
              onSelectEvent={handleEventSelect}
              className="h-full"
            />
          </div>
        )}
      </motion.div>

      {/* Edit Event Modal */}
      <AnimatePresence>
        {isEditOpen && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl w-[520px] shadow-2xl border border-gray-100 dark:border-gray-700"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Event</h2>
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={selectedEvent.title}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                    className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Category</label>
                    <select
                      value={selectedEvent.category || 'Other'}
                      onChange={(e) => setSelectedEvent({
                        ...selectedEvent,
                        category: e.target.value,
                        color: eventCategories.find(cat => cat.name === e.target.value)?.color
                      })}
                      className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                    >
                      {eventCategories.map((category) => (
                        <option key={category.name} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Start Time</label>
                  <input
                    type="datetime-local"
                    value={moment(selectedEvent.start).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, start: new Date(e.target.value) })}
                    className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">End Time</label>
                  <input
                    type="datetime-local"
                    value={moment(selectedEvent.end).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, end: new Date(e.target.value) })}
                    className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Location</label>
                  <input
                    type="text"
                    value={selectedEvent.location || ''}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, location: e.target.value })}
                    className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                    placeholder="Enter location (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Description</label>
                  <textarea
                    value={selectedEvent.description || ''}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, description: e.target.value })}
                    className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                    rows={3}
                    placeholder="Add event description (optional)"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={() => setIsEditOpen(false)}
                    className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700/50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateEvent}
                    className="px-5 py-2.5 text-white text-emerald-600 hover:from-emerald-500 hover:to-emerald-400 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-95"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Event Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl w-[520px] shadow-2xl border border-gray-100 dark:border-gray-700"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Event</h2>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                    placeholder="Enter event title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Category</label>
                    <select
                      value={newEvent.category || 'Other'}
                      onChange={(e) => setNewEvent({
                        ...newEvent,
                        category: e.target.value,
                        color: eventCategories.find(cat => cat.name === e.target.value)?.color
                      })}
                      className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                    >
                      {eventCategories.map((category) => (
                        <option key={category.name} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Start Time</label>
                  <input
                    type="datetime-local"
                    value={moment(newEvent.start).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => setNewEvent({ ...newEvent, start: new Date(e.target.value) })}
                    className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">End Time</label>
                  <input
                    type="datetime-local"
                    value={moment(newEvent.end).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => setNewEvent({ ...newEvent, end: new Date(e.target.value) })}
                    className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Location</label>
                  <input
                    type="text"
                    value={newEvent.location || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                    placeholder="Enter location (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Description</label>
                  <textarea
                    value={newEvent.description || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                    rows={3}
                    placeholder="Add event description (optional)"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={() => setIsCreateOpen(false)}
                    className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700/50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateEvent}
                    className="px-5 py-2.5 text-white text-emerald-600 hover:from-emerald-500 hover:to-emerald-400 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-95"
                  >
                    Create Event
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

         {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteOpen && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl w-[520px] shadow-2xl border border-gray-100 dark:border-gray-700"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Delete Event</h2>
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-5">
                <p className="text-gray-600 dark:text-gray-400">
                  Are you sure you want to delete the event <span className="font-medium text-gray-900 dark:text-white">{selectedEvent.title}</span>? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={() => setIsDeleteOpen(false)}
                    className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700/50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteEvent}
                    className="px-5 py-2.5 text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-95"
                  >
                    Delete Event
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Event Modal */}
      <AnimatePresence>
        {isEditOpen && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl w-[520px] shadow-2xl border border-gray-100 dark:border-gray-700"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Event</h2>
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={selectedEvent.title}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                    className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Category</label>
                    <select
                      value={selectedEvent.category || 'Other'}
                      onChange={(e) => setSelectedEvent({
                        ...selectedEvent,
                        category: e.target.value,
                        color: eventCategories.find(cat => cat.name === e.target.value)?.color
                      })}
                      className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                    >
                      {eventCategories.map((category) => (
                        <option key={category.name} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Start Time</label>
                  <input
                    type="datetime-local"
                    value={moment(selectedEvent.start).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, start: new Date(e.target.value) })}
                    className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">End Time</label>
                  <input
                    type="datetime-local"
                    value={moment(selectedEvent.end).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, end: new Date(e.target.value) })}
                    className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Location</label>
                  <input
                    type="text"
                    value={selectedEvent.location || ''}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, location: e.target.value })}
                    className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                    placeholder="Enter location (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Description</label>
                  <textarea
                    value={selectedEvent.description || ''}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, description: e.target.value })}
                    className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                    rows={3}
                    placeholder="Add event description (optional)"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={() => setIsEditOpen(false)}
                    className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700/50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateEvent}
                    className="px-5 py-2.5 text-white text-emerald-600 hover:from-emerald-500 hover:to-emerald-400 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-95"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreateOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl w-[520px] shadow-2xl border border-gray-100 dark:border-gray-700"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-emerald-b bg-clip-text text-transparent">Create Event</h2>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                    placeholder="Enter event title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Category</label>
                    <select
                      value={newEvent.category}
                      onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                      className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                    >
                      {eventCategories.map((category) => (
                        <option key={category.name} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Start Time</label>
                  <input
                    type="datetime-local"
                    value={newEvent.start}
                    onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                    className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">End Time</label>
                  <input
                    type="datetime-local"
                    value={newEvent.end}
                    onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                    className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Location</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                    placeholder="Enter location (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Description</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                    rows={3}
                    placeholder="Add event description (optional)"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={() => setIsCreateOpen(false)}
                    className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700/50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateEvent}
                    disabled={isLoading}
                    className="px-5 py-2.5 text-white text-emerald-600 hover:from-emerald-500 hover:to-emerald-400 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-4.411 3.589-8 8-8v4c-2.29 0-4.412 1.877-4.412 4.412 0 2.535 2.077 4.412 4.412 4.412v4a7.963 7.963 0 01-6-2.533z"
                          />
                        </svg>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Create</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
