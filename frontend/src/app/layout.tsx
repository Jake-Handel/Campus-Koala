'use client';

import { Inter, Rajdhani } from 'next/font/google';
import { useEffect, useState } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import '@/styles/styles.css';
import '@/app/globals.css';
import '@/styles/globals.css';
import Sidebar from '@/components/Sidebar';
import AI from '@/components/AI';

const inter = Inter({ subsets: ['latin'] });
const rajdhani = Rajdhani({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-rajdhani' 
});

// This is a client component that wraps the app with the theme

// This is a client component that wraps the app with the theme
function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  
  useEffect(() => {
    console.log('Providers: Component mounted');
    setMounted(true);
    
    // Log initial theme state
    console.log('Providers: Initial theme from localStorage:', localStorage.getItem('theme'));
    console.log('Providers: Initial theme from useTheme():', theme);
    
    // Listen for theme changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        console.log('Providers: Theme changed in localStorage:', e.newValue);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Log when theme changes
  useEffect(() => {
    if (mounted) {
      console.log('Providers: Theme updated to:', theme);
      console.log('Providers: Document classList:', document.documentElement.classList);
    }
  }, [theme, mounted]);

  if (!mounted) {
    console.log('Providers: Not mounted yet, rendering fallback');
    return <div className={inter.className}>{children}</div>;
  }

  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem 
      disableTransitionOnChange
      storageKey="study-app-theme"
    >
      {children}
    </ThemeProvider>
  );
}

// This component ensures the theme class is applied to the html element
function ThemeApplier() {
  const { theme, systemTheme } = useTheme();
  
  useEffect(() => {
    // Apply the theme class to the HTML element
    const root = window.document.documentElement;
    
    // Remove all theme classes and attributes
    root.classList.remove('light', 'dark');
    root.removeAttribute('data-theme');
    root.removeAttribute('class');
    
    // Add the current theme class and data-theme attribute
    const currentTheme = theme === 'system' ? systemTheme : theme;
    
    if (currentTheme) {
      root.setAttribute('data-theme', currentTheme);
      root.classList.add(currentTheme);
      
      // Also set the data-theme attribute on the body for compatibility
      document.body.setAttribute('data-theme', currentTheme);
      
      console.log('ThemeApplier: Applied theme', { 
        theme, 
        systemTheme,
        currentTheme,
        rootClass: root.className,
        darkMode: currentTheme === 'dark'
      });
    }
  }, [theme, systemTheme]);
  
  return null;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={rajdhani.variable}>
      <body className={`${inter.className} font-sans bg-white text-gray-900 dark:bg-gray-900 dark:text-white min-h-screen`}>
        <Providers>
          <ThemeApplier />
          <div className="flex min-h-screen">
            <Sidebar />
            <AI />
            <main className="flex-1 transition-all duration-300 overflow-auto">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}