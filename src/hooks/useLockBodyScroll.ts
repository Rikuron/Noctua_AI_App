import { useEffect } from "react"

/**
 * Locks the body scroll when the component is mounted or the condition is met.
 * Useful for modals or overlays to prevent background scrolling.
 * 
 * @param isLocked - Whether the scroll should be locked (default: true)
 */
export function useLockBodyScroll(isLocked: boolean = true) {
  useEffect(() => {
    if (!isLocked) return
    
    // Save original style
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden' // Lock scroll
    
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [isLocked])
}