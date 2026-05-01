import { useEffect } from "react"

/**
 * Hook that executes a callback when the Escape key is pressed.
 */
export function useEscapeKey(onEscape: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscape()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onEscape])
}
