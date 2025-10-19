import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Capitalizes the first letter of each sentence in a text string.
 * Handles multiple sentences separated by periods, exclamation marks, or question marks.
 */
export function capitalizeSentences(text: string): string {
  if (!text) return text;
  
  // Split by sentence-ending punctuation followed by space
  return text
    .split(/([.!?]\s+)/)
    .map((part, index) => {
      // Only capitalize parts that are actual text (not punctuation)
      if (index % 2 === 0 && part.trim()) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      }
      return part;
    })
    .join('');
}
