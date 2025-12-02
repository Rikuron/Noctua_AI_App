import { useCallback, useEffect, useRef } from 'react'

/**
 * A hook that automatically scrolls a container to the bottom when a trigger value changes.
 * Useful for chat interfaces to keep the latest message in view.
 * 
 * @param trigger - The dependency that triggers the scroll (usually the messages array)
 * @param defaultBehavior - The scroll behavior ('auto' or 'smooth')
 * @returns Object containing the ref to attach to the container and a manual scrollToBottom function
 */
export function useAutoScrollToLatestChat(
  trigger: unknown,
  defaultBehavior: ScrollBehavior = 'auto'
) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = defaultBehavior) => {
      const el = containerRef.current
      if (!el) return
      el.scrollTo({ top: el.scrollHeight, behavior })
    },
    [defaultBehavior]
  )

  useEffect(() => {
    scrollToBottom()
  }, [scrollToBottom, trigger])

  return { containerRef, scrollToBottom }
}