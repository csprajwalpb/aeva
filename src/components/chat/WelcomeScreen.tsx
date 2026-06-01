import React from 'react';
import { SUGGESTIONS, Suggestion } from '@/constants/prompts';
import { Code, Brain, Sparkles, MessageSquare, LucideIcon } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectSuggestion: (query: string) => void;
  userName: string;
}

const iconMap: Record<Suggestion['icon'], LucideIcon> = {
  Code,
  Brain,
  Sparkles,
  MessageSquare,
};

export default function WelcomeScreen({ onSelectSuggestion, userName }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 text-center max-w-3xl mx-auto py-12 select-none animate-fade-in">
      {/* Brand Glowing Visual Core */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl w-24 h-24 pulse-glow" />
        <div className="relative w-16 h-16 rounded-2xl glass-panel flex items-center justify-center border-primary/20 shadow-[0_0_30px_rgba(99,102,241,0.15)] group hover:border-primary/40 transition-colors duration-300">
          <Sparkles className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
        </div>
      </div>

      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-indigo-100 to-indigo-50 mb-3">
        Hello, {userName}
      </h1>
      <p className="text-base text-zinc-400 max-w-md mb-12 font-medium">
        I am Aeva, your conversational coding companion. How can I help you design, write, or refactor today?
      </p>

      {/* Suggestion Prompt Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
        {SUGGESTIONS.map((suggestion, index) => {
          const IconComponent = iconMap[suggestion.icon];
          return (
            <button
              key={index}
              onClick={() => onSelectSuggestion(suggestion.query)}
              className="flex flex-col p-5 rounded-xl glass-panel hover:bg-zinc-900/40 hover:border-primary/30 group transition-all duration-300 cursor-pointer outline-none hover:shadow-[0_4px_20px_rgba(99,102,241,0.03)]"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg glass-panel-light flex items-center justify-center text-primary group-hover:text-white transition-colors duration-300">
                  <IconComponent className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-zinc-200 group-hover:text-white transition-colors duration-300 text-sm">
                  {suggestion.title}
                </h3>
              </div>
              <p className="text-xs text-zinc-500 font-normal leading-relaxed group-hover:text-zinc-400 transition-colors duration-300">
                {suggestion.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
