import { useCallback, useEffect, useRef } from 'react'

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