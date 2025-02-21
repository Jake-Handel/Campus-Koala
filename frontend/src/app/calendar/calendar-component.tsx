'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Tooltip } from 'react-tooltip';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import moment from 'moment';
import dynamic from 'next/dynamic';
import type { View, ToolbarProps, Components, Calendar as BigCalendar } from 'react-big-calendar';
import { momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaCalendarAlt, FaCalendarWeek, FaCalendarDay, FaListUl } from 'react-icons/fa';
import { Event } from './types';

const Calendar = dynamic<BigCalendar<Event, object>>(
  async () => {
    const { Calendar } = await import('react-big-calendar');
    return Calendar;
  },
  { ssr: false }
);

const localizer = momentLocalizer(moment);

interface CalendarComponentProps {
  events: Event[];
  onSelectEvent: (event: Event) => void;
  className?: string;
}

const getEventStart = (event: { start: Date }) => event.start;
const getEventEnd = (event: { end: Date }) => event.end;

export default function CalendarComponent({ events, onSelectEvent, className }: CalendarComponentProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const eventStyleGetter = (event: Event) => {
    const style = {
      backgroundColor: event.color || '#111827',
      borderRadius: '8px',
      opacity: 1,
      color: '#fff',
      border: 'none',
      display: 'block',
      padding: '6px 10px',
      margin: '2px 4px',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      overflow: 'hidden'
    };
    return { style };
  };

  const dayPropGetter = (date: Date) => {
    const today = moment().startOf('day');
    const isToday = moment(date).isSame(today, 'day');
    
    return {
      className: `${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''} transition-colors`,
      style: {
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#000000'
      }
    };
  };

  const calendarClasses = {
    // Calendar container
    wrapper: 'h-full',
    container: 'bg-transparent',
    // Month view
    monthView: 'divide-y divide-gray-200/50 dark:divide-gray-800/50',
    // Header row
    headerRow: 'bg-white/50 dark:bg-gray-800/50 border-b border-gray-200/50 dark:border-gray-800/50 backdrop-blur-sm',
    header: 'py-3 text-sm font-semibold text-primary dark:text-primary-foreground text-center',
    // Day cells
    dayCell: 'min-h-[120px] p-3 border-r border-gray-200/50 dark:border-gray-800/50 relative transition-colors hover:bg-white/50 dark:hover:bg-gray-800/30',
    // Date numbers
    dateNumber: 'text-sm text-white-900 dark:text-white-100 font-medium',
    todayNumber: 'bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200',
    // Events
    event: 'mb-2 text-xs bg-secondary/10 dark:bg-secondary/20 text-secondary-foreground dark:text-secondary-foreground/90 rounded-lg px-3 py-1.5 truncate border border-secondary/20 dark:border-secondary/30 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer',
    // Navigation buttons
    button: 'px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 rounded-lg hover:bg-white dark:hover:bg-gray-700/50 transition-all duration-200 shadow-sm hover:shadow backdrop-blur-sm',
    activeButton: 'bg-primary text-primary-foreground border-primary hover:bg-primary/90 dark:hover:bg-primary/90 shadow-md',
    // Toolbar
    toolbar: 'flex justify-between items-center p-4 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm',
    toolbarLabel: 'text-2xl font-bold text-emerald-600 bg-clip-text text-transparent text-center mx-auto',
    buttonGroup: 'flex gap-2',

  };

  const components: Components<Event, object> = {
    toolbar: (props: ToolbarProps<Event>) => (
      <div className={calendarClasses.toolbar}>
        <div className="flex items-center justify-between w-full">
          <div className={calendarClasses.buttonGroup}>
            <button
              onClick={() => props.onNavigate('TODAY')}
              className={calendarClasses.button}
            >
              Today
            </button>
            <button
              onClick={() => props.onNavigate('PREV')}
              className={calendarClasses.button}
            >
              Back
            </button>
            <button
              onClick={() => props.onNavigate('NEXT')}
              className={calendarClasses.button}
            >
              Next
            </button>
          </div>
          <span className={calendarClasses.toolbarLabel}>
            {props.label}
          </span>
          <div className={calendarClasses.buttonGroup}>
            <button
              onClick={() => props.onView('month')}
              className={twMerge(
                calendarClasses.button,
                'flex items-center gap-2',
                props.view === 'month' && calendarClasses.activeButton
              )}
            >
              <FaCalendarAlt className="text-lg" />
              <span>Month</span>
            </button>
            <button
              onClick={() => props.onView('week')}
              className={twMerge(
                calendarClasses.button,
                'flex items-center gap-2',
                props.view === 'week' && calendarClasses.activeButton
              )}
            >
              <FaCalendarWeek className="text-lg" />
              <span>Week</span>
            </button>
            <button
              onClick={() => props.onView('day')}
              className={twMerge(
                calendarClasses.button,
                'flex items-center gap-2',
                props.view === 'day' && calendarClasses.activeButton
              )}
            >
              <FaCalendarDay className="text-lg" />
              <span>Day</span>
            </button>
            <button
              onClick={() => props.onView('agenda')}
              className={twMerge(
                calendarClasses.button,
                'flex items-center gap-2',
                props.view === 'agenda' && calendarClasses.activeButton
              )}
            >
              <FaListUl className="text-lg" />
              <span>Agenda</span>
            </button>
          </div>
        </div>
      </div>
    ),
    month: {
      header: ({ label }) => (
        <div className={calendarClasses.header}>{label}</div>
      ),
      dateHeader: ({ label, date }) => (
        <div className="flex w-full">
          <div className={twMerge(
            calendarClasses.dateNumber,
            moment(date).isSame(moment(), 'day') && calendarClasses.todayNumber
          )}>
            {label}
          </div>
        </div>
      ),
    },
    event: (props) => (
      <div
        data-tooltip-id={`event-${props.event.id}`}
        className={calendarClasses.event}
      >
        {props.title}
        <Tooltip
          id={`event-${props.event.id}`}
          place="top"
          className="max-w-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg rounded-lg"
          render={() => (
            <div className="p-2">
              <p className="font-bold">{props.title}</p>
              {props.event.category && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{props.event.category}</p>
              )}
              {props.event.location && (
                <p className="text-sm mt-1"> 📍 {props.event.location}</p>
              )}
              {props.event.description && (
                <p className="text-sm mt-1">{props.event.description}</p>
              )}
            </div>
          )}
        />
      </div>
    )
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={twMerge("h-full w-full", className)}
    >
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor={getEventStart}
        endAccessor={getEventEnd}
        onSelectEvent={onSelectEvent}
        eventPropGetter={eventStyleGetter}
        dayPropGetter={dayPropGetter}
        components={components}
        className="h-full"
        views={{
          month: true,
          week: true,
          day: true,
          agenda: true
        }}
        defaultView="month"
      />
    </motion.div>
  );
}
