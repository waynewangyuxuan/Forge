/**
 * useUnsavedChanges Hook
 * Warns users when they try to navigate away with unsaved changes
 */

import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'

/**
 * Hook to warn users about unsaved changes when navigating away
 *
 * @param hasUnsaved - Whether there are unsaved changes
 * @param message - Custom warning message
 */
export function useUnsavedChanges(
  hasUnsaved: boolean,
  message = 'You have unsaved changes. Are you sure you want to leave?'
): void {
  // Block navigation with React Router
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsaved && currentLocation.pathname !== nextLocation.pathname
  )

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmed = window.confirm(message)
      if (confirmed) {
        blocker.proceed()
      } else {
        blocker.reset()
      }
    }
  }, [blocker, message])

  // Handle browser beforeunload event (closing tab, refreshing page)
  useEffect(() => {
    if (!hasUnsaved) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = message
      return message
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsaved, message])
}
