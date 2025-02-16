'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/types/Task';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiCheckSquare, FiCalendar, FiCircle, FiCheckCircle } from 'react-icons/fi';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    description: '', 
    due_date: '', 
    priority: 1 
  });
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
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(newTask),
      });

      const responseText = await response.text();

      if (response.ok) {
        const result = responseText ? JSON.parse(responseText) : {};

        setIsAddingTask(false);
        setNewTask({ title: '', description: '', due_date: '', priority: 1 });
        await fetchTasks();
      } else {
        const errorData = responseText ? JSON.parse(responseText) : {};
        const errorMessage = errorData.error || 'Failed to add task';

        alert(errorMessage);
      }
    } catch (error) {
      alert('Failed to add task. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {

    }
  };

  const handleToggleComplete = async (taskId: number, completed: boolean) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ completed: !completed }),
      });
      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {

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
                {isLoading ? (
                  "Loading..."
                ) : tasks ? (
                  `${tasks.filter(t => t.completed).length} of ${tasks.length} completed`
                ) : (
                  "0 of 0 completed"
                )}
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
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <FiCalendar className="text-gray-400" />
                    <input
                      type="date"
                      className="flex-1 p-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Priority:</span>
                    <select
                      className="p-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: parseInt(e.target.value) })}
                    >
                      <option value={1}>Low</option>
                      <option value={2}>Medium</option>
                      <option value={3}>High</option>
                    </select>
                  </div>
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
              className={`group rounded-xl shadow-sm p-5 transition-all duration-300 ease-in-out transform
                         ${task.completed 
                           ? 'bg-green-50 border border-green-200 hover:bg-green-50/80 hover:scale-[0.99]' 
                           : task.priority === 3
                           ? 'bg-red-50/70 border border-red-100 hover:bg-white hover:shadow-md hover:scale-[1.01]'
                           : task.priority === 2
                           ? 'bg-yellow-50/70 border border-yellow-100 hover:bg-white hover:shadow-md hover:scale-[1.01]'
                           : 'bg-gray-50/70 border border-gray-100 hover:bg-white hover:shadow-md hover:scale-[1.01]'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleComplete(task.id, task.completed)}
                    className={`p-2 rounded-full transition-all duration-300 ease-in-out transform
                      ${task.completed 
                        ? 'text-green-600 hover:bg-green-100 hover:scale-110 hover:rotate-12' 
                        : 'text-gray-400 hover:text-green-600 hover:bg-gray-100 hover:scale-110'}`}
                    title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {task.completed ? (
                      <FiCheckCircle className="h-5 w-5" />
                    ) : (
                      <FiCircle className="h-5 w-5" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-medium transition-all duration-300 ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className={`mt-1 text-sm ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                        {task.description}
                      </p>
                    )}
                    {task.due_date && (
                      <div className={`mt-2 flex items-center text-sm ${task.completed ? 'text-gray-400' : 'text-gray-500'}`}>
                        <FiCalendar className="mr-1.5 h-4 w-4" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-all duration-300 ease-in-out transform hover:scale-110 hover:rotate-12"
                  title="Delete task"
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
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