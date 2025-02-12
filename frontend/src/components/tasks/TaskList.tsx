import { useState, useEffect } from 'react';

interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string;
  completed: boolean;
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '' });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newTask),
      });
      if (response.ok) {
        setNewTask({ title: '', description: '', due_date: '' });
        fetchTasks();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6 backdrop-blur-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Tasks</h2>
        
        {/* Add Task Form */}
        <form onSubmit={handleSubmit} className="mb-8 space-y-4">
          <div>
            <input
              type="text"
              placeholder="Task title"
              className="w-full p-3 border rounded-lg bg-gray-50/50 focus:bg-white transition-all
                       focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              required
            />
          </div>
          <div>
            <textarea
              placeholder="Description"
              className="w-full p-3 border rounded-lg bg-gray-50/50 focus:bg-white transition-all
                       focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            />
          </div>
          <div>
            <input
              type="datetime-local"
              className="w-full p-3 border rounded-lg bg-gray-50/50 focus:bg-white transition-all
                       focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={newTask.due_date}
              onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
          >
            Add Task
          </button>
        </form>

        {/* Task List */}
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-white
                       transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <h3 className="font-semibold text-gray-900">{task.title}</h3>
              <p className="text-gray-600 mt-1">{task.description}</p>
              <div className="mt-2 text-sm text-gray-500 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(task.due_date).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
