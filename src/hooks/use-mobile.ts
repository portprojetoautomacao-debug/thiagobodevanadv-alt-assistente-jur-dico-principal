import { useEffect, useState } from "react"

const MOBILE_BREAKPOINT = 768

// Helper function to get initial mobile state
function getInitialMobileState(): boolean | undefined {
  if (typeof window === 'undefined') return undefined
  return window.innerWidth < MOBILE_BREAKPOINT
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(getInitialMobileState)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
