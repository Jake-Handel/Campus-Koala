'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import 'react-tooltip/dist/react-tooltip.css';
import { Tooltip } from 'react-tooltip';
import { motion } from 'framer-motion';
import moment from 'moment';
import dynamic from 'next/dynamic';
import type { View, ToolbarProps, Components, Calendar as BigCalendar } from 'react-big-calendar';
import { momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaCalendarAlt, FaCalendarWeek, FaCalendarDay, FaListUl, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Event } from './types';
import { twMerge } from 'tailwind-merge';

const Calendar = dynamic<BigCalendar<Event, object>>(
  async () => {
    const { Calendar } = await import('react-big-calendar');
    return Calendar;
  },
  { ssr: false }
);

const EventComponent = ({ event, onSelectEvent }: { event: Event, onSelectEvent: (event: Event) => void }) => {
  const timeRange = event.allDay 
    ? 'All Day'
    : `${moment(event.start).format('h:mm A')} - ${moment(event.end).format('h:mm A')}`;

  // Special handling for Todo events
  const isTodoEvent = event.category === 'Todo';
  const tooltipContent = isTodoEvent 
    ? `Task Due: ${moment(event.start).format('h:mm A')}${event.description ? ` - ${event.description}` : ''}` 
    : timeRange;
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
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Format the current month and year
  const formatCurrentMonth = () => {
    return (
      <span className={isDarkMode ? 'text-white' : 'text-indigo-700'}>
        {moment(currentDate).format('MMMM YYYY')}
      </span>
    );
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
    const backgroundColor = event.color;
    
    const style = {
      background: backgroundColor,
      color: '#333333',
      padding: '6px 12px',
      margin: 'auto 0 4px 0',
      fontSize: '0.9rem',
      lineHeight: '1.4',
      width: '80%',
      maxWidth: '100%',
      cursor: 'pointer',
      border: 'none',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    };
    
    return { 
      style,
      className: 'hover:opacity-90 transition-all duration-200 hover:translate-y-[-1px]'
    };
  };

  const dayPropGetter = (date: Date) => {
    const today = moment().startOf('day');
    const isToday = moment(date).isSame(today, 'day');
    
    return {
      className: 'transition-colors',
      style: {
        backgroundColor: isToday 
          ? isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#ffffff'
          : 'transparent',
        color: isDarkMode ? '#e5e7eb' : '#1f2937'
      }
    };
  };

  const calendarClasses = {
    // Calendar container
    wrapper: 'h-full flex flex-col',
    container: isDarkMode 
      ? 'bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg shadow-lg' 
      : 'bg-gradient-to-br from-purple-700 to-indigo-700 p-4 rounded-lg shadow-lg',
    timeGutterHeader: isDarkMode 
      ? 'text-center font-semibold text-gray-200' 
      : 'text-center font-semibold text-white',
    timeGutterWrapper: isDarkMode 
      ? 'font-medium text-right pr-2 text-gray-300' 
      : 'font-medium text-right pr-2 text-white',
    // Month view
    monthView: isDarkMode 
      ? 'divide-y divide-gray-700' 
      : 'divide-y divide-white/40',
    // Header row
    headerRow: isDarkMode 
      ? 'bg-gray-800 border-b border-gray-700' 
      : 'bg-white/30 border-b border-white/40',
    header: isDarkMode 
      ? 'py-2 text-sm font-semibold text-gray-300 text-center' 
      : 'py-2 text-sm font-semibold text-indigo-700 text-center',
    // Day cells
    dayCell: isDarkMode 
      ? 'min-h-[100px] p-2 border-r border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 transition-colors duration-200' 
      : 'min-h-[100px] p-2 border-r border-white/40 hover:bg-white/20 transition-colors duration-200',
    // Date numbers
    dateNumber: isDarkMode 
      ? 'text-sm text-gray-300 font-semibold' 
      : 'text-sm text-gray-700 font-semibold',
    todayNumber: isDarkMode 
      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200' 
      : 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200',
    // Navigation buttons
    button: isDarkMode 
      ? 'px-4 py-2 text-sm bg-gray-700 text-white border-none rounded-lg hover:bg-gray-600 transition-all duration-200 shadow-md hover:shadow-lg' 
      : 'px-4 py-2 text-sm bg-gradient-to-r from-purple-700 to-indigo-700 text-white border-none rounded-lg hover:from-purple-800 hover:to-indigo-800 transition-all duration-200 shadow-md hover:shadow-lg',
    activeButton: isDarkMode 
      ? 'bg-white/10 text-white border-gray-600 hover:bg-white/20 shadow-md font-semibold' 
      : 'bg-white text-indigo-700 border-white hover:bg-gray-100 shadow-md font-semibold',
    // Toolbar
    toolbar: isDarkMode 
      ? 'flex justify-between items-center p-4 text-white rounded-t-lg shadow-md bg-gray-800' 
      : 'flex justify-between items-center p-4 text-indigo-700 rounded-t-lg shadow-md bg-white/30',
    toolbarLabel: isDarkMode 
      ? 'text-xl font-bold text-white' 
      : 'text-xl font-bold text-indigo-700',
    currentMonth: isDarkMode 
      ? 'text-2xl font-bold text-white' 
      : 'text-2xl font-bold text-indigo-700',
    buttonGroup: 'flex gap-4',
    // Navigation icons
    navIcon: isDarkMode 
      ? 'text-lg text-white' 
      : 'text-lg text-indigo-700',
  };

  const components: Components<Event, object> = {
    event: EventComponent,
    toolbar: (props: ToolbarProps<Event>) => (
      <div className={calendarClasses.toolbar}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div className={calendarClasses.buttonGroup}>
              <button
                onClick={() => handleNavigate('TODAY')}
                className="px-4 py-2 text-sm bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-medium rounded-lg hover:from-purple-800 hover:to-indigo-800 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Today
              </button>
              <button
                onClick={() => handleNavigate('PREV')}
                className="p-2 rounded-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white hover:from-purple-800 hover:to-indigo-800 transition-colors flex items-center justify-center"
              >
                <FaChevronLeft className="text-lg" />
              </button>
              <button
                onClick={() => handleNavigate('NEXT')}
                className="p-2 rounded-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white hover:from-purple-800 hover:to-indigo-800 transition-colors flex items-center justify-center"
              >
                <FaChevronRight className="text-lg" />
              </button>
            </div>
            <div className="flex items-center">
              <span className={calendarClasses.currentMonth}>
                {formatCurrentMonth()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('month')}
              className={twMerge(
                'px-4 py-2 text-sm rounded-lg transition-all duration-200',
                view === 'month' ? 'bg-white text-indigo-700 border-white hover:bg-gray-100 shadow-md font-semibold' : 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white hover:from-purple-800 hover:to-indigo-800'
              )}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={twMerge(
                'px-4 py-2 text-sm rounded-lg transition-all duration-200',
                view === 'week' ? 'bg-white text-indigo-700 border-white hover:bg-gray-100 shadow-md font-semibold' : 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white hover:from-purple-800 hover:to-indigo-800'
              )}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={twMerge(
                'px-4 py-2 text-sm rounded-lg transition-all duration-200',
                view === 'day' ? 'bg-white text-indigo-700 border-white hover:bg-gray-100 shadow-md font-semibold' : 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white hover:from-purple-800 hover:to-indigo-800'
              )}
            >
              Day
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
        <div className="flex">
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
      const event = props.event;
      const timeRange = event.allDay
        ? 'All Day'
        : `${moment(event.start).format('h:mm A')} - ${moment(event.end).format('h:mm A')}`;
      
      const eventColor = event.color || '#3B82F6';
      
      // Function to determine if a color is light or dark
      const isLightColor = (color: string) => {
        try {
          // Handle 3-digit hex colors
          const hex = color.length === 4 ? 
            `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}` : 
            color;
            
          // Convert hex to RGB
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          // Calculate luminance
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          return luminance > 0.7;
        } catch (e) {
          // Default to dark text if color parsing fails
          return false;
        }
      };
      
      const textColor = isLightColor(eventColor) ? '#111827' : '#FFFFFF';
      
      return (
        <div
          className="relative px-2 py-1.5 text-xs font-medium rounded-md transition-all duration-20 hover:scale-[1.02] hover:translate-y-[-1px]"
          style={{ 
            borderLeft: `3px solid ${textColor}80`,
            color: textColor,
            minWidth: '120px'
          }}
          onClick={() => onSelectEvent?.(event)}
          title={[
            event.title,
            timeRange,
            ...(event.category ? [event.category] : []),
            ...(event.location ? [`📍 ${event.location}`] : []),
            ...(event.description ? [event.description] : [])
          ].filter(Boolean).join('\n')}
        >
          <div className="flex items-center">
            <span className="truncate">{event.title}</span>
          </div>
        </div>
      );
    }
  };

  // Define view types and timeslot settings
  type CalendarView = 'month' | 'week' | 'day';
  
  interface TimeslotSettings {
    month: { timeslots: number; step: number };
    week: { timeslots: number; step: number };
    day: { timeslots: number; step: number };
    [key: string]: { timeslots: number; step: number };
  }

  // Calculate timeslot settings based on view
  const timeslotSettings: TimeslotSettings = {
    month: {
      timeslots: 2,
      step: 30
    },
    week: {
      timeslots: 1,
      step: 60
    },
    day: {
      timeslots: 1,
      step: 60
    },
    work_week: {
      timeslots: 1,
      step: 60
    },
    agenda: {
      timeslots: 1,
      step: 60
    }
  };

  // Ensure we have a valid view
  const currentView = (['month', 'week', 'day', 'work_week', 'agenda'].includes(view) 
    ? view 
    : 'week') as CalendarView;
    
  const currentViewSettings = timeslotSettings[currentView];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={twMerge("h-full w-full", className, isDarkMode ? 'dark' : '')}
    >
      <div className={`calendar-modernized h-full ${isDarkMode ? 'rbc-theme-dark' : ''}`}>
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
          view={currentView}
          onView={(newView: View) => handleViewChange(newView)}
          onNavigate={handleNavigate}
          views={{
            month: true,
            week: true,
            day: true
          }}
          timeslots={currentViewSettings.timeslots}
          step={currentViewSettings.step}
          min={new Date(0, 0, 0, 0, 0, 0)}  // 12:00 AM
          max={new Date(0, 0, 0, 23, 59, 59)}  // 11:59 PM
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
