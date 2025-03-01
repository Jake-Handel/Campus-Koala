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
  { name: 'Study', color: 'rgba(63, 136, 197, 0.7)' },    // Blue
  { name: 'Exam', color: 'rgba(255, 59, 48, 0.7)' },     // Red
  { name: 'Assignment', color: 'rgba(88, 86, 214, 0.7)' }, // Purple
  { name: 'Meeting', color: 'rgba(52, 199, 89, 0.7)' },   // Green
  { name: 'Todo', color: 'rgba(175, 82, 222, 0.7)' },     // Pink/Purple
  { name: 'Other', color: 'rgba(255, 149, 0, 0.7)' },     // Orange
];

export default function CalendarPage(): ReactElement {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
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
    color: eventCategories.find(cat => cat.name === 'Other')?.color || '#FF9500',
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
        },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      const processedEvents = data.map((event: any) => {
        // Find the category color or use a default if not found
        const categoryColor = eventCategories.find(cat => cat.name === event.category)?.color || 'rgba(128, 128, 128, 0.7)';
        
        return {
          ...event,
          id: event.id.toString(),
          start: new Date(event.start_time),
          end: new Date(event.end_time),
          color: categoryColor,
          className: `event-${(event.category || 'other').toLowerCase()}`
        };
      });
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
      
      if (!response.ok) throw new Error('Failed to update event');
      
      const data = await response.json();
      setEvents(events.map(e => e.id === selectedEvent.id ? {
        ...data,
        id: data.id.toString(),
        start: new Date(data.start_time),
        end: new Date(data.end_time),
        color: eventCategories.find(cat => cat.name === data.category)?.color,
        className: `event-${data.category.toLowerCase()}`
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

      const response = await fetch(`http://localhost:5000/api/calendar/${selectedEvent.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to delete event');

      setEvents(events.filter(event => event.id !== selectedEvent.id));
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
        className: `event-${newEventData.category.toLowerCase()}`
      }]);
      
      setIsCreateOpen(false);
      setNewEvent({
        title: '',
        start: '',
        end: '',
        location: '',
        category: 'Other',
        color: eventCategories.find(cat => cat.name === 'Other')?.color || '#FF9500',
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
            <h1 className="text-4xl font-bold text-emerald-600 bg-clip-text text-center">
              Calendar
            </h1>
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
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl w-[90vw] max-w-[540px] shadow-2xl border border-gray-100/10 dark:border-gray-700/50"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-emerald-500 bg-clip-text">Edit Event</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Update event details</p>
                </div>
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-full"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 group-focus-within:text-emerald-500 transition-colors">Title</label>
                  <input
                    type="text"
                    value={selectedEvent.title}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                    className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-gray-400 text-gray-700 dark:text-gray-200 transition-all duration-200"
                    placeholder="Enter a descriptive title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 group-focus-within:text-emerald-500 transition-colors">Category</label>
                    <select
                      value={selectedEvent.category || 'Other'}
                      onChange={(e) => setSelectedEvent({
                        ...selectedEvent,
                        category: e.target.value,
                        color: eventCategories.find(cat => cat.name === e.target.value)?.color
                      })}
                      className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-gray-400 text-gray-700 dark:text-gray-200 transition-all duration-200"
                    >
                      {eventCategories.map((category) => (
                        <option key={category.name} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 group-focus-within:text-emerald-500 transition-colors">Location</label>
                    <input
                      type="text"
                      value={selectedEvent.location || ''}
                      onChange={(e) => setSelectedEvent({ ...selectedEvent, location: e.target.value })}
                      className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-gray-400 text-gray-700 dark:text-gray-200 transition-all duration-200"
                      placeholder="Add location"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 group-focus-within:text-emerald-500 transition-colors">Start Date</label>
                      <input
                        type="date"
                        value={moment(selectedEvent.start).format('YYYY-MM-DD')}
                        onChange={(e) => {
                          const currentTime = moment(selectedEvent.start).format('HH:mm');
                          setSelectedEvent({ ...selectedEvent, start: new Date(`${e.target.value}T${currentTime}`) });
                        }}
                        className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-gray-400 text-gray-700 dark:text-gray-200 transition-all duration-200"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 group-focus-within:text-emerald-500 transition-colors">Start Time</label>
                      <input
                        type="time"
                        value={moment(selectedEvent.start).format('HH:mm')}
                        onChange={(e) => {
                          const currentDate = moment(selectedEvent.start).format('YYYY-MM-DD');
                          setSelectedEvent({ ...selectedEvent, start: new Date(`${currentDate}T${e.target.value}`) });
                        }}
                        className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-gray-400 text-gray-700 dark:text-gray-200 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 group-focus-within:text-emerald-500 transition-colors">End Date</label>
                      <input
                        type="date"
                        value={moment(selectedEvent.end).format('YYYY-MM-DD')}
                        min={moment(selectedEvent.start).format('YYYY-MM-DD')}
                        onChange={(e) => {
                          const currentTime = moment(selectedEvent.end).format('HH:mm');
                          setSelectedEvent({ ...selectedEvent, end: new Date(`${e.target.value}T${currentTime}`) });
                        }}
                        className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-gray-400 text-gray-700 dark:text-gray-200 transition-all duration-200"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 group-focus-within:text-emerald-500 transition-colors">End Time</label>
                      <input
                        type="time"
                        value={moment(selectedEvent.end).format('HH:mm')}
                        onChange={(e) => {
                          const currentDate = moment(selectedEvent.end).format('YYYY-MM-DD');
                          setSelectedEvent({ ...selectedEvent, end: new Date(`${currentDate}T${e.target.value}`) });
                        }}
                        className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-gray-400 text-gray-700 dark:text-gray-200 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 group-focus-within:text-emerald-500 transition-colors">Description</label>
                  <textarea
                    value={selectedEvent.description || ''}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, description: e.target.value })}
                    className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-gray-400 text-gray-700 dark:text-gray-200 transition-all duration-200 resize-none"
                    rows={3}
                    placeholder="Add additional details about your event"
                  />
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700/50">
                  <button
                    onClick={() => setIsDeleteOpen(true)}
                    className="px-5 py-2.5 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all duration-200 font-medium flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Event
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsEditOpen(false)}
                      className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700/50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateEvent}
                      className="px-5 py-2.5 text-white bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-600 hover:to-emerald-500 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-95"
                    >
                      Save Changes
                    </button>
                  </div>
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

      {/* Create Event Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl w-[90vw] max-w-[540px] shadow-2xl border border-gray-100/10 dark:border-gray-700/50"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-emerald-500 bg-clip-text">Create Event</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Fill in the details below</p>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-full"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 group-focus-within:text-emerald-500 transition-colors">Title</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-gray-400 text-gray-700 dark:text-gray-200 transition-all duration-200"
                    placeholder="Enter a descriptive title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 group-focus-within:text-emerald-500 transition-colors">Category</label>
                    <select
                      value={newEvent.category}
                      onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                      className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-gray-400 text-gray-700 dark:text-gray-200 transition-all duration-200"
                    >
                      {eventCategories.map((category) => (
                        <option key={category.name} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 group-focus-within:text-emerald-500 transition-colors">Location</label>
                    <input
                      type="text"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-gray-400 text-gray-700 dark:text-gray-200 transition-all duration-200"
                      placeholder="Add location"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 group-focus-within:text-emerald-500 transition-colors">Start Date</label>
                      <input
                        type="date"
                        value={newEvent.start.split('T')[0]}
                        onChange={(e) => {
                          const currentTime = newEvent.start.split('T')[1] || '00:00';
                          setNewEvent({ ...newEvent, start: `${e.target.value}T${currentTime}` });
                        }}
                        className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-gray-400 text-gray-700 dark:text-gray-200 transition-all duration-200"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 group-focus-within:text-emerald-500 transition-colors">Start Time</label>
                      <input
                        type="time"
                        value={newEvent.start.split('T')[1] || ''}
                        onChange={(e) => {
                          const currentDate = newEvent.start.split('T')[0];
                          setNewEvent({ ...newEvent, start: `${currentDate}T${e.target.value}` });
                        }}
                        className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-gray-400 text-gray-700 dark:text-gray-200 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 group-focus-within:text-emerald-500 transition-colors">End Date</label>
                      <input
                        type="date"
                        value={newEvent.end.split('T')[0]}
                        min={newEvent.start.split('T')[0]}
                        onChange={(e) => {
                          const currentTime = newEvent.end.split('T')[1] || '00:00';
                          setNewEvent({ ...newEvent, end: `${e.target.value}T${currentTime}` });
                        }}
                        className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-gray-400 text-gray-700 dark:text-gray-200 transition-all duration-200"
                      />
                    </div>
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 group-focus-within:text-emerald-500 transition-colors">End Time</label>
                      <input
                        type="time"
                        value={newEvent.end.split('T')[1] || ''}
                        onChange={(e) => {
                          const currentDate = newEvent.end.split('T')[0];
                          setNewEvent({ ...newEvent, end: `${currentDate}T${e.target.value}` });
                        }}
                        className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-gray-400 text-gray-700 dark:text-gray-200 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 group-focus-within:text-emerald-500 transition-colors">Description</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder-gray-400 text-gray-700 dark:text-gray-200 transition-all duration-200 resize-none"
                    rows={3}
                    placeholder="Add additional details about your event"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                  <button
                    onClick={() => setIsCreateOpen(false)}
                    className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700/50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateEvent}
                    disabled={isLoading}
                    className="px-6 py-2.5 text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl transition-all duration-200 font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center gap-2"
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
                        <span>Create Event</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        {/* Delete Confirmation Modal */}
        {isDeleteOpen && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-[400px] shadow-2xl border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-lg font-semibold">Delete Event</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete <span className="font-medium text-gray-900 dark:text-white">{selectedEvent.title}</span>? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700/50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteEvent}
                  className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Event
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
