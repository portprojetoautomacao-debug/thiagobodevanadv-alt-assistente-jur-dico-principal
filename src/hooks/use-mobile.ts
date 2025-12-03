import { useEffect, useState, useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 768

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

function getServerSnapshot() {
  return false
}

function subscribe(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", callback)
  window.addEventListener("resize", callback)
  return () => {
    mql.removeEventListener("change", callback)
    window.removeEventListener("resize", callback)
  }
}

export function useIsMobile() {
  const isMobile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return isMobile
}
