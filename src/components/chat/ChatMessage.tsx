import React, { useState } from 'react';
import { Message } from '@/types/chat';
import { Sparkles, User, Copy, Check, RotateCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// Modern dark syntax highlight theme
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatMessageProps {
  message: Message;
  isLatestAssistant: boolean;
  onRegenerate?: () => void;
  isStreaming?: boolean;
}

export default function ChatMessage({
  message,
  isLatestAssistant,
  onRegenerate,
  isStreaming = false,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCodeId(id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    });
  };

  return (
    <div
      className={`group w-full border-b border-zinc-900/40 py-6 md:py-8 transition-colors duration-300 ${
        isUser ? 'bg-transparent' : 'bg-zinc-900/10'
      }`}
    >
      <div className="flex gap-4 md:gap-6 max-w-3xl mx-auto px-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(99,102,241,0.1)]">
              <Sparkles className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Content Container */}
        <div className="flex-1 space-y-2 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-zinc-200">
              {isUser ? 'You' : 'Aeva'}
            </span>
            <span className="text-[10px] text-zinc-500 font-normal">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {message.isRegenerated && (
              <span className="text-[9px] bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.2 rounded-full font-medium">
                Regenerated
              </span>
            )}
          </div>

          {/* Render Markdown / Text */}
          <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed font-normal">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Overriding the default code tag
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  const codeString = String(children).replace(/\n$/, '');
                  const uniqueId = `${message.id}-${language}-${codeString.slice(0, 15)}`;

                  if (language) {
                    return (
                      <div className="my-4 rounded-lg overflow-hidden border border-zinc-800 bg-[#08080a] shadow-lg select-text">
                        {/* Header bar of Code Block */}
                        <div className="flex items-center justify-between px-4 py-1.5 bg-[#0e0e12] border-b border-zinc-800/80 text-[11px] text-zinc-400 font-mono select-none">
                          <span>{language}</span>
                          <button
                            onClick={() => handleCopyCode(codeString, uniqueId)}
                            className="flex items-center gap-1.5 hover:text-white transition-colors duration-200 cursor-pointer"
                          >
                            {copiedCodeId === uniqueId ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-green-400" />
                                <span className="text-green-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        {/* Custom Syntax Highlight Component */}
                        <SyntaxHighlighter
                          style={oneDark as any}
                          language={language}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            padding: '1rem',
                            background: 'transparent',
                            fontSize: '0.85rem',
                            lineHeight: '1.5',
                          }}
                        >
                          {codeString}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }

                  return (
                    <code className="bg-zinc-800/50 border border-zinc-700/30 rounded px-1.5 py-0.5 text-zinc-200 font-mono text-[0.85em]" {...props}>
                      {children}
                    </code>
                  );
                },

                // Style standard lists beautifully
                ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
                // Style paragraphs
                p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                // Custom tables
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4 border border-zinc-800 rounded-lg">
                    <table className="min-w-full divide-y divide-zinc-800 text-xs">{children}</table>
                  </div>
                ),
                th: ({ children }) => <th className="px-4 py-2 bg-zinc-900/50 text-left font-semibold text-zinc-300">{children}</th>,
                td: ({ children }) => <td className="px-4 py-2 text-zinc-400 border-t border-zinc-800">{children}</td>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Controls Panel (Regenerate Button) */}
          {!isUser && isLatestAssistant && !isStreaming && onRegenerate && (
            <div className="pt-4 flex items-center select-none animate-fade-in">
              <button
                onClick={onRegenerate}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-primary/40 hover:bg-primary/5 text-zinc-400 hover:text-white text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
              >
                <RotateCw className="w-3.5 h-3.5 text-primary" />
                <span>Regenerate response</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
