'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/types/Task';

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  console.log('Current tasks:', tasks);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchTasks();
  }, [router]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched tasks:', data);
        setTasks(Array.isArray(data) ? data : []);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        const errorData = await response.json();
        console.error('Error fetching tasks:', errorData.error);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Campus Koala</h1>
          <p className="text-xl text-gray-600">Your personal study management assistant</p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Tasks</h3>
            <p className="text-3xl font-bold text-primary">
              {isLoading ? (
                <span className="text-gray-400">...</span>
              ) : (
                tasks.filter(t => !t.completed).length
              )}
            </p>
            <p className="text-sm text-gray-600">Active Tasks</p>
          </div>
          <div className="card p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Total Tasks</h3>
            <p className="text-3xl font-bold text-primary">
              {isLoading ? (
                <span className="text-gray-400">...</span>
              ) : (
                tasks.length
              )}
            </p>
            <p className="text-sm text-gray-600">Overall</p>
          </div>
          <div className="card p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Completed</h3>
            <p className="text-3xl font-bold text-primary">
              {isLoading ? (
                <span className="text-gray-400">...</span>
              ) : (
                tasks.filter(t => t.completed).length
              )}
            </p>
            <p className="text-sm text-gray-600">Tasks Done</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-6">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button onClick={() => router.push('/tasks')} className="btn btn-primary w-full">Create New Task</button>
              <button onClick={() => router.push('/study-timer')} className="btn btn-secondary w-full">Start Study Session</button>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="card p-6">
            <h3 className="text-xl font-semibold mb-4">Recent Activities</h3>
            <div className="space-y-3">
              {isLoading ? (
                <p className="text-sm text-gray-600">Loading tasks...</p>
              ) : tasks && tasks.length > 0 ? (
                [...tasks].sort((a, b) => {
                  // First sort by priority (higher number = higher priority)
                  if (b.priority !== a.priority) {
                    return b.priority - a.priority;
                  }
                  // Then sort by due date if both have due dates
                  if (a.due_date && b.due_date) {
                    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                  }
                  // Put tasks with due dates before tasks without
                  if (a.due_date) return -1;
                  if (b.due_date) return 1;
                  return 0;
                })
                .slice(0, 3) // Only show top 3 most important tasks
                .map((task) => (
                  <div key={task.id} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${task.completed ? 'bg-green-500' : 'bg-blue-500'}`} />
                    <p className="text-sm text-gray-600">
                      {task.title}
                      <span className={`ml-2 ${task.completed 
                        ? 'text-green-500' 
                        : task.priority === 3 
                          ? 'text-red-500 font-medium' 
                          : task.priority === 2 
                            ? 'text-yellow-500 font-medium' 
                            : 'text-blue-400'}`}
                      >
                        {task.completed 
                          ? '(Completed)' 
                          : `(${task.priority === 1 ? 'Low' : task.priority === 2 ? 'Medium' : 'High'} Priority)`
                        }
                      </span>
                      {task.due_date && (
                        <span className="text-gray-400 ml-2">
                          Due: {new Date(task.due_date).toLocaleDateString('en-US', { 
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No tasks yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}