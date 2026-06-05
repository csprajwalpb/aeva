'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message } from '@/types/chat';
import { 
  fetchConversations, 
  createConversation, 
  renameConversation, 
  deleteConversation, 
  createMessage,
  deleteLastMessage
} from '@/actions/chat';
import Sidebar from '@/components/layout/Sidebar';
import ChatArea from '@/components/chat/ChatArea';
import ChatInput from '@/components/chat/ChatInput';
import MigrationBanner from '@/components/chat/MigrationBanner';
import SettingsModal from '@/components/settings/SettingsModal';
import { Menu, Sparkles, AlertCircle } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { user, isLoaded } = useUser();

  // Core States
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  
  // Interactive UI States
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // References for stream stop
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load conversations from database on load
  const loadConversations = async (selectNewest = false) => {
    try {
      const res = await fetchConversations();
      if (res.success && res.conversations) {
        setConversations(res.conversations);
        if (selectNewest && res.conversations.length > 0) {
          setActiveConversationId(res.conversations[0].id);
        }
      } else {
        console.error('Error loading chats:', res.error);
      }
    } catch (e) {
      console.error('Failed to load chats:', e);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      loadConversations();
      setMounted(true);
    }
  }, [isLoaded, user]);

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
  const handleRenameConversation = async (id: string, newTitle: string) => {
    const original = [...conversations];
    
    // Optimistic UI Update
    setConversations((prev) => 
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );

    const res = await renameConversation(id, newTitle);
    if (!res.success) {
      toast.error(res.error || 'Failed to rename conversation');
      setConversations(original); // Rollback
    } else {
      toast.success('Conversation renamed');
      loadConversations();
    }
  };

  // Handle Deleting conversation
  const handleDeleteConversation = async (id: string) => {
    const original = [...conversations];
    
    // Optimistic UI Update
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    if (activeConversationId === id) {
      setActiveConversationId(updated.length > 0 ? updated[0].id : null);
    }

    const res = await deleteConversation(id);
    if (!res.success) {
      toast.error(res.error || 'Failed to delete conversation');
      setConversations(original); // Rollback
    } else {
      toast.success('Conversation deleted');
      loadConversations();
    }
  };

  // Handle Streaming Stop / Interruption
  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setIsLoading(false);
    }
  };

  // Helper: Streams responses and persists them in Neon PostgreSQL
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

    // Optimistically insert placeholder locally to render streaming
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

        // Stream text update locally
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

      setIsStreaming(false);

      // Persist assistant message in DB
      const resMsg = await createMessage(targetConvId, 'assistant', accumulatedContent);
      if (!resMsg.success) {
        console.error('Failed to save AI response to DB:', resMsg.error);
        toast.error('Failed to save assistant response in database.');
      }

      // Re-fetch to sync latest timestamps and IDs
      loadConversations();

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream generation aborted by user.');
        // If aborted, save whatever has been generated so far
        const activeChat = conversations.find(c => c.id === targetConvId);
        const lastMsgObj = activeChat?.messages.find(m => m.id === assistantMessageId);
        const partialContent = lastMsgObj?.content || '';
        
        if (partialContent.trim()) {
          await createMessage(targetConvId, 'assistant', partialContent);
          loadConversations();
        }
      } else {
        console.error('Error fetching stream:', error);
        setErrorMessage(error.message || 'Failed to connect to the assistant. Please try again.');
        
        // Clean up empty placeholder locally
        setConversations((prev) => 
          prev.map((c) => {
            if (c.id === targetConvId) {
              const cleaned = c.messages.filter((m) => m.id !== assistantMessageId);
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
          await renameConversation(targetConvId, data.title);
          loadConversations();
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

    let targetConvId = activeConversationId;
    let targetMessagesList: Message[] = [];

    if (!targetConvId) {
      // 1. Create chat record in DB
      const resConv = await createConversation('Summarizing prompt...');
      if (!resConv.success || !resConv.conversation) {
        toast.error(resConv.error || 'Failed to create new conversation');
        return;
      }

      targetConvId = resConv.conversation.id;
      setActiveConversationId(targetConvId);

      // 2. Save user message in DB
      const resMsg = await createMessage(targetConvId, 'user', userPrompt);
      if (!resMsg.success || !resMsg.message) {
        toast.error(resMsg.error || 'Failed to save message');
        return;
      }

      targetMessagesList = [resMsg.message];

      // Optimistically push locally
      setConversations((prev) => [
        {
          ...resConv.conversation!,
          messages: targetMessagesList,
        },
        ...prev,
      ]);

      // 3. Initiate stream and title summarizer
      triggerBackgroundTitleGeneration(targetConvId, userPrompt);
      await executeStreamQuery(targetConvId, targetMessagesList);
    } else {
      // Existing chat: save user message in DB first
      const resMsg = await createMessage(targetConvId, 'user', userPrompt);
      if (!resMsg.success || !resMsg.message) {
        toast.error(resMsg.error || 'Failed to save message');
        return;
      }

      const currentConv = conversations.find((c) => c.id === targetConvId);
      if (currentConv) {
        targetMessagesList = [...currentConv.messages, resMsg.message];
        
        // Update state locally
        setConversations((prev) => 
          prev.map((c) => 
            c.id === targetConvId ? { ...c, messages: targetMessagesList } : c
          )
        );

        // Initiate stream
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
      previousMessages.pop(); // Remove the assistant's previous response from local state
    }

    // Update state locally
    setConversations((prev) => 
      prev.map((c) => 
        c.id === targetConvId ? { ...c, messages: previousMessages } : c
      )
    );

    // Remove the old response from database as well
    const resDel = await deleteLastMessage(targetConvId);
    if (!resDel.success) {
      console.warn('Failed to delete last message in DB:', resDel.error);
    }

    // Relaunch stream on previous messages list
    await executeStreamQuery(targetConvId, previousMessages, true);
  };

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  ) || null;

  // Hydration fallback
  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#060608] select-none text-zinc-650 font-bold text-xs tracking-widest animate-pulse">
        AEVA INITIALIZING...
      </div>
    );
  }

  const userName = user?.firstName || 'Explorer';

  return (
    <div className="flex h-screen w-screen overflow-hidden mesh-gradient-bg select-none font-sans text-zinc-100 antialiased">
      {/* Desktop Sidebar */}
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
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="absolute inset-0 bg-[#040405]/80 backdrop-blur-sm"
          />
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
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 text-zinc-400 hover:text-zinc-200 cursor-pointer outline-none md:hidden"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="font-extrabold text-sm tracking-wider uppercase text-zinc-350 ml-1 select-none">
              {activeConversation ? activeConversation.title : 'New Session'}
            </span>
          </div>

          <div className="flex items-center gap-2 pr-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-bold shadow-[0_0_15px_rgba(99,102,241,0.05)] select-none">
              <Sparkles className="w-3 h-3 text-primary animate-pulse" />
              <span>Gemini 2.5 Flash</span>
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

        {/* Local Storage Migration Banner */}
        <MigrationBanner onMigrationSuccess={() => loadConversations(true)} />

        {/* Chat Area Scroll container */}
        <ChatArea
          activeConversation={activeConversation}
          onSelectSuggestion={handleSelectSuggestion}
          userName={userName}
          isStreaming={isStreaming}
          isLoading={isLoading}
          onRegenerate={handleRegenerate}
        />

        {/* Input box */}
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
        userName={userName}
        onSaveName={() => {}} // UserProfile edited in Clerk, make read-only in modal
      />
    </div>
  );
}
