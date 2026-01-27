/**
 * ReviewBanner
 * Inline alert banner for status/error messages on the Review page.
 * Wrapper around PageBanner with Review-specific variant subset.
 */

import React from 'react'
import { PageBanner } from '../layout'

type Variant = 'warning' | 'error'

export interface ReviewBannerProps {
  variant: Variant
  children: React.ReactNode
}

export const ReviewBanner: React.FC<ReviewBannerProps> = ({ variant, children }) => {
  return <PageBanner variant={variant}>{children}</PageBanner>
}

ReviewBanner.displayName = 'ReviewBanner'
