import React, { useState, useRef, useEffect } from 'react';
import { Conversation } from '@/types/chat';
import { 
  Sparkles, Plus, MessageSquare, Edit2, Trash2, 
  Settings, Download, Check, X, FileText, FileCode 
} from 'lucide-react';
import { exportConversation } from '@/lib/utils';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onOpenSettings: () => void;
}

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  onOpenSettings,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus input on edit start
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string, e?: React.FormEvent) => {
    e?.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const activeConv = conversations.find(c => c.id === activeConversationId);

  return (
    <div className="w-[280px] bg-[#08080a] border-r border-zinc-900/60 flex flex-col h-full select-none text-zinc-300">
      {/* Brand Header */}
      <div className="p-5 border-b border-zinc-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(99,102,241,0.1)]">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <span className="font-extrabold text-base tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-indigo-50">
            AEVA <span className="text-[10px] tracking-normal font-medium text-primary ml-0.5">v0.1</span>
          </span>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/20 hover:border-primary/50 bg-primary/5 hover:bg-primary/10 text-zinc-100 font-semibold text-xs transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.03)] hover:shadow-[0_0_25px_rgba(99,102,241,0.08)] outline-none active:scale-98"
        >
          <Plus className="w-4 h-4 text-primary" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
        <div className="px-2 pb-1 text-[10px] font-bold text-zinc-600 tracking-wider uppercase">
          Recent Dialogues
        </div>
        {conversations.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-zinc-600 font-medium">
            No history yet
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            const isEditing = conv.id === editingId;

            return (
              <div
                key={conv.id}
                onClick={() => !isEditing && onSelectConversation(conv.id)}
                className={`group relative flex items-center w-full px-3 py-2.5 rounded-xl transition-all duration-300 border ${
                  isActive
                    ? 'glass-panel text-white border-primary/20'
                    : 'border-transparent hover:bg-zinc-900/30 hover:text-zinc-200'
                } ${isEditing ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {/* Chat Icon */}
                <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 mr-2.5 ${isActive ? 'text-primary' : 'text-zinc-500'}`} />

                {/* Title or Editor */}
                {isEditing ? (
                  <form
                    onSubmit={(e) => handleSaveRename(conv.id, e)}
                    className="flex items-center flex-1 min-w-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleSaveRename(conv.id)}
                      className="flex-grow bg-zinc-950 border border-primary/30 rounded px-1.5 py-0.5 text-xs text-zinc-100 focus:outline-none focus:border-primary/60 font-medium"
                    />
                    <div className="flex items-center gap-1 ml-1.5">
                      <button
                        type="submit"
                        className="p-0.5 hover:text-green-400 text-zinc-500 transition-colors cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRename}
                        className="p-0.5 hover:text-red-400 text-zinc-500 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <span className="flex-1 text-xs font-semibold truncate leading-none">
                    {conv.title}
                  </span>
                )}

                {/* Inline Action Controls */}
                {!isEditing && (
                  <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-gradient-to-l from-[#08080a] via-[#08080a] pl-3 py-1 transition-opacity duration-200">
                    <button
                      onClick={(e) => handleStartRename(conv, e)}
                      className="p-1 hover:text-primary text-zinc-500 transition-colors cursor-pointer rounded"
                      title="Rename"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      className="p-1 hover:text-red-400 text-zinc-500 transition-colors cursor-pointer rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* active Chat Export Section */}
      {activeConv && activeConv.messages.length > 0 && (
        <div className="px-4 py-3 border-t border-zinc-900/60 bg-zinc-950/20 select-none">
          <div className="text-[10px] font-bold text-zinc-600 tracking-wider uppercase mb-2">
            Export Active Chat
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => exportConversation(activeConv, 'md')}
              className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-zinc-800 hover:border-primary/30 bg-zinc-900/20 hover:bg-primary/5 text-zinc-300 hover:text-white text-[11px] font-semibold transition-all duration-200 cursor-pointer outline-none active:scale-95"
            >
              <FileCode className="w-3 h-3 text-primary" />
              <span>Markdown</span>
            </button>
            <button
              onClick={() => exportConversation(activeConv, 'txt')}
              className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-zinc-800 hover:border-primary/30 bg-zinc-900/20 hover:bg-primary/5 text-zinc-300 hover:text-white text-[11px] font-semibold transition-all duration-200 cursor-pointer outline-none active:scale-95"
            >
              <FileText className="w-3 h-3 text-indigo-400" />
              <span>Plain Text</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer Settings Area */}
      <div className="p-4 border-t border-zinc-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-300 border border-zinc-700">
            EX
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-zinc-200 truncate leading-none">Developer</span>
            <span className="text-[9px] text-zinc-500 font-medium truncate mt-0.5">Aeva v0.1 Sandbox</span>
          </div>
        </div>
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer outline-none"
          title="Open settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
