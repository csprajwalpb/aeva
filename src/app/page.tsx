'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, AppSettings } from '@/types/chat';
import { 
  getSavedConversations, saveConversations, 
  getAppSettings, saveAppSettings 
} from '@/lib/storage';
import Sidebar from '@/components/layout/Sidebar';
import ChatArea from '@/components/chat/ChatArea';
import ChatInput from '@/components/chat/ChatInput';
import SettingsModal from '@/components/settings/SettingsModal';
import { Menu, Sparkles, AlertCircle } from 'lucide-react';

export default function Home() {
  // Mounting guard for SSR
  const [mounted, setMounted] = useState(false);

  // Core States
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ userName: 'Explorer', userAvatarSeed: 'avatar-explorer' });
  const [input, setInput] = useState('');
  
  // Interactive UI States
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // References for stream stop and scroll tracking
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize data on mount
  useEffect(() => {
    setConversations(getSavedConversations());
    setSettings(getAppSettings());
    setMounted(true);
  }, []);

  // Sync conversations to LocalStorage when changed
  const updateConversations = (updated: Conversation[]) => {
    setConversations(updated);
    saveConversations(updated);
  };

  // Sync settings when changed
  const updateSettings = (updated: AppSettings) => {
    setSettings(updated);
    saveAppSettings(updated);
  };

  // Handle Starting a New Chat
  const handleNewChat = () => {
    setActiveConversationId(null);
    setInput('');
    setErrorMessage(null);
    setIsSidebarOpen(false);
  };

  // Handle selecting a past conversation
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setErrorMessage(null);
    setIsSidebarOpen(false);
  };

  // Handle Renaming conversation title
  const handleRenameConversation = (id: string, newTitle: string) => {
    const updated = conversations.map((conv) => 
      conv.id === id ? { ...conv, title: newTitle } : conv
    );
    updateConversations(updated);
  };

  // Handle Deleting conversation
  const handleDeleteConversation = (id: string) => {
    const updated = conversations.filter((conv) => conv.id !== id);
    updateConversations(updated);

    if (activeConversationId === id) {
      setActiveConversationId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // Handle Saving Display Name
  const handleSaveName = (newName: string) => {
    updateSettings({ ...settings, userName: newName });
  };

  // Handle Streaming Stop / Interruption
  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setIsLoading(false);
    }
  };

  // Helper: Triggers streaming API and feeds the active conversation message array
  const executeStreamQuery = async (targetConvId: string, messagesList: Message[], isRegen: boolean = false) => {
    setIsLoading(true);
    setErrorMessage(null);

    // Instantiate new AbortController
    abortControllerRef.current = new AbortController();

    // Create assistant message placeholder
    const assistantMessageId = crypto.randomUUID();
    const assistantPlaceholder: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isRegenerated: isRegen || undefined,
    };

    // Optimistically insert the assistant placeholder to state
    setConversations((prev) => 
      prev.map((c) => 
        c.id === targetConvId 
          ? { ...c, messages: [...messagesList, assistantPlaceholder] }
          : c
      )
    );

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: messagesList }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to load text stream reader from API.');
      }

      setIsStreaming(true);
      setIsLoading(false);

      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value);
        accumulatedContent += chunkText;

        // Stream update state
        setConversations((prev) => 
          prev.map((c) => {
            if (c.id === targetConvId) {
              const updatedMessages = c.messages.map((m) => 
                m.id === assistantMessageId 
                  ? { ...m, content: accumulatedContent }
                  : m
              );
              return { ...c, messages: updatedMessages };
            }
            return c;
          })
        );
      }

      // Finish streaming successfully
      setIsStreaming(false);

      // Save complete chats to storage
      setConversations((prev) => {
        saveConversations(prev);
        return prev;
      });

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream generation aborted by user.');
      } else {
        console.error('Error fetching stream:', error);
        setErrorMessage(error.message || 'Failed to connect to the assistant. Please try again.');
        
        // Remove empty placeholder if failed immediately
        setConversations((prev) => 
          prev.map((c) => {
            if (c.id === targetConvId) {
              const cleaned = c.messages.filter((m) => m.id !== assistantMessageId);
              saveConversations(prev);
              return { ...c, messages: cleaned };
            }
            return c;
          })
        );
      }
      setIsStreaming(false);
      setIsLoading(false);
    }
  };

  // Background title generator for new chats
  const triggerBackgroundTitleGeneration = async (targetConvId: string, initialPrompt: string) => {
    try {
      const res = await fetch('/api/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: initialPrompt }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.title) {
          setConversations((prev) => {
            const updated = prev.map((c) => 
              c.id === targetConvId ? { ...c, title: data.title } : c
            );
            saveConversations(updated);
            return updated;
          });
        }
      }
    } catch (e) {
      console.error('Error generating title in background:', e);
    }
  };

  // Handle Submitting User Input
  const handleSend = async () => {
    if (!input.trim() || isLoading || isStreaming) return;

    const userPrompt = input.trim();
    setInput('');
    setErrorMessage(null);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userPrompt,
      timestamp: Date.now(),
    };

    let targetConvId = activeConversationId;
    let targetMessagesList: Message[] = [];

    if (!targetConvId) {
      // Create new conversation
      targetConvId = crypto.randomUUID();
      const newConv: Conversation = {
        id: targetConvId,
        title: 'Summarizing prompt...',
        createdTime: Date.now(),
        messages: [userMessage],
      };

      const updatedHistory = [newConv, ...conversations];
      setConversations(updatedHistory);
      saveConversations(updatedHistory);
      setActiveConversationId(targetConvId);

      targetMessagesList = [userMessage];

      // Fire title generator and stream in parallel
      triggerBackgroundTitleGeneration(targetConvId, userPrompt);
      await executeStreamQuery(targetConvId, targetMessagesList);
    } else {
      // Append message to active conversation
      const currentConv = conversations.find((c) => c.id === targetConvId);
      if (currentConv) {
        targetMessagesList = [...currentConv.messages, userMessage];
        setConversations((prev) => 
          prev.map((c) => 
            c.id === targetConvId ? { ...c, messages: targetMessagesList } : c
          )
        );
        await executeStreamQuery(targetConvId, targetMessagesList);
      }
    }
  };

  // Handle Click-to-Start Prompt Suggestions
  const handleSelectSuggestion = (query: string) => {
    setInput(query);
  };

  // Handle Response Regeneration
  const handleRegenerate = async () => {
    const targetConvId = activeConversationId;
    if (!targetConvId || isLoading || isStreaming) return;

    const currentConv = conversations.find((c) => c.id === targetConvId);
    if (!currentConv || currentConv.messages.length < 2) return;

    // Filter out the last assistant message
    const previousMessages = [...currentConv.messages];
    const lastMsg = previousMessages[previousMessages.length - 1];
    
    if (lastMsg.role === 'assistant') {
      previousMessages.pop(); // Remove the assistant's previous response
    }

    setConversations((prev) => 
      prev.map((c) => 
        c.id === targetConvId ? { ...c, messages: previousMessages } : c
      )
    );

    // Relaunch stream on previous messages list
    await executeStreamQuery(targetConvId, previousMessages, true);
  };

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  ) || null;

  // Hydration fallback
  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#060608] select-none text-zinc-600 font-bold text-xs tracking-widest animate-pulse">
        AEVA INITIALIZING...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden mesh-gradient-bg select-none font-sans text-zinc-100 antialiased">
      {/* Desktop Sidebar (Permanent) */}
      <div className="hidden md:block h-full flex-shrink-0">
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Drawer Backdrop */}
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="absolute inset-0 bg-[#040405]/80 backdrop-blur-sm"
          />
          {/* Drawer Sidebar Frame */}
          <div className="relative z-10 h-full animate-fade-in">
            <Sidebar
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={handleSelectConversation}
              onNewChat={handleNewChat}
              onRenameConversation={handleRenameConversation}
              onDeleteConversation={handleDeleteConversation}
              onOpenSettings={() => {
                setIsSidebarOpen(false);
                setIsSettingsOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Workspace Feed */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header Bar */}
        <header className="h-14 border-b border-zinc-900/60 bg-transparent flex items-center justify-between px-4 select-none">
          <div className="flex items-center gap-2">
            {/* Hamburger button (Mobile only) */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 text-zinc-400 hover:text-zinc-200 cursor-pointer outline-none md:hidden"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="font-extrabold text-sm tracking-wider uppercase text-zinc-300 ml-1 select-none">
              {activeConversation ? activeConversation.title : 'New Session'}
            </span>
          </div>

          <div className="flex items-center gap-2 pr-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-bold shadow-[0_0_15px_rgba(99,102,241,0.05)] select-none">
              <Sparkles className="w-3 h-3 text-primary animate-pulse" />
              <span>Gemini 1.5 Flash</span>
            </div>
          </div>
        </header>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 px-4 py-3 flex items-center gap-2.5 text-xs font-semibold select-text">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <div className="flex-1">{errorMessage}</div>
            <button 
              onClick={() => setErrorMessage(null)}
              className="text-[10px] uppercase font-bold text-red-400 hover:text-white ml-2 cursor-pointer outline-none select-none"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Chat Messages Feed Scroll Area */}
        <ChatArea
          activeConversation={activeConversation}
          onSelectSuggestion={handleSelectSuggestion}
          userName={settings.userName}
          isStreaming={isStreaming}
          isLoading={isLoading}
          onRegenerate={handleRegenerate}
        />

        {/* Floating Input Controls Section */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={handleSend}
          onStop={handleStopStream}
          isStreaming={isStreaming}
          isLoading={isLoading}
        />
      </div>

      {/* Control Panel / Settings Modal overlay */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userName={settings.userName}
        onSaveName={handleSaveName}
      />
    </div>
  );
}
