'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Coffee } from 'lucide-react';

interface ContinueStudyingModalProps {
  isOpen: boolean;
  onStartStudy: () => void;
  onTakeBreak: () => void;
  onClose: () => void;
}

export default function ContinueStudying({ 
  isOpen,
  onStartStudy, 
  onTakeBreak,
  onClose 
}: ContinueStudyingModalProps) {
  if (!isOpen) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-8 w-full max-w-md mx-4"
      >
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Break Complete! 🎉</h2>
        <p className="text-gray-600 mb-8 text-center">What would you like to do next?</p>
        
        <div className="space-y-4">
          <button
            onClick={onStartStudy}
            className="w-full flex items-center justify-center p-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Start New Study Session
          </button>
          
          <button
            onClick={onTakeBreak}
            className="w-full flex items-center justify-center p-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Coffee className="w-5 h-5 mr-2" />
            Take Another Break
          </button>
        </div>
        
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
