import React, { useRef, useEffect } from 'react';
import { Conversation, Message } from '@/types/chat';
import ChatMessage from './ChatMessage';
import WelcomeScreen from './WelcomeScreen';
import { Sparkles } from 'lucide-react';

interface ChatAreaProps {
  activeConversation: Conversation | null;
  onSelectSuggestion: (query: string) => void;
  userName: string;
  isStreaming: boolean;
  isLoading: boolean;
  onRegenerate: () => void;
}

export default function ChatArea({
  activeConversation,
  onSelectSuggestion,
  userName,
  isStreaming,
  isLoading,
  onRegenerate,
}: ChatAreaProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = activeConversation?.messages || [];

  // Scroll to bottom when messages list updates or streaming states change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isStreaming, isLoading]);

  // Minor extra effect to track active content updates for smoother stream tracking
  const lastMessageContent = messages[messages.length - 1]?.content || '';
  useEffect(() => {
    if (isStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [lastMessageContent, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto flex items-center justify-center bg-transparent">
        <WelcomeScreen onSelectSuggestion={onSelectSuggestion} userName={userName} />
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto bg-transparent scrollbar-thin scrollbar-thumb-zinc-800"
    >
      <div className="w-full">
        {messages.map((message, index) => {
          const isLatestAssistant = !isStreaming && index === messages.length - 1 && message.role === 'assistant';
          return (
            <ChatMessage
              key={message.id || index}
              message={message}
              isLatestAssistant={isLatestAssistant}
              onRegenerate={onRegenerate}
              isStreaming={isStreaming}
            />
          );
        })}

        {/* Pulse / Blinking Typing Loader when stream has initiated but text is empty */}
        {isLoading && !isStreaming && (
          <div className="py-6 md:py-8 bg-zinc-900/10 border-b border-zinc-900/40">
            <div className="flex gap-4 md:gap-6 max-w-3xl mx-auto px-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="flex-grow flex flex-col justify-center">
                <div className="flex items-center gap-1.5 py-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/60 animate-bounce" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Streaming Blink Cursor helper */}
        {isStreaming && messages[messages.length - 1]?.role === 'assistant' && (
          <div className="h-4" />
        )}

        <div ref={bottomRef} className="h-12" />
      </div>
    </div>
  );
}
