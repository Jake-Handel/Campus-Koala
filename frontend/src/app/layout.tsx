import type { Metadata } from 'next';
import { Rajdhani } from 'next/font/google';
import ClientLayout from './layout-client';
import './globals.css';

const rajdhani = Rajdhani({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-rajdhani' 
});

export const metadata: Metadata = {
  title: 'Campus Koala',
  description: 'Your study companion for effective learning',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={rajdhani.variable}>
      <body className="font-sans bg-white text-gray-900 dark:bg-gray-900 dark:text-white min-h-screen">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}