import { useEffect, useRef, useState } from 'react'

interface Options extends IntersectionObserverInit {
  triggerOnce?: boolean
}

export function useIntersection<T extends Element>(
  options: Options = {},
): [React.RefObject<T | null>, boolean] {
  const { triggerOnce = false, ...observerOptions } = options
  const ref = useRef<T | null>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true)
        if (triggerOnce) observer.disconnect()
      } else if (!triggerOnce) {
        setIsIntersecting(false)
      }
    }, observerOptions)

    observer.observe(el)
    return () => observer.disconnect()
  }, [triggerOnce, observerOptions.threshold, observerOptions.rootMargin])

  return [ref, isIntersecting]
}
