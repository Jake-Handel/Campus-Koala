'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Task } from '../types/Task';
import { FiMenu, FiX, FiHome, FiCheckSquare, FiCalendar, FiClock, FiLogOut } from 'react-icons/fi';
import SettingsButton from './SettingsButton';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: FiHome },
  { href: '/tasks', label: 'To-Do List', icon: FiCheckSquare },
  { href: '/calendar', label: 'Calendar', icon: FiCalendar },
  { href: '/study-timer', label: 'FocusFlow', icon: FiClock },
];

export default function Sidebar({ tasks = [] }: { tasks?: Task[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');
  const pathname = usePathname();
  const router = useRouter();

  // Handle theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      const html = document.documentElement;
      const theme = html.getAttribute('data-theme') || 'light';
      setCurrentTheme(theme);
    };
    
    // Initial theme check
    handleThemeChange();
    
    // Listen for theme changes
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });
    
    return () => observer.disconnect();
  }, []);

  // Ensure sidebar is closed when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Don't show sidebar on login, register, or landing page
  if (pathname === '/login' || pathname === '/register' || pathname === '/') {
    return null;
  }

  const handleSignOut = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  // Helper function to get theme class
  const getThemeClass = (baseClass: string, darkClass: string) => {
    return `${baseClass} ${currentTheme === 'dark' ? darkClass : ''}`;
  };

  return (
    <>
      {/* Hamburger Menu Button - Only show when sidebar is closed */}
      {!isOpen && (
        <div className="fixed top-6 left-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className={`group relative flex h-12 w-12 items-center justify-center rounded-xl 
                     bg-white/80 shadow-lg backdrop-blur-sm 
                     border border-gray-100
                     hover:bg-white hover:shadow-xl hover:scale-105
                     focus:outline-none focus:ring-2 focus:ring-primary/50
                     transition-all duration-200
                     ${getThemeClass('dark:bg-gray-800/90 dark:border-gray-700 dark:hover:bg-gray-700', '')}`}
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
                 transition-all duration-300 ease-in-out z-40 overflow-visible
                 border-r ${currentTheme === 'dark' ? 'border-gray-800' : 'border-gray-100'} ${isOpen ? 'w-64' : 'w-0'}
                 ${currentTheme === 'dark' ? 'dark:bg-gray-900/95' : ''}`}
        style={{ overflow: 'visible' }}
      >
        {isOpen && (
          <div className="p-6 space-y-8 h-full flex flex-col">
            {/* Header with close button and logo in the same row */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Campus Koala
              </h1>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded-full ${currentTheme === 'dark' ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                aria-label="Close Menu"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 flex flex-col">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl ${
                          currentTheme === 'dark' ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                        } ${
                          pathname === item.href
                            ? currentTheme === 'dark'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-blue-500/10 text-blue-600'
                            : ''
                        }`}
                      >
                        <Icon className={`w-5 h-5 mr-3 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                        <span>{item.label}</span>
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

            {/* Bottom Buttons */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between space-x-3">
                <button
                  onClick={handleSignOut}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl ${
                    currentTheme === 'dark' 
                      ? 'text-red-400 hover:bg-red-900/20' 
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <FiLogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
                <div className={`flex-1 justify-end items-center flex`}>
                  <SettingsButton />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 