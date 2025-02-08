// types/Task.ts
export interface Task {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  priority: number;
  calendar_event_id?: number;
}