'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/types/Task';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiCheckSquare, FiCalendar } from 'react-icons/fi';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '' });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchTasks();
  }, [router]);

  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleAddTask = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newTask),
      });
      if (response.ok) {
        setIsAddingTask(false);
        setNewTask({ title: '', description: '', due_date: '' });
        fetchTasks();
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleToggleComplete = async (taskId: number, completed: boolean) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ completed: !completed }),
      });
      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="bg-white shadow-lg rounded-3xl p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            To-Do List
          </h1>
          <p className="mt-2 text-gray-600">
            Organize your tasks and boost your productivity
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
              <span className="text-sm text-gray-600">
                {tasks.filter(t => t.completed).length} of {tasks.length} completed
              </span>
            </div>
            <button
              onClick={() => setIsAddingTask(true)}
              className="btn btn-primary rounded-full flex items-center gap-2 px-6"
            >
              <FiPlus className="h-5 w-5" />
              New Task
            </button>
          </div>
        </div>

        {/* Add Task Form */}
        {isAddingTask && (
          <div className="mb-8">
            <div className="bg-gray-50/70 rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Task title"
                  className="w-full p-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
                <textarea
                  placeholder="Task description (optional)"
                  className="w-full p-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-gray-400" />
                  <input
                    type="date"
                    className="flex-1 p-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsAddingTask(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTask}
                    className="btn btn-primary px-6"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="grid gap-4 sm:grid-cols-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`group bg-gray-50/70 rounded-xl shadow-sm border border-gray-100 p-5 
                         hover:bg-white hover:shadow-md transition-all duration-200 
                         ${task.completed ? 'bg-opacity-75' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className={`mt-1 text-sm ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                      {task.description}
                    </p>
                  )}
                  {task.due_date && (
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <FiCalendar className="mr-1.5 h-4 w-4" />
                      {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleComplete(task.id, task.completed)}
                    className={`p-2 rounded-full hover:bg-gray-50
                      ${task.completed ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`}
                  >
                    <FiCheck className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-50"
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {tasks.length === 0 && !isAddingTask && (
          <div className="text-center py-12 bg-gray-50/70 rounded-xl shadow-sm border border-gray-100">
            <FiCheckSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No tasks yet</h3>
            <p className="mt-2 text-sm text-gray-600">
              Get started by creating your first task
            </p>
          </div>
        )}
      </div>
    </div>
  );
}