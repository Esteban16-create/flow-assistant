import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Bot, Send, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAgentContext, processUserMessage } from '../lib/agent';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import type { AssistantMessage } from '../lib/types';

export default function Assistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user?.id || !isOpen) return;

    async function initializeAgent() {
      setIsTyping(true);
      try {
        const agentContext = await getAgentContext(user.id);
        setContext(agentContext);
        
        setMessages([{
          id: crypto.randomUUID(),
          content: `Bonjour ${agentContext.userName || ''}! Je peux vous aider à réserver un restaurant, un vol, un hôtel ou une voiture. Que souhaitez-vous faire ?`,
          type: 'assistant',
          messageType: 'greeting'
        }]);

      } catch (error) {
        console.error('Error initializing agent:', error);
        setMessages([{
          id: crypto.randomUUID(),
          content: "Je suis désolé, j'ai rencontré une erreur. Réessayons plus tard !",
          type: 'assistant',
          messageType: 'concern'
        }]);
      } finally {
        setIsTyping(false);
      }
    }

    if (messages.length === 0) {
      initializeAgent();
    }
  }, [user, isOpen, messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user?.id || isTyping) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      content: userMessage,
      type: 'user'
    }]);

    setIsTyping(true);
    try {
      const { response, bookingUrl, eventDetails } = await processUserMessage(
        user.id,
        userMessage,
        context
      );

      const messageId = crypto.randomUUID();
      let displayedMessage = '';
      
      setMessages(prev => [...prev, {
        id: messageId,
        content: '',
        type: 'assistant',
        messageType: 'suggestion',
        bookingUrl,
        eventDetails
      }]);

      for (let i = 0; i < response.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 30));
        displayedMessage += response[i];
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: displayedMessage }
              : msg
          )
        );
      }

      await supabase.from('assistant_logs').insert({
        user_id: user.id,
        message: userMessage,
        type: 'booking_request',
        context: {
          userMessage,
          response,
          bookingUrl,
          eventDetails
        }
      });
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        content: "Je suis désolé, j'ai rencontré une erreur. Réessayons plus tard !",
        type: 'assistant',
        messageType: 'concern'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const messageStyles = {
    greeting: 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300',
    motivation: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
    celebration: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
    suggestion: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    concern: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
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
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-36 right-4 md:bottom-24 md:right-8 w-80 md:w-96"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[500px]">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h3 className="font-medium text-gray-900 dark:text-white">Assistant Flow</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "max-w-[85%] rounded-lg p-3",
                      msg.type === 'user' ? (
                        "ml-auto bg-primary-600 text-white"
                      ) : (
                        msg.messageType ? messageStyles[msg.messageType] : "bg-gray-100 dark:bg-gray-800"
                      )
                    )}
                  >
                    <p className="text-sm">{msg.content}</p>
                    
                    {msg.bookingUrl && (
                      <a
                        href={msg.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-2 text-sm font-medium hover:underline"
                      >
                        <MapPin className="w-4 h-4" />
                        Voir les disponibilités
                      </a>
                    )}
                    
                    {msg.eventDetails && (
                      <div className="mt-2 p-2 bg-white/50 dark:bg-black/20 rounded">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>Événement ajouté à l'agenda</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-1 p-2">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg",
                      "bg-gray-100 dark:bg-gray-800",
                      "border border-gray-300 dark:border-gray-600",
                      "text-gray-900 dark:text-white",
                      "placeholder-gray-500 dark:placeholder-gray-400",
                      "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                      "disabled:opacity-50"
                    )}
                    disabled={isTyping}
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    className={cn(
                      "p-2 rounded-lg",
                      "bg-primary-600 hover:bg-primary-700",
                      "text-white",
                      "transition-colors duration-200",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "focus:outline-none focus:ring-2 focus:ring-primary-500"
                    )}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}