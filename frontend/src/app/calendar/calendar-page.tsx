'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { FiPlus } from 'react-icons/fi';
import dynamic from 'next/dynamic';

import type { Event } from './types';

const CalendarComponent = dynamic(
  () => import('./calendar-component'),
  { ssr: false }
);

const eventCategories = [
  { name: 'Study', color: '#4338CA' },  // Indigo-700 for better contrast
  { name: 'Exam', color: '#DC2626' },    // Red-600 kept for urgency
  { name: 'Assignment', color: '#2563EB' }, // Blue-600 for better visibility
  { name: 'Meeting', color: '#059669' },   // Emerald-600 for softer meetings
  { name: 'Other', color: '#6B7280' },    // Gray-500 for better contrast
];

export default function CalendarPageContent() {
  const router = useRouter();
