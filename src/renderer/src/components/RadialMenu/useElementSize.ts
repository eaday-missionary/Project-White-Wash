import { useEffect, useRef, useState } from 'react'

export function useElementSize(): {
  ref: React.RefObject<HTMLDivElement | null>
  width: number
  height: number
} {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize((previous) =>
        previous.width === width && previous.height === height ? previous : { width, height }
      )
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return { ref, ...size }
}
