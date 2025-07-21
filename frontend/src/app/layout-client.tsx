'use client';

import { useEffect, useState } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import { Inter } from 'next/font/google';
import '@/styles/styles.css';
import '@/app/globals.css';
import '@/styles/globals.css';
import Sidebar from '@/components/Sidebar';
import AI from '@/components/AI';

const inter = Inter({ subsets: ['latin'] });

// This is a client component that wraps the app with the theme
function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  
  useEffect(() => {
    setMounted(true);
    
    // Listen for theme changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        // Handle theme change if needed
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Log when theme changes
  useEffect(() => {
    if (mounted) {
      // Handle theme change effects here
    }
  }, [theme, mounted]);

  if (!mounted) {
    return <div className={inter.className}>{children}</div>;
  }

  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}

// This component ensures the theme class is applied to the html element
function ThemeApplier() {
  const { theme, systemTheme } = useTheme();
  
  useEffect(() => {
    const root = window.document.documentElement;
    const currentTheme = theme === 'system' ? systemTheme : theme;
    
    if (currentTheme) {
      root.classList.remove('light', 'dark');
      root.classList.add(currentTheme);
      
      // Also set the data-theme attribute on the body for compatibility
      document.body.setAttribute('data-theme', currentTheme);
    }
  }, [theme, systemTheme]);
  
  return null;
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeWrapper>
      <ThemeApplier />
      <div className="flex min-h-screen">
        <Sidebar />
        <AI />
        <main className="flex-1 transition-all duration-300 overflow-auto">
          {children}
        </main>
      </div>
    </ThemeWrapper>
  );
}
