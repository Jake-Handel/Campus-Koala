'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import moment from 'moment';

const BigCalendar = dynamic(
  () => import('./calendar-component'),
  { ssr: false }
);

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    end: '',
    location: ''
  });

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) {
      alert('Please fill in all required fields');
      return;
    }

    const event: Event = {
      id: Date.now().toString(),
      title: newEvent.title,
      start: new Date(newEvent.start),
      end: new Date(newEvent.end),
      location: newEvent.location
    };

    setEvents([...events, event]);
    setIsCreateOpen(false);
    setNewEvent({ title: '', start: '', end: '', location: '' });
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Create Event
        </button>
      </div>

      <div className="mb-8" style={{ height: 500 }}>
        <BigCalendar
          events={events}
          onSelectEvent={(event) => {
            setSelectedEvent(event);
            setIsEditOpen(true);
          }}
        />
      </div>

      {isEditOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Event</h2>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={selectedEvent.title}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Time</label>
                <input
                  type="datetime-local"
                  value={moment(selectedEvent.start).format('YYYY-MM-DDTHH:mm')}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, start: new Date(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Time</label>
                <input
                  type="datetime-local"
                  value={moment(selectedEvent.end).format('YYYY-MM-DDTHH:mm')}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, end: new Date(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location (optional)</label>
                <input
                  type="text"
                  value={selectedEvent.location || ''}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, location: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    const updatedEvents = events.map((e) =>
                      e.id === selectedEvent.id ? selectedEvent : e
                    );
                    setEvents(updatedEvents);
                    setIsEditOpen(false);
                    setSelectedEvent(null);
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    const updatedEvents = events.filter((e) => e.id !== selectedEvent.id);
                    setEvents(updatedEvents);
                    setIsEditOpen(false);
                    setSelectedEvent(null);
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create Event</h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Time</label>
                <input
                  type="datetime-local"
                  value={newEvent.start}
                  onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Time</label>
                <input
                  type="datetime-local"
                  value={newEvent.end}
                  onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location (optional)</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleCreateEvent}
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
