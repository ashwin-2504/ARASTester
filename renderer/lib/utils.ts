import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind CSS classes with clsx and tailwind-merge.
 * This is a standard utility used in Shadcn components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
