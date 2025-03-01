'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import 'react-tooltip/dist/react-tooltip.css';
import { Tooltip } from 'react-tooltip';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import moment from 'moment';
import dynamic from 'next/dynamic';
import type { View, ToolbarProps, Components, Calendar as BigCalendar } from 'react-big-calendar';
import { momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaCalendarAlt, FaCalendarWeek, FaCalendarDay, FaListUl, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Event } from './types';

const Calendar = dynamic<BigCalendar<Event, object>>(
  async () => {
    const { Calendar } = await import('react-big-calendar');
    return Calendar;
  },
  { ssr: false }
);

const EventComponent = ({ event }: { event: Event }) => {
  const timeRange = event.allDay 
    ? 'All Day'
    : `${moment(event.start).format('h:mm A')} - ${moment(event.end).format('h:mm A')}`;

  // Special handling for Todo events
  const isTodoEvent = event.category === 'Todo';
  const tooltipContent = isTodoEvent 
    ? `Task Due: ${moment(event.start).format('h:mm A')}${event.description ? ` - ${event.description}` : ''}` 
    : timeRange;

  return (
    <div
      data-tooltip-id="event-tooltip"
      data-tooltip-content={tooltipContent}
      className="cursor-pointer flex items-center rounded-sm px-1"
    >
      {isTodoEvent && (
        <span className="mr-1 text-xs">📋</span>
      )}
      <span className="font-medium text-xs truncate">{event.title}</span>
      {!event.allDay && (
        <span className="text-xs opacity-90 ml-1">{moment(event.start).format('h:mm A')}</span>
      )}
    </div>
  );
};

const localizer = momentLocalizer(moment);

interface CalendarComponentProps {
  events: Event[];
  onSelectEvent: (event: Event) => void;
  className?: string;
}

const getEventStart = (event: { start: Date }) => event.start;
const getEventEnd = (event: { end: Date }) => event.end;

