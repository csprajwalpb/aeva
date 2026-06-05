'use client';

import React, { useEffect, useState } from 'react';
import { Database, ArrowRight, X } from 'lucide-react';
import { importConversations } from '@/actions/chat';
import toast from 'react-hot-toast';

interface MigrationBannerProps {
  onMigrationSuccess: () => void;
}

export default function MigrationBanner({ onMigrationSuccess }: MigrationBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [localChatsCount, setLocalChatsCount] = useState(0);

  useEffect(() => {
    // Check if client local chats exist and haven't been dismissed or imported
    const localData = localStorage.getItem('aeva_conversations');
    const isDismissed = localStorage.getItem('aeva_migration_dismissed') === 'true';

    if (localData && !isDismissed) {
      try {
        const chats = JSON.parse(localData);
        if (Array.isArray(chats) && chats.length > 0) {
          setLocalChatsCount(chats.length);
          setShowBanner(true);
        }
      } catch (e) {
        console.error('Error parsing local storage chats:', e);
      }
    }
  }, []);

  const handleImport = async () => {
    setIsMigrating(true);
    const localData = localStorage.getItem('aeva_conversations');
    if (!localData) {
      setShowBanner(false);
      setIsMigrating(false);
      return;
    }

    try {
      const chats = JSON.parse(localData);
      
      const res = await importConversations(chats);
      
      if (res.success) {
        toast.success(`Successfully imported ${chats.length} local chats to your account!`);
        // Clear local storage conversations and flags
        localStorage.removeItem('aeva_conversations');
        localStorage.setItem('aeva_migration_dismissed', 'true');
        setShowBanner(false);
        onMigrationSuccess(); // Refresh DB conversation lists
      } else {
        toast.error(res.error || 'Failed to import conversations.');
      }
    } catch (error: any) {
      toast.error('An error occurred during import.');
      console.error(error);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('aeva_migration_dismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pt-4 select-none animate-fade-in">
      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-md shadow-[0_0_30px_rgba(99,102,241,0.05)] overflow-hidden">
        {/* Glowing visual effect in background */}
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl w-32 h-32 -left-10 -top-10 pulse-glow" />

        <div className="flex items-center gap-3.5 z-10">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 border border-primary/15">
            <Database className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex flex-col text-left">
            <h4 className="font-bold text-sm text-zinc-100">
              Import Local Dialogues ({localChatsCount})
            </h4>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed mt-0.5">
              Sync your local browser history with your cloud account to access them from any device.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 w-full sm:w-auto z-10 justify-end">
          <button
            onClick={handleDismiss}
            className="p-2 rounded-lg hover:bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 text-xs font-bold transition-all duration-200 cursor-pointer outline-none active:scale-95"
            title="Dismiss import option"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={handleImport}
            disabled={isMigrating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold transition-all duration-200 cursor-pointer hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:bg-indigo-650 active:scale-95 outline-none disabled:opacity-50"
          >
            {isMigrating ? (
              <span>Importing...</span>
            ) : (
              <>
                <span>Sync to Cloud</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
