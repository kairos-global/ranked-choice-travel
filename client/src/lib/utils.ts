import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function generateShareableUrl(pollId: string, type: 'vote' | 'results', adminKey?: string): string {
  const baseUrl = window.location.origin;
  if (type === 'vote') {
    return `${baseUrl}/poll/${pollId}`;
  } else {
    return `${baseUrl}/results/${pollId}${adminKey ? `?key=${adminKey}` : ''}`;
  }
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
