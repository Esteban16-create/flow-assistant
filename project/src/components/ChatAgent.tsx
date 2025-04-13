import { useState, useEffect, useRef } from 'react';
import { Send, Bot, MapPin, Calendar, ListChecks, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAgentContext, processUserMessage } from '../lib/agent';
import { planRoutine } from '../lib/routine';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import type { AssistantMessage } from '../lib/types';

interface ChatAgentProps {
  onEventCreated?: () => void;
}

export default function ChatAgent({ onEventCreated }: ChatAgentProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
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
    if (!user?.id) return;

    async function initializeAgent() {
      setIsTyping(true);
      try {
        const agentContext = await getAgentContext(user.id);
        setContext(agentContext);
        
        setMessages([{
          id: crypto.randomUUID(),
          content: `Bonjour ${agentContext.userName || ''}! Je peux vous aider à créer des routines ou gérer votre agenda. Que souhaitez-vous faire ?`,
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
  }, [user, messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user?.id || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      content: userMessage,
      type: 'user'
    }]);

    setIsTyping(true);
    try {
      const { response, routine, bookingUrl, eventDetails } = await processUserMessage(
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
        routine,
        bookingUrl,
        eventDetails
      }]);

      // Simulate typing effect
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

      // If we have a routine, plan it
      if (routine) {
        try {
          const { events_created } = await planRoutine(routine);
          onEventCreated?.();
          
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            content: `✅ J'ai créé ${events_created} événements dans votre agenda pour la routine "${routine.title}".`,
            type: 'assistant',
            messageType: 'celebration'
          }]);
        } catch (error) {
          console.error('Error planning routine:', error);
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            content: "Désolé, je n'ai pas pu planifier la routine dans votre agenda.",
            type: 'assistant',
            messageType: 'concern'
          }]);
        }
      }

      // If we have event details, notify
      if (eventDetails) {
        onEventCreated?.();
      }

      await supabase.from('assistant_logs').insert({
        user_id: user.id,
        message: userMessage,
        type: 'chat_interaction',
        context: {
          userMessage,
          response,
          routine,
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
    <div className="flex-1 flex flex-col">
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
            
            {msg.routine && (
              <div className="mt-2 p-2 bg-white/50 dark:bg-black/20 rounded">
                <div className="flex items-center gap-2 text-sm">
                  <ListChecks className="w-4 h-4" />
                  <span>Routine créée : {msg.routine.title}</span>
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  {msg.routine.activities.map((activity, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span>• {activity.start}</span>
                      <span>{activity.label}</span>
                      <span className="text-xs">({activity.duration}min)</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-sm">
                  📅 {msg.routine.recurrence.join(', ')}
                </div>
              </div>
            )}
            
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
            disabled={!input.trim() || isTyping}
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
  );
}