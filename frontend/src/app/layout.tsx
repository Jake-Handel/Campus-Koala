import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/styles.css';
import '@/app/globals.css';
import '@/styles/globals.css';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Campus Koala',
  description: 'A comprehensive study management application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="fixed top-0 left-0 h-full bg-white/90 backdrop-blur-sm shadow-flow-hidden border-r border-gray-100 w-0"></div>
          <main className="flex-1 transition-all duration-300 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}