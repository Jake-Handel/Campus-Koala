'use client';

import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
}

interface CalendarComponentProps {
  events: Event[];
  onSelectEvent: (event: Event) => void;
}

export default function CalendarComponent({ events, onSelectEvent }: CalendarComponentProps) {
  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: '100%' }}
      views={['month', 'week', 'day']}
      defaultView="month"
      onSelectEvent={onSelectEvent}
    />
  );
}
