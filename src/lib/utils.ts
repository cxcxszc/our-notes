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

export function formatReadTimestamp(date: Date): string {
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const timeStr = format(date, "h:mm a");
  return isToday ? `Today • ${timeStr}` : `${format(date, "MMM d")} • ${timeStr}`;
}

export function formatLastSeen(timestamp: number): string {
  if (!timestamp) return "recently";
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;

  if (diff < 60000) return "just now";
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins} ${mins === 1 ? "minute" : "minutes"} ago`;
  }

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = format(date, "h:mm a");
  if (isToday) {
    return `today at ${timeStr}`;
  }
  if (isYesterday) {
    return `yesterday at ${timeStr}`;
  }
  return `${format(date, "MMM d")} at ${timeStr}`;
}
