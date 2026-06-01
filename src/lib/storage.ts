import { Conversation, AppSettings } from '@/types/chat';

const STORAGE_KEYS = {
  CONVERSATIONS: 'aeva_conversations',
  SETTINGS: 'aeva_settings',
};

// Safe access helper
const isClient = typeof window !== 'undefined';

export function getSavedConversations(): Conversation[] {
  if (!isClient) return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading conversations from localStorage:', error);
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  if (!isClient) return;
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (error) {
    console.error('Error saving conversations to localStorage:', error);
  }
}

export function getAppSettings(): AppSettings {
  const defaultSettings: AppSettings = {
    userName: 'Explorer',
    userAvatarSeed: 'avatar-explorer',
  };

  if (!isClient) return defaultSettings;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : defaultSettings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return defaultSettings;
  }
}

export function saveAppSettings(settings: AppSettings): void {
  if (!isClient) return;
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}
