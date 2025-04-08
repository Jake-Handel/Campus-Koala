'use client';

import { Inter } from 'next/font/google';
import '@/styles/styles.css';
import '@/app/globals.css';
import '@/styles/globals.css';
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from 'next-themes';
import AI from '@/components/AI';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex min-h-screen">
            <Sidebar />
            <AI />
            <main className="flex-1 transition-all duration-300 overflow-auto">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}