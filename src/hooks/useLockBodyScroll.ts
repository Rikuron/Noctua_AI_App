import { useEffect } from "react"

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