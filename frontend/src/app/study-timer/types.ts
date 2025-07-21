export interface StudySession {
    id: string;
    subject: string;
    duration: number;
    break_duration?: number;
    type: 'study' | 'break';
    isCurrent?: boolean;
    completed: boolean;
    completed_at?: Date;
    created_at: Date;
    updated_at?: Date;
    startTime?: Date;
    end_time?: Date;
    notes?: string;
    user_id?: number;
    metadata?: Record<string, any>;
  }
  
  export interface DayPlanItem {
    id: string;
    subject: string;
    duration: number;
    break_duration: number;
    type: 'study' | 'break';
    completed?: boolean;
  }