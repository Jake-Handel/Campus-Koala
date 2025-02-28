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

  return (
    <div
      data-tooltip-id="event-tooltip"
      data-tooltip-content={timeRange}
      className="cursor-pointer"
    >
      <span className="font-medium text-xs">{event.title}</span>
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
    const style = {
      background: event.color,
      color: '#FFFFFF',
      padding: '2px 4px',
      margin: '0 0 1px 0',
      fontSize: '0.75rem',
      lineHeight: '1.2',
      width: '100%',
      cursor: 'pointer',
      border: 'none',
      borderRadius: '0',
      boxShadow: 'none',
    };
    return { 
      style,
      className: 'hover:opacity-80 transition-opacity duration-200'
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
    button: 'px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 rounded-lg hover:bg-white dark:hover:bg-gray-700/50 transition-all duration-200 shadow-sm hover:shadow backdrop-blur-sm',
    activeButton: 'bg-primary text-primary-foreground border-primary hover:bg-primary/90 dark:hover:bg-primary/90 shadow-md',
    // Toolbar
    toolbar: 'flex justify-between items-center p-4 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm shadow-sm',
    toolbarLabel: 'text-xl font-bold text-gray-800 dark:text-white',
    currentMonth: 'text-2xl font-bold text-emerald-600 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-400',
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
              className={twMerge(calendarClasses.button, "hover:bg-emerald-50 dark:hover:bg-emerald-900/20")}
            >
              Today
            </button>
            <button
              onClick={() => handleNavigate('PREV')}
              className={twMerge(calendarClasses.button, "hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-1")}
            >
              <FaChevronLeft className={calendarClasses.navIcon} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <button
              onClick={() => handleNavigate('NEXT')}
              className={twMerge(calendarClasses.button, "hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-1")}
            >
              <span className="hidden sm:inline">Next</span>
              <FaChevronRight className={calendarClasses.navIcon} />
            </button>
          </div>
          <div className="flex flex-col items-center">
            <span className={calendarClasses.currentMonth}>
              {formatCurrentMonth()}
            </span>
            <span className={calendarClasses.toolbarLabel}>
              {view.charAt(0).toUpperCase() + view.slice(1)} View
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
          /* Global styles for the calendar to make it more modern */
          .calendar-modernized .rbc-calendar {
            font-family: inherit;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            background: ${theme === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.7)'};
            backdrop-filter: blur(8px);
          }
          
          /* Header styling */
          .calendar-modernized .rbc-header {
            padding: 12px 0;
            font-weight: 600;
            color: ${theme === 'dark' ? '#e2e8f0' : '#334155'};
            background: ${theme === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(248, 250, 252, 0.8)'};
          }
          
          /* Time columns in week/day view */
          .calendar-modernized .rbc-time-view .rbc-time-header,
          .calendar-modernized .rbc-time-view .rbc-time-content {
            border-color: ${theme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'};
          }
          
          /* Time labels in week/day view */
          .calendar-modernized .rbc-time-view .rbc-time-gutter {
            font-weight: 500;
            color: ${theme === 'dark' ? '#94a3b8' : '#64748b'};
            padding-right: 10px;
            text-align: right;
            font-size: 0.85rem;
          }
          
          /* Cells */
          .calendar-modernized .rbc-month-view .rbc-day-bg {
            transition: background-color 0.2s;
          }
          
          /* Hover effect on day cells */
          .calendar-modernized .rbc-month-view .rbc-day-bg:hover {
            background-color: ${theme === 'dark' ? 'rgba(51, 65, 85, 0.3)' : 'rgba(241, 245, 249, 0.8)'};
          }
          
          /* Today's cell */
          .calendar-modernized .rbc-month-view .rbc-day-bg.rbc-today {
            background-color: ${theme === 'dark' ? 'rgba(20, 184, 166, 0.15)' : 'rgba(20, 184, 166, 0.08)'};
          }
          
          /* Event styling */
          .calendar-modernized .rbc-event {
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            font-size: 0.85rem;
          }
          
          /* Agenda view improvements */
          .calendar-modernized .rbc-agenda-view table.rbc-agenda-table {
            border-radius: 8px;
            overflow: hidden;
            color: ${theme === 'dark' ? '#e2e8f0' : '#334155'};
          }
          
          .calendar-modernized .rbc-agenda-view table.rbc-agenda-table thead {
            background-color: ${theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.9)'};
            color: ${theme === 'dark' ? '#e2e8f0' : '#334155'};
          }
          
          .calendar-modernized .rbc-agenda-view table.rbc-agenda-table tbody > tr > td {
            padding: 10px;
            border-color: ${theme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'};
          }
          
          .calendar-modernized .rbc-agenda-view table.rbc-agenda-table tbody > tr:hover {
            background-color: ${theme === 'dark' ? 'rgba(51, 65, 85, 0.3)' : 'rgba(241, 245, 249, 0.8)'};
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
        />
      </div>
    </motion.div>
  );
}
