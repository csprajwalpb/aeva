import React, { useRef, useEffect, useState } from 'react';
import { Send, Square, ArrowUp } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isStreaming: boolean;
  isLoading: boolean;
}

export default function ChatInput({
  input,
  setInput,
  onSubmit,
  onStop,
  isStreaming,
  isLoading,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize height handler
  useEffect(() => {
    const tx = textareaRef.current;
    if (tx) {
      tx.style.height = 'auto';
      tx.style.height = `${Math.min(tx.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading && !isStreaming) {
        onSubmit();
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-6 select-none">
      <div className="relative flex items-end w-full glass-input rounded-2xl p-2 pr-3 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? "Aeva is writing..." : "Ask Aeva anything..."}
          disabled={isStreaming}
          rows={1}
          style={{ resize: 'none' }}
          className="flex-1 max-h-[200px] overflow-y-auto bg-transparent border-0 outline-none text-zinc-100 text-sm py-2 px-3 placeholder-zinc-500 focus:ring-0 leading-relaxed scrollbar-thin scrollbar-thumb-zinc-800"
        />

        <div className="flex items-center h-9 ml-2">
          {isStreaming ? (
            /* Stream Stop Button */
            <button
              onClick={onStop}
              type="button"
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-200 cursor-pointer outline-none active:scale-95"
              title="Stop generation"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            /* Standard Send Button */
            <button
              onClick={onSubmit}
              disabled={!input.trim() || isLoading}
              type="button"
              className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 cursor-pointer outline-none active:scale-95 ${
                input.trim() && !isLoading
                  ? 'bg-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)]'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
      <div className="text-center mt-2">
        <p className="text-[10px] text-zinc-600 font-normal">
          Aeva v0.1 may produce inaccurate information. Please verify key details.
        </p>
      </div>
    </div>
  );
}
