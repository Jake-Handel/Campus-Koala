'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/types/Task';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiCheckSquare } from 'react-icons/fi';

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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col items-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              To-Do List
            </h1>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-6">
              <div className="flex items-center bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
                <FiCheckSquare className="h-4 w-4 text-blue-500 mr-1.5" />
                <span>
                  {tasks.filter(t => t.completed).length} of {tasks.length} completed
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsAddingTask(true)}
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
            >
              <FiPlus className="-ml-1 mr-2 h-5 w-5" />
              New Task
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4">

        {isAddingTask && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Task title"
                className="w-full p-2 border rounded-md"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
              <textarea
                placeholder="Task description"
                className="w-full p-2 border rounded-md"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
              <input
                type="date"
                className="w-full p-2 border rounded-md"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsAddingTask(false)}
                  className="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTask}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Task
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden
                ${task.completed ? 'bg-opacity-75' : ''}`}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className={`text-lg font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className={`mt-1 text-sm ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleToggleComplete(task.id, task.completed)}
                      className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-200
                        ${task.completed ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`}
                      title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      <FiCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition-colors duration-200"
                      title="Delete task"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center text-gray-500">
                    {task.due_date ? (
                      <span>
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">No due date</span>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium
                      ${task.completed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                      }`}
                  >
                    {task.completed ? 'Done' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
  );
}