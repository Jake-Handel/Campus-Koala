import { Event as BigCalendarEvent } from 'react-big-calendar';

export interface Event extends Omit<BigCalendarEvent, 'title' | 'start' | 'end'> {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  category?: string;
  color?: string;
  description?: string;
  className?: string;
  allDay?: boolean;
  resource?: any;
}
