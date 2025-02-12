'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

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
            <p className="text-3xl font-bold text-primary">5</p>
            <p className="text-sm text-gray-600">Active Tasks</p>
          </div>
          <div className="card p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Study Time</h3>
            <p className="text-3xl font-bold text-primary">12h</p>
            <p className="text-sm text-gray-600">This Week</p>
          </div>
          <div className="card p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Completed</h3>
            <p className="text-3xl font-bold text-primary">8</p>
            <p className="text-sm text-gray-600">This Week</p>
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

          {/* Recent Activity */}
          <div className="card p-6">
            <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">• Completed "Math Assignment" - 2 hours ago</p>
              <p className="text-sm text-gray-600">• Started "Physics Study Session" - 5 hours ago</p>
              <p className="text-sm text-gray-600">• Added new task "Chemistry Review" - Yesterday</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}