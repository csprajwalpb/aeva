export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isRegenerated?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdTime: number;
  messages: Message[];
}

export interface UserProfile {
  name: string;
  avatarSeed: string; // for dynamic visual avatars
}

export interface AppSettings {
  userName: string;
  userAvatarSeed: string;
}
