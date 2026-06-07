import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNoteTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return formatDistanceToNow(date, { addSuffix: true });
  if (diff < 86400000) return format(date, "h:mm a");
  return format(date, "MMM d, h:mm a");
}

export function formatLastSeen(timestamp: number): string {
  if (!timestamp) return "a while ago";
  const date = new Date(timestamp);
  const diff = Date.now() - timestamp;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return formatDistanceToNow(date, { addSuffix: true });
  return format(date, "MMM d 'at' h:mm a");
}
