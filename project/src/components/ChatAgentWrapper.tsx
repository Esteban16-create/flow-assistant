import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Bot } from 'lucide-react';
import { cn } from '../lib/utils';
import ChatAgent from './ChatAgent';

interface ChatAgentWrapperProps {
  onEventCreated?: () => void;
}

export default function ChatAgentWrapper({ onEventCreated }: ChatAgentWrapperProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Close chatbot automatically on page change
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    // Lock body scroll when chat is open
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <motion.button
        onClick={() => setOpen(!open)} // Toggle behavior
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          "fixed bottom-20 right-4 md:bottom-8 md:right-8",
          "w-12 h-12 rounded-full shadow-lg",
          "bg-primary-600 hover:bg-primary-700",
          "flex items-center justify-center",
          "text-white",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        )}
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-36 right-4 md:bottom-24 md:right-8 w-80 md:w-96"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[500px]">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h3 className="font-medium text-gray-900 dark:text-white">Assistant Flow</h3>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <ChatAgent onEventCreated={onEventCreated} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}