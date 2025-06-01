'use client';

import { ClientOnly } from '@/components/ClientOnly';
import StudyPlanner from './StudyPlanner';

export default function StudyTimerPage() {
  return (
    <ClientOnly>
      <StudyPlanner />
    </ClientOnly>
  );
}
