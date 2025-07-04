'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiSettings } from 'react-icons/fi';
import { useTheme } from 'next-themes';

const SettingsButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Set mounted state on client-side only
  useEffect(() => {
    setMounted(true);
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    console.log('Current theme before toggle:', theme);
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    console.log('Setting theme to:', newTheme);
    
    // Force update the theme
    setTheme(newTheme);
    
    // Manually update the theme in localStorage for immediate feedback
    localStorage.setItem('theme', newTheme);
    
    // Force a re-render of the theme applier
    const event = new Event('theme-change');
    window.dispatchEvent(event);
    
    console.log('Dispatched theme change event');
  };

  // Close popup when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Log theme changes
  useEffect(() => {
    if (!mounted) return;
    
    const handleThemeChange = () => {
      console.log('Theme changed to:', theme);
      console.log('Document attributes:', {
        class: document.documentElement.className,
        'data-theme': document.documentElement.getAttribute('data-theme'),
        'body-data-theme': document.body.getAttribute('data-theme')
      });
    };
    
    // Initial log
    handleThemeChange();
    
    // Listen for theme changes
    window.addEventListener('theme-change', handleThemeChange);
    
    return () => {
      window.removeEventListener('theme-change', handleThemeChange);
    };
  }, [theme, mounted]);

  // Don't render anything during SSR or before mount
  if (!mounted) {
    console.log('Rendering null (not mounted yet)');
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-10 h-10 rounded-lg
                   transition-all duration-200 transform hover:scale-105 active:scale-95
                   ${theme === 'dark' 
                     ? 'hover:bg-gray-700/80 hover:shadow-lg hover:shadow-gray-900/20' 
                     : 'hover:bg-gray-100 hover:shadow-md'}
                   ${isOpen ? (theme === 'dark' ? 'bg-gray-700/80' : 'bg-gray-100') : ''} 
                   ${isOpen ? (theme === 'dark' ? 'shadow-lg shadow-gray-900/30' : 'shadow-inner') : ''}`}
        aria-label="Settings"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <FiSettings 
          className={`w-5 h-5 transition-transform duration-200 
                    ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}
                    ${isOpen ? 'rotate-45' : ''}`} 
        />
      </button>

      {isOpen && (
        <div 
          ref={popupRef}
          className={`fixed left-[calc(16rem+0.5rem)] bottom-4 w-64 rounded-xl shadow-xl overflow-hidden z-[60] animate-fadeIn
                    ${theme === 'dark' 
                      ? 'bg-gray-800 border border-gray-700/50 shadow-2xl shadow-black/30' 
                      : 'bg-white border border-gray-100'}`}
          style={{
            animation: 'fadeIn 0.15s ease-out forwards',
            opacity: 0,
          }}
        >
          <div className="p-4">
            <h3 className={`text-sm font-semibold mb-3 ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>Dark Mode</span>
                <label className="relative inline-flex items-center cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={theme === 'dark'}
                    onChange={toggleTheme}
                  />
                  <div className="relative w-12 h-6">
                    <div className={`w-full h-full rounded-full shadow-inner transition-colors duration-300 ${
                      theme === 'dark' ? 'bg-gradient-to-r from-indigo-500/90 to-purple-600/90' : 'bg-gradient-to-r from-gray-200 to-gray-300'
                    }`}></div>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-lg transform transition-all duration-300 flex items-center justify-center ${
                      theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                    }`}>
                      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                        theme === 'light' ? 'opacity-100' : 'opacity-0'
                      }`}>
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-200 to-amber-400">
                          <div className="absolute top-0.5 left-0.5 w-3 h-1.5 bg-amber-400 rounded-full transform rotate-45 origin-left"></div>
                        </div>
                      </div>
                      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                        theme === 'dark' ? 'opacity-100' : 'opacity-0'
                      }`}>
                        <div className="w-3 h-3 rounded-full bg-indigo-500 relative">
                          <div className="absolute top-0.5 left-0.5 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsButton;
