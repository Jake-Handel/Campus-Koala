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
  const [editingTask, setEditingTask] = useState<Task | null>(null);
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

      const response = await fetch(`http://localhost:5000/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          priority: task.priority,
          completed: task.completed,
          due_date: task.due_date
        }),
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
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="space-y-6">
        

        {/* Main Content */}
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
            <div className="flex items-center gap-3">
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
              <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{
                    width: `${tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%`
                  }}
                />
              </div>
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
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-600 mb-4">Total Tasks</h3>
          <p className="text-4xl font-bold text-gray-900">{tasks.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-600 mb-4">Active Tasks</h3>
          <p className="text-4xl font-bold text-blue-600">{tasks.filter(t => !t.completed).length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-600 mb-4">Completed Tasks</h3>
          <p className="text-4xl font-bold text-green-600">{tasks.filter(t => t.completed).length}</p>
        </div>
      </div>


        {/* Add Task Form */}
        {isAddingTask && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Task title"
                  className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
                <textarea
                  placeholder="Task description (optional)"
                  className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <FiCalendar className="text-gray-400" />
                    <input
                      type="date"
                      className="flex-1 p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Priority:</span>
                    <select
                      className="p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 text-gray-600 transition-all duration-200"
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
          {[...tasks].sort((a, b) => {
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
          }).map((task) => (
            <div
              key={task.id}
              className={`group rounded-xl shadow-sm p-5 transition-all duration-300 ease-in-out transform
                         ${task.completed 
                           ? 'bg-green-50 border border-green-200 hover:bg-green-100 hover:border-green-300 hover:scale-[0.99]' 
                           : task.priority === 3
                           ? 'bg-red-200/70 border border-red-100 hover:bg-red-100 hover:border-red-200 hover:scale-[1.01]'
                           : task.priority === 2
                           ? 'bg-yellow-200/70 border border-yellow-100 hover:bg-yellow-100 hover:border-yellow-200 hover:scale-[1.01]'
                           : 'bg-gray-200/70 border border-gray-200 hover:bg-gray-200 hover:border-gray-200 hover:scale-[1.01]'}`}
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
                    <h3 className={`text-lg font-medium transition-all duration-300 ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className={`mt-1 text-sm ${task.completed ? 'text-gray-400' : 'text-gray-500'}`}>
                        {task.description}
                      </p>
                    )}
                    {task.due_date && (
                      <div className={`mt-2 flex items-center text-sm ${task.completed ? 'text-gray-400' : 'text-gray-400'}`}>
                        <FiCalendar className="mr-1.5 h-4 w-4" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingTask(task)}
                    className="p-2 rounded-full text-gray-400 hover:text-blue-500 hover:bg-gray-100 transition-all duration-300 ease-in-out transform hover:scale-110"
                    title="Edit task"
                  >
                    <FiEdit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-all duration-300 ease-in-out transform hover:scale-110 hover:rotate-12"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-sm border p-6 m-4">
              <h2 className="text-2xl font-bold mb-6">Edit Task</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Task title"
                  className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                />
                <textarea
                  placeholder="Task description (optional)"
                  className="w-full p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <FiCalendar className="text-gray-400" />
                    <input
                      type="date"
                      className="flex-1 p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder-gray-400 transition-all duration-200"
                      value={editingTask.due_date ? editingTask.due_date.split('T')[0] : ''}
                      onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Priority:</span>
                    <select
                      className="p-3 rounded-lg bg-gray-50/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 text-gray-600 transition-all duration-200"
                      value={editingTask.priority}
                      onChange={(e) => setEditingTask({ ...editingTask, priority: parseInt(e.target.value) })}
                    >
                      <option value={1}>Low</option>
                      <option value={2}>Medium</option>
                      <option value={3}>High</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEditingTask({ ...editingTask, completed: !editingTask.completed })}
                    className={`p-2 rounded-full transition-all duration-300 ease-in-out transform hover:scale-110
                      ${editingTask.completed 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-gray-400 hover:text-green-600 hover:bg-gray-50'}`}
                    title={editingTask.completed ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {editingTask.completed ? (
                      <FiCheckCircle className="h-5 w-5" />
                    ) : (
                      <FiCircle className="h-5 w-5" />
                    )}
                  </button>
                  <span className="text-sm text-gray-500">
                    {editingTask.completed ? 'Completed' : 'Mark as complete'}
                  </span>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setEditingTask(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateTask(editingTask);
                      setEditingTask(null);
                    }}
                    className="btn btn-primary px-6"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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