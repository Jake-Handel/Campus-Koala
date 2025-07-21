'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Task } from '@/types/Task';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiCheckSquare, FiCalendar, FiCircle, FiCheckCircle, FiList, FiAlertCircle, FiChevronDown } from 'react-icons/fi';

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
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
        setTasks(Array.isArray(data) ? data : []);
      } else if (response.status === 401) {
        // Token expired or invalid
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

      // Create a clean task object for submission
      const taskToSubmit = {
        title: newTask.title.trim(),
        description: newTask.description?.trim() || '',
        priority: newTask.priority,
        // Only include due_date if it's not empty
        ...(newTask.due_date ? { due_date: newTask.due_date } : {})
      };

      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(taskToSubmit),
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
        await fetchTasks();
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete task');
      }
    } catch (error) {
      alert('Failed to delete task. Please try again.');
    }
  };

  const handleUpdateTask = async (task: Task) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Create a clean task object for update
      const taskToUpdate = {
        title: task.title.trim(),
        description: task.description?.trim() || '',
        priority: task.priority,
        completed: task.completed,
        // Only include due_date if it's not empty
        ...(task.due_date ? { due_date: task.due_date } : { due_date: null })
      };

      const response = await fetch(`http://localhost:5000/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(taskToUpdate),
      });

      const data = await response.text();
      const responseData = data ? JSON.parse(data) : {};

      if (response.ok) {
        await fetchTasks();
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        console.error('Failed to update task:', responseData.error);
        alert(responseData.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task. Please try again.');
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
        await fetchTasks();
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update task');
      }
    } catch (error) {
      alert('Failed to update task. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen py-8 transition-colors duration-200 ${isDark ? 'bg-gray-900' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="space-y-6">
          {/* Main Content */}
          <div className={`${isDark ? 'bg-gray-800/80 border border-gray-700/50' : 'bg-white'} shadow-lg rounded-3xl p-8 transition-colors duration-200`}>
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                To-Do List
              </h1>
              <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-200`}>
                Organize your tasks and boost your productivity
              </p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-3">
              <div className={`${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200'} px-4 py-2 rounded-full shadow-sm border transition-colors duration-200`}>
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} transition-colors`}>
                  {isLoading ? (
                    "Loading..."
                  ) : tasks ? (
                    `${tasks.filter(t => t.completed).length} of ${tasks.length} completed`
                  ) : (
                    "0 of 0 completed"
                  )}
                </span>
              </div>
              <div className={`h-2 w-32 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden transition-colors duration-200`}>
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
                  style={{
                    width: `${tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
            <button
              onClick={() => setIsAddingTask(true)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all duration-200 ${
                isDark 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-blue-500/20' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg'
              }`}
            >
              <FiPlus className="h-5 w-5" />
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`rounded-2xl p-6 transition-all duration-200 ${isDark ? 'bg-gray-800/80 border border-gray-700/50' : 'bg-white border border-gray-100 shadow-sm'} hover:shadow-md hover:-translate-y-0.5`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Total Tasks</h3>
            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700/50 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <FiList className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mt-2`}>
            {tasks.length}
          </p>
          <div className={`mt-3 h-1.5 w-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full overflow-hidden`}>
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div className={`rounded-2xl p-6 transition-all duration-200 ${isDark ? 'bg-gray-800/80 border border-gray-700/50' : 'bg-white border border-gray-100 shadow-sm'} hover:shadow-md hover:-translate-y-0.5`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Active Tasks</h3>
            <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
              <FiAlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-4xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'} mt-2`}>
            {tasks.filter(t => !t.completed).length}
          </p>
          <div className={`mt-3 h-1.5 w-full ${isDark ? 'bg-gray-700' : 'bg-amber-100'} rounded-full overflow-hidden`}>
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
              style={{ width: `${tasks.length > 0 ? (tasks.filter(t => !t.completed).length / tasks.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className={`rounded-2xl p-6 transition-all duration-200 ${isDark ? 'bg-gray-800/80 border border-gray-700/50' : 'bg-white border border-gray-100 shadow-sm'} hover:shadow-md hover:-translate-y-0.5`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Completed</h3>
            <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
              <FiCheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-4xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'} mt-2`}>
            {tasks.filter(t => t.completed).length}
          </p>
          <div className={`mt-3 h-1.5 w-full ${isDark ? 'bg-gray-700' : 'bg-emerald-100'} rounded-full overflow-hidden`}>
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
              style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>


        {/* Add Task Form */}
        {isAddingTask && (
          <div className="mb-8 transition-all duration-300">
            <div className={`rounded-2xl p-6 transition-all duration-200 ${isDark ? 'bg-gray-800/80 border border-gray-700/50' : 'bg-white border border-gray-100 shadow-sm'}`}>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Task title"
                  className={`w-full p-3 rounded-lg border-0 focus:ring-2 focus:ring-primary/50 transition-all duration-200 ${
                    isDark 
                      ? 'bg-gray-700/50 text-white placeholder-gray-400 focus:bg-gray-700' 
                      : 'bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white'
                  }`}
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
                <textarea
                  placeholder="Task description (optional)"
                  className={`w-full p-3 rounded-lg border-0 focus:ring-2 focus:ring-primary/50 transition-all duration-200 ${
                    isDark 
                      ? 'bg-gray-700/50 text-white placeholder-gray-400 focus:bg-gray-700' 
                      : 'bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:bg-white'
                  }`}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <FiCalendar className="text-gray-400" />
                    <input
                      type="date"
                      className={`flex-1 p-3 rounded-lg border-0 focus:ring-2 focus:ring-primary/50 transition-all duration-200 ${
                    isDark 
                      ? 'bg-gray-700/50 text-white focus:bg-gray-700' 
                      : 'bg-gray-50/50 text-gray-900 focus:bg-white'
                  }`}
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Priority:</span>
                    <select
                      className={`p-3 rounded-lg border-0 focus:ring-2 focus:ring-primary/50 transition-all duration-200 ${
                    isDark 
                      ? 'bg-gray-700/50 text-white focus:bg-gray-700' 
                      : 'bg-gray-50/50 text-gray-600 focus:bg-white'
                  }`}
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
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                      isDark 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-blue-500/30' 
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md hover:shadow-lg'
                    }`}
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
          {[...tasks].sort((a, b) => {
            // Tasks
            if (a.completed !== b.completed) {
              return a.completed ? -1 : 1;
            }
            // Priority
            if (b.priority !== a.priority) {
              return b.priority - a.priority;
            }
            // Due Date
            if (a.due_date && b.due_date) {
              return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            }
            // Due date over no due dates
            if (a.due_date) return -1;
            if (b.due_date) return 1;
            return 0;
          }).map((task) => (
            <div
              key={task.id}
              className={`group rounded-xl shadow-sm p-5 transition-all duration-300 ease-in-out transform
                         ${task.completed 
                           ? isDark
                             ? 'bg-green-900/20 border-green-800/50 hover:bg-green-900/30 hover:border-green-700/70 hover:scale-[0.99]'
                             : 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300 hover:scale-[0.99]'
                           : task.priority === 3
                           ? isDark
                             ? 'bg-red-900/20 border-red-800/30 hover:bg-red-900/30 hover:border-red-700/50 hover:scale-[1.01]'
                             : 'bg-red-200/70 border-red-100 hover:bg-red-100 hover:border-red-200 hover:scale-[1.01]'
                           : task.priority === 2
                           ? isDark
                             ? 'bg-yellow-900/20 border-yellow-800/30 hover:bg-yellow-900/30 hover:border-yellow-700/50 hover:scale-[1.01]'
                             : 'bg-yellow-200/70 border-yellow-100 hover:bg-yellow-100 hover:border-yellow-200 hover:scale-[1.01]'
                           : isDark
                             ? 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-700/50 hover:border-gray-600/70 hover:scale-[1.01]'
                             : 'bg-gray-200/70 border-gray-200 hover:bg-gray-200 hover:border-gray-200 hover:scale-[1.01]'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleComplete(task.id, task.completed)}
                    className={`p-2 rounded-full transition-all duration-300 ease-in-out transform
                      ${task.completed 
                        ? isDark
                          ? 'text-green-400 hover:bg-green-900/50 hover:scale-110 hover:rotate-12'
                          : 'text-green-600 hover:bg-green-100 hover:scale-110 hover:rotate-12'
                        : isDark
                          ? 'text-gray-500 hover:text-green-400 hover:bg-gray-700/50 hover:scale-110'
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
                    <h3 className={`text-lg font-medium transition-all duration-300 ${
                      task.completed 
                        ? isDark 
                          ? 'line-through text-gray-500' 
                          : 'line-through text-gray-400' 
                        : isDark 
                          ? 'text-gray-200' 
                          : 'text-gray-700'
                    }`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className={`mt-1 text-sm ${
                        task.completed 
                          ? isDark ? 'text-gray-500' : 'text-gray-400' 
                          : isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {task.description}
                      </p>
                    )}
                    {task.due_date && (
                      <div className={`mt-2 flex items-center text-sm ${
                        task.completed 
                          ? isDark ? 'text-gray-500' : 'text-gray-400' 
                          : isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        <FiCalendar className="mr-1.5 h-4 w-4" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingTask(task)}
                    className={`p-2 rounded-full transition-all duration-300 ease-in-out transform hover:scale-110 ${
                      isDark
                        ? 'text-gray-500 hover:text-blue-400 hover:bg-gray-700/50'
                        : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100'
                    }`}
                    title="Edit task"
                  >
                    <FiEdit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className={`p-2 rounded-full transition-all duration-300 ease-in-out transform hover:scale-110 hover:rotate-12 ${
                      isDark
                        ? 'text-gray-500 hover:text-red-400 hover:bg-gray-700/50'
                        : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'
                    }`}
                    title="Delete task"
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Task Modal */}
        {editingTask && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div 
              className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 transform ${
                isDark 
                  ? 'bg-gray-800 border border-gray-700/80 text-gray-100' 
                  : 'bg-white border border-gray-200 text-gray-900 shadow-xl'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={`px-6 pt-6 pb-4 border-b ${
                isDark ? 'border-gray-700/50' : 'border-gray-100'
              }`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                    Edit Task
                  </h2>
                  <button
                    onClick={() => setEditingTask(null)}
                    className={`p-1.5 rounded-full transition-colors ${
                      isDark 
                        ? 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200' 
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    }`}
                    aria-label="Close"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
                <p className={`mt-1 text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Update your task details below
                </p>
              </div>
              {/* Modal Body */}
              <div className="p-6 space-y-5">
                <div className="space-y-1">
                  <label htmlFor="task-title" className={`block text-sm font-medium ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Task Title
                  </label>
                  <input
                    id="task-title"
                    type="text"
                    placeholder="Enter task title"
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/50 transition-all duration-200 ${
                      isDark 
                        ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-500 focus:bg-gray-700 focus:border-blue-500/50' 
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:bg-white'
                    }`}
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="task-description" className={`block text-sm font-medium ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Description <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    id="task-description"
                    placeholder="Add a description..."
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/50 transition-all duration-200 ${
                      isDark 
                        ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-500 focus:bg-gray-700 focus:border-blue-500/50' 
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:bg-white'
                    }`}
                    value={editingTask.description || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="task-due-date" className={`block text-sm font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Due Date
                    </label>
                    <div className={`relative flex items-center rounded-xl border-2 ${
                      isDark ? 'border-gray-600/50' : 'border-gray-200'
                    }`}>
                      <FiCalendar className={`absolute left-3 h-5 w-5 ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <input
                        id="task-due-date"
                        type="date"
                        className={`w-full pl-10 pr-4 py-3 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 rounded-xl ${
                          isDark 
                            ? 'text-white placeholder-gray-500' 
                            : 'text-gray-900 placeholder-gray-400'
                        }`}
                        value={editingTask.due_date ? editingTask.due_date.split('T')[0] : ''}
                        onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="task-priority" className={`block text-sm font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Priority
                    </label>
                    <div className="relative">
                      <select
                        id="task-priority"
                        className={`appearance-none w-full pl-4 pr-10 py-3 rounded-xl border-2 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/50 transition-all duration-200 ${
                          isDark 
                            ? 'bg-gray-700/50 border-gray-600/50 text-white focus:border-blue-500/50' 
                            : 'bg-white border-gray-200 text-gray-900 focus:border-blue-400'
                        }`}
                        value={editingTask.priority}
                        onChange={(e) => setEditingTask({ ...editingTask, priority: parseInt(e.target.value) })}
                      >
                        <option value={1}>Low</option>
                        <option value={2}>Medium</option>
                        <option value={3}>High</option>
                      </select>
                      <FiChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setEditingTask({ ...editingTask, completed: !editingTask.completed })}
                    className={`p-2 rounded-full transition-all duration-300 ease-in-out transform hover:scale-110 ${
                      editingTask.completed 
                        ? isDark
                          ? 'text-green-400 hover:bg-green-900/50' 
                          : 'text-green-600 hover:bg-green-50'
                        : isDark
                          ? 'text-gray-500 hover:text-green-400 hover:bg-gray-700/50'
                          : 'text-gray-400 hover:text-green-600 hover:bg-gray-50'
                    }`}
                    title={editingTask.completed ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {editingTask.completed ? (
                      <FiCheckCircle className="h-5 w-5" />
                    ) : (
                      <FiCircle className="h-5 w-5" />
                    )}
                  </button>
                  <span className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {editingTask.completed ? 'Completed' : 'Mark as complete'}
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`px-6 py-4 flex justify-end gap-3 ${
                isDark ? 'bg-gray-800/50 border-t border-gray-700/50' : 'bg-gray-50 border-t border-gray-100'
              }`}>
                <button
                  onClick={() => setEditingTask(null)}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${
                    isDark 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700/60' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/70'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleUpdateTask(editingTask);
                    setEditingTask(null);
                    }}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                      isDark 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-blue-500/30' 
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md hover:shadow-lg'
                    }`}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Empty State */}
        {tasks.length === 0 && !isAddingTask && (
          <div className={`text-center py-12 rounded-xl shadow-sm border transition-colors duration-200 ${
            isDark 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-gray-50/70 border-gray-100'
          }`}>
            <FiCheckSquare className={`mx-auto h-12 w-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <h3 className={`mt-4 text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              No tasks yet
            </h3>
            <p className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Get started by creating your first task
            </p>
            <button
              onClick={() => setIsAddingTask(true)}
              className={`mt-4 px-5 py-2 rounded-lg font-medium transition-colors ${
                isDark 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <FiPlus className="inline mr-1.5 -mt-0.5" />
              Create Task
            </button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}