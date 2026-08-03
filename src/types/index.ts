export interface User {
  uid: string;
  email: string;
  displayName: string;
  pairCode: string;
  partnerId?: string;
  pairId?: string;
  createdAt: Date;
  notificationTokens?: string[];
  photoURL?: string | null;
}

export interface Note {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  pairId: string;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  reactions: Record<string, string[]>;
  isQuickAction?: boolean;
  quickActionType?: string;
  isRead?: boolean;
  readAt?: Date | null;
  lastViewedAt?: Date | null;
}

export interface SharedPhoto {
  id: string;
  pairId: string;
  authorId: string;
  authorName: string;
  imageUrl: string;
  storagePath: string;
  caption?: string;
  createdAt: Date;
}

export type ReactionEmoji = "❤️" | "🥹" | "😍" | "😂" | "🔥";

export const REACTIONS: ReactionEmoji[] = ["❤️", "🥹", "😍", "😂", "🔥"];

export interface Pair {
  id: string;
  user1Id: string;
  user2Id: string;
  pairCode: string;
  createdAt: Date;
}

export type ThemeMode =
  | "light"
  | "dark"
  | "system"
  | "spiderman-classic"
  | "spiderman-verse"
  | "symbiote"
  | "barbie-dream"
  | "barbie-glam"
  | "barbie-night";

export interface SpecialThemeOption {
  id: ThemeMode;
  label: string;
  group: "Option 1" | "Option 2";
}

export const SPECIAL_THEMES: SpecialThemeOption[] = [
  { id: "spiderman-classic", label: "1", group: "Option 1" },
  { id: "spiderman-verse", label: "2", group: "Option 1" },
  { id: "symbiote", label: "3", group: "Option 1" },
  { id: "barbie-dream", label: "1", group: "Option 2" },
  { id: "barbie-glam", label: "2", group: "Option 2" },
  { id: "barbie-night", label: "3", group: "Option 2" },
];

export interface PresenceData {
  online: boolean;
  lastSeen: number;
  displayName: string;
}

export interface QuickAction {
  emoji: string;
  label: string;
  message: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
  { emoji: "❤️", label: "Love you", message: "❤️ I love you so much!" },
  { emoji: "🥺", label: "Miss you", message: "🥺 I miss you so much right now..." },
  { emoji: "🌸", label: "Thinking of you", message: "🌸 Just thinking of you." },
  { emoji: "☕", label: "Check in", message: "☕ Hey, have you eaten yet? Don't forget to take care of yourself." },
  { emoji: "💤", label: "Rest well", message: "💤 Get some rest, okay? Sweet dreams 🌙" },
];