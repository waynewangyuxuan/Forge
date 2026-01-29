/**
 * PageBanner
 * Inline alert banner for status, warning, error, or success messages.
 */

import React from 'react'

type Variant = 'info' | 'warning' | 'error' | 'success'

const styles: Record<Variant, string> = {
  info: 'mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm',
  warning: 'mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm',
  error: 'mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm',
  success: 'mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm',
}

export interface PageBannerProps {
  variant: Variant
  children: React.ReactNode
}

export const PageBanner: React.FC<PageBannerProps> = ({ variant, children }) => {
  return <div className={styles[variant]}>{children}</div>
}

PageBanner.displayName = 'PageBanner'
