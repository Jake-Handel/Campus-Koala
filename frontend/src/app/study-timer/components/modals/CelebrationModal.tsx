// frontend/src/app/study-timer/components/modals/CelebrationModal.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function CelebrationModal({ 
  isOpen,
  onClose, 
  message = "Great job! Session completed successfully!" 
}: CelebrationModalProps) {
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl text-center w-full max-w-md mx-4 transition-colors duration-200"
        >
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Great Job! 🎉</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-10 text-xl max-w-4xl mx-auto">{message}</p>
          <button
            onClick={onClose}
            className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xl rounded-xl font-medium transition-all duration-200"
          >
            Continue
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}