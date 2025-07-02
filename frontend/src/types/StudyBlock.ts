// types/StudyBlock.ts
export interface StudyBlock {
    id: string;
    taskId: number;
    taskTitle: string;
    duration: number;  // in minutes
    startTime: string;  // ISO string
    breakDuration: number;  // in minutes
    status: 'pending' | 'in_progress' | 'completed';
    createdAt: string;
    updatedAt: string;
}