export default function CalendarComponent({ events, onSelectEvent, className }: CalendarComponentProps) {
  // Add global tooltip
  useEffect(() => {
    return () => {
      const tooltips = document.querySelectorAll('[data-tooltip-id]');
      tooltips.forEach(tooltip => tooltip.remove());
    };
  }, []);

  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('month');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Format the current month and year
  const formatCurrentMonth = () => {
    return moment(currentDate).format('MMMM YYYY');
  };

  const handleNavigate = (action: 'TODAY' | 'PREV' | 'NEXT' | 'DATE', date?: Date) => {
    if (action === 'TODAY') {
      setCurrentDate(new Date());
    } else if (action === 'PREV') {
      const newDate = new Date(currentDate);
      if (view === 'month') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else if (view === 'week') {
        newDate.setDate(newDate.getDate() - 7);
      } else if (view === 'day') {
        newDate.setDate(newDate.getDate() - 1);
      }
      setCurrentDate(newDate);
    } else if (action === 'NEXT') {
      const newDate = new Date(currentDate);
      if (view === 'month') {
        newDate.setMonth(newDate.getMonth() + 1);
      } else if (view === 'week') {
        newDate.setDate(newDate.getDate() + 7);
      } else if (view === 'day') {
        newDate.setDate(newDate.getDate() + 1);
      } 
      setCurrentDate(newDate);
    } else if (action === 'DATE' && date) {
      setCurrentDate(date);
    }
  };
  
  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  const eventStyleGetter = (event: Event) => {
    // Default color if none is specified
    const backgroundColor = event.color || 'rgba(128, 128, 128, 0.7)';
    
    const style = {
      background: backgroundColor,
      color: '#FFFFFF',
      padding: '2px 4px',
      margin: '0 0 1px 0',
      fontSize: '0.75rem',
      lineHeight: '1.2',
      width: '100%',
      cursor: 'pointer',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '2px',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    };
    
    return { 
      style,
      className: 'hover:opacity-80 transition-all duration-200 hover:translate-y-[-1px]'
    };
  };

  const dayPropGetter = (date: Date) => {
    const today = moment().startOf('day');
    const isToday = moment(date).isSame(today, 'day');
    
    return {
      className: 'transition-colors',
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
    timeGutterHeader: 'text-center font-medium',
    timeGutterWrapper: 'font-medium text-right pr-2',
    // Month view
    monthView: 'divide-y divide-gray-200/30 dark:divide-gray-700/30',
    // Header row
    headerRow: 'bg-white/50 dark:bg-gray-800/50 border-b border-gray-200/30 dark:border-gray-700/30',
    header: 'py-2 text-sm font-medium text-gray-900 dark:text-gray-100 text-center',
    // Day cells
    dayCell: 'min-h-[100px] p-1 border-r border-gray-200/30 dark:border-gray-700/30 relative',
    // Date numbers
    dateNumber: 'text-sm text-white-900 dark:text-white-100 font-medium',
    todayNumber: 'bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200',
    // Events
    event: 'truncate w-[80%] mx-auto block',
    // Navigation buttons
    button: 'px-4 py-2 text-sm bg-emerald-600/90 text-white border-none rounded-lg hover:bg-emerald-700 transition-all duration-200 shadow-sm hover:shadow backdrop-blur-sm',
    activeButton: 'bg-white text-emerald-600 border-white hover:bg-gray-100 shadow-md font-medium',
    // Toolbar
    toolbar: 'flex justify-between items-center p-4 bg-gray-800 text-white rounded-t-lg shadow-sm',
    toolbarLabel: 'text-xl font-bold text-white',
    currentMonth: 'text-2xl font-bold text-emerald-600/90 bg-clip-text text-center',
    buttonGroup: 'flex gap-2',
    // Navigation icons
    navIcon: 'text-lg',
  };

  const components: Components<Event, object> = {
    event: EventComponent,
    toolbar: (props: ToolbarProps<Event>) => (
      <div className={calendarClasses.toolbar}>
        <div className="flex items-center justify-between w-full">
          <div className={calendarClasses.buttonGroup}>
            <button
              onClick={() => handleNavigate('TODAY')}
              className="px-4 py-2 text-sm bg-emerald-600/80 text-white font-medium rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-sm hover:shadow"
            >
              Today
            </button>
            <button
              onClick={() => handleNavigate('PREV')}
              className="p-2 rounded-full bg-emerald-600/80 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center"
            >
              <FaChevronLeft className="text-lg" />
            </button>
            <button
              onClick={() => handleNavigate('NEXT')}
              className="p-2 rounded-full bg-emerald-600/80 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center"
            >
              <FaChevronRight className="text-lg" />
            </button>
          </div>
          <div className="flex flex-col items-center">
            <span className={calendarClasses.currentMonth}>
              {formatCurrentMonth()}
            </span>
          </div>
          <div className={calendarClasses.buttonGroup}>
            <button
              onClick={() => handleViewChange('month')}
              className={twMerge(
                calendarClasses.button,
                'flex items-center gap-2',
                view === 'month' && calendarClasses.activeButton
              )}
            >
              <FaCalendarAlt className="text-lg" />
              <span className="hidden sm:inline">Month</span>
            </button>
            <button
              onClick={() => handleViewChange('week')}
              className={twMerge(
                calendarClasses.button,
                'flex items-center gap-2',
                view === 'week' && calendarClasses.activeButton
              )}
            >
              <FaCalendarWeek className="text-lg" />
              <span className="hidden sm:inline">Week</span>
            </button>
            <button
              onClick={() => handleViewChange('day')}
              className={twMerge(
                calendarClasses.button,
                'flex items-center gap-2',
                view === 'day' && calendarClasses.activeButton
              )}
            >
              <FaCalendarDay className="text-lg" />
              <span className="hidden sm:inline">Day</span>
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
    event: (props) => {
      const timeRange = props.event.allDay
        ? 'All Day'
        : `${moment(props.event.start).format('h:mm A')} - ${moment(props.event.end).format('h:mm A')}`;

      return (
        <div
          data-tooltip-id={`event-${props.event.id}`}
          className={calendarClasses.event}
        >
          {props.title}
          <Tooltip
            id={`event-${props.event.id}`}
            place="top"
            className="max-w-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg rounded-lg border border-gray-200 dark:border-gray-700"
            render={() => (
              <div className="p-2">
                <p className="font-bold">{props.title}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{timeRange}</p>
                {props.event.category && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">{props.event.category}</p>
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
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={twMerge("h-full w-full", className)}
    >
      <div className="calendar-modernized h-full">
      <style jsx global>{`
          /* Time gutter styling */
          .rbc-time-gutter .rbc-timeslot-group .rbc-time-slot,
          .rbc-time-gutter .rbc-label {
            font-weight: 600;
            color: ${theme === 'dark' ? '#ffffff' : '#ffffff'};
            font-size: 0.9rem;
            text-align: center;
            background-color: #212936; /* Green background for time cells */
          }
          
          /* Time header styling */
          .rbc-time-header-gutter {
            font-weight: 600;
            background-color: #212936;
            color: white;
          }

        `}</style>
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
          date={currentDate}
          view={view}
          onView={handleViewChange}
          onNavigate={handleNavigate}
          views={{
            month: true,
            week: true,
            day: true
          }}
          formats={{
            timeGutterFormat: (date: Date) => moment(date).format('h:mm A'),
            dayFormat: (date: Date) => moment(date).format('ddd D'),
            eventTimeRangeFormat: ({ start, end }: { start: Date, end: Date }) => {
              return `${moment(start).format('h:mm A')} - ${moment(end).format('h:mm A')}`;
            }
          }}
        />
      </div>
    </motion.div>
  );
}
