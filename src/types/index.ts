export interface User {
  uid: string;
  email: string;
  displayName: string;
  pairCode: string;
  partnerId?: string;
  pairId?: string;
  createdAt: Date;
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
  reactions: Record<string, string[]>; // emoji -> [userId]
  isQuickAction?: boolean;
  quickActionType?: string;
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
  { emoji: "❤️", label: "I Love You", message: "❤️ I love you so much!" },
  { emoji: "🥺", label: "Miss You", message: "🥺 I miss you so much right now..." },
  { emoji: "🌸", label: "Thinking Of You", message: "🌸 Just thinking of you~" },
  { emoji: "☕", label: "Have You Eaten?", message: "☕ Hey, have you eaten yet? Don't forget to take care of yourself!" },
  { emoji: "💤", label: "Rest Well", message: "💤 Get some rest, okay? Sweet dreams 🌙" },
];
