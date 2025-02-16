// types/Task.ts
export interface Task {
    id: number;
    title: string;
    description?: string;
    priority: number;  // 1=Low, 2=Medium, 3=High
    completed: boolean;
    due_date?: string;
    created_at: string;
    updated_at: string;
}