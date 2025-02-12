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

  // Don't show sidebar on login, register, or landing page
  if (pathname === '/login' || pathname === '/register' || pathname === '/') {
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
        <div className="fixed top-6 left-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex h-12 w-12 items-center justify-center rounded-xl 
                     bg-white/80 shadow-lg backdrop-blur-sm border border-gray-100
                     hover:bg-white hover:shadow-xl hover:scale-105
                     focus:outline-none focus:ring-2 focus:ring-primary/50
                     transition-all duration-200"
            aria-label="Open Menu"
          >
            <div className="flex w-5 flex-col items-end space-y-1.5">
              <div className="h-0.5 w-5 rounded-full bg-gray-600 transition-all duration-200
                            group-hover:w-4 group-hover:bg-primary"></div>
              <div className="h-0.5 w-4 rounded-full bg-gray-600 transition-all duration-200
                            group-hover:w-5 group-hover:bg-primary"></div>
              <div className="h-0.5 w-3 rounded-full bg-gray-600 transition-all duration-200
                            group-hover:w-4 group-hover:bg-primary"></div>
            </div>
          </button>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white/90 backdrop-blur-sm shadow-xl 
                   transition-all duration-300 ease-in-out z-40 overflow-hidden
                   border-r border-gray-100 ${isOpen ? 'w-64' : 'w-0'}`}
      >
        {isOpen && (
          <div className="h-full flex flex-col">
            {/* Close button */}
            <div className="flex justify-end p-4">
              <button
                onClick={() => setIsOpen(false)}
                className="group flex h-10 w-10 items-center justify-center rounded-lg
                         hover:bg-gray-100 transition-colors duration-200"
                aria-label="Close Menu"
              >
                <FiX className="h-6 w-6 text-gray-500 transition-colors duration-200
                              group-hover:text-primary" />
              </button>
            </div>

            {/* Logo/Title */}
            <div className="px-6 mb-8">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Campus Koala
              </h1>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center px-4 py-2.5 rounded-lg transition-all duration-200
                          ${isActive 
                            ? 'bg-primary/10 text-primary font-medium' 
                            : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                          }`}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
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

            {/* Sign Out Button */}
            <div className="p-4 mt-auto">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center px-4 py-2.5 text-gray-600 rounded-lg
                         hover:bg-gray-50 hover:text-primary transition-all duration-200"
              >
                <FiLogOut className="h-5 w-5 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}