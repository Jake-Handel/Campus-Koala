'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Task } from '../types/Task';
import { FiMenu, FiX, FiHome, FiCheckSquare, FiCalendar, FiClock, FiLogOut } from 'react-icons/fi';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: FiHome },
  { href: '/tasks', label: 'To-Do List', icon: FiCheckSquare },
  { href: '/calendar', label: 'Calendar', icon: FiCalendar },
  { href: '/study-timer', label: 'Study Timer', icon: FiClock },
];

export default function Sidebar({ tasks = [] }: { tasks?: Task[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Don't show sidebar on login or register pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  const handleSignOut = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <>
      {/* Hamburger Menu Button - Only show when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
          aria-label="Open Menu"
        >
          <FiMenu className="h-6 w-6 text-gray-700" />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-xl transition-all duration-300 ease-in-out z-40 overflow-hidden
          ${isOpen ? 'w-64' : 'w-0'}`}
      >
        {isOpen && (
          <div className="h-full flex flex-col">
            {/* Close button */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
              <h1 className="text-xl font-semibold text-gray-900">Campus Koala</h1>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                aria-label="Close Menu"
              >
                <FiX className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 px-3">
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center py-2 px-3 rounded-md transition-all duration-200
                        ${isActive
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'} mr-3`} />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Tasks Section */}
              {tasks?.length > 0 && (
                <div className="mt-6">
                  <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Recent Tasks
                  </h3>
                  <div className="mt-2 space-y-1">
                    {tasks.map((task) => {
                      const isActive = pathname === `/tasks/${task.id}`;
                      return (
                        <Link
                          key={task.id}
                          href={`/tasks/${task.id}`}
                          className={`flex items-center py-2 px-3 text-sm rounded-md transition-all duration-200
                            ${isActive
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-3" />
                          <span className="truncate">{task.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sign Out Button */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                <FiLogOut className="h-5 w-5 text-gray-400 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}