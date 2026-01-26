/**
 * ReviewBanner
 * Inline alert banner for status/error messages on the Review page.
 */

import React from 'react'

type Variant = 'warning' | 'error'

const styles: Record<Variant, string> = {
  warning: 'mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm',
  error: 'mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm',
}

export interface ReviewBannerProps {
  variant: Variant
  children: React.ReactNode
}

export const ReviewBanner: React.FC<ReviewBannerProps> = ({ variant, children }) => {
  return <div className={styles[variant]}>{children}</div>
}

ReviewBanner.displayName = 'ReviewBanner'
