"use client"

import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"

function TopLoadingBarInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [visible, setVisible] = React.useState(false)

  // Listen for navigation click events
  React.useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      // Ignore right clicks or modifier clicks (new tab / new window)
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
        return
      }

      const target = (e.target as HTMLElement).closest("a")
      if (!target) return

      const href = target.getAttribute("href")
      if (!href) return

      // Ignore external links, downloads, new tabs, protocols, hash
      if (
        target.target === "_blank" ||
        target.hasAttribute("download") ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        href.startsWith("javascript:")
      ) {
        return
      }

      // If clicking the current path, don't trigger loading
      const currentPathWithSearch =
        window.location.pathname + window.location.search
      if (href === currentPathWithSearch || href === window.location.pathname) {
        return
      }

      // Start the progress bar immediately!
      setIsLoading(true)
      setVisible(true)
      setProgress(28)
    }

    document.addEventListener("click", handleAnchorClick, { capture: true })
    return () => {
      document.removeEventListener("click", handleAnchorClick, { capture: true })
    }
  }, [])

  // Animate progress while waiting
  React.useEffect(() => {
    if (!isLoading) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 65) return prev + 12
        if (prev < 85) return prev + 4
        if (prev < 94) return prev + 1
        return prev
      })
    }, 180)

    // Safety timeout in case navigation is cancelled or takes too long
    const timeout = setTimeout(() => {
      setIsLoading(false)
      setProgress(100)
      setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 300)
    }, 8000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [isLoading])

  // When pathname or searchParams change, navigation has completed!
  React.useEffect(() => {
    if (!visible) return

    setProgress(100)
    setIsLoading(false)

    const timer = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 350)

    return () => clearTimeout(timer)
  }, [pathname, searchParams, visible])

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-100 pointer-events-none h-[3px] bg-transparent"
    >
      <div
        className="h-full bg-emerald-600 shadow-[0_0_8px_rgba(5,150,105,0.7),0_0_4px_rgba(5,150,105,0.4)] transition-all ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transitionDuration: progress === 100 ? "250ms" : "200ms",
        }}
      />
    </div>
  )
}

export function TopLoadingBar() {
  return (
    <React.Suspense fallback={null}>
      <TopLoadingBarInner />
    </React.Suspense>
  )
}
