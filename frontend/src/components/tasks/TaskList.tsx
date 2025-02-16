import { useState, useEffect } from 'react';
import { TaskForm } from '../TaskForm';

interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string;
  completed: boolean;
  priority: number;
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token); // Debug log

      if (!token) {
        console.error('No token found');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      console.log('Request headers:', headers); // Debug log

      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'GET',
        mode: 'cors',
        credentials: 'same-origin',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching tasks:', errorData);
        return;
      }

      const data = await response.json();
      console.log('Response data:', data); // Debug log
      setTasks(data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleSubmit = async (task: { title: string; description: string; priority: number }) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token); // Debug log
      console.log('Task data:', task); // Debug log

      if (!token) {
        console.error('No token found');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      console.log('Request headers:', headers); // Debug log

      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        mode: 'cors',
        credentials: 'same-origin',
        headers,
        body: JSON.stringify(task),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating task:', errorData);
        return;
      }

      const newTask = await response.json();
      console.log('Task created successfully:', newTask);
      fetchTasks();
    } catch (error) {
      console.error('Network error creating task:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6 backdrop-blur-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Tasks</h2>
        
        {/* Add Task Form */}
        <div className="mb-8">
          <TaskForm onSubmit={handleSubmit} />
        </div>

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
