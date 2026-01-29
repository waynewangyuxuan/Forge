/**
 * PageLoading
 * Centered loading spinner for page content areas.
 */

import React from 'react'
import { Spinner } from '../primitives/Spinner'

export interface PageLoadingProps {
  size?: 'sm' | 'md' | 'lg'
}

export const PageLoading: React.FC<PageLoadingProps> = ({ size = 'lg' }) => {
  return (
    <div className="flex items-center justify-center h-full">
      <Spinner size={size} />
    </div>
  )
}

PageLoading.displayName = 'PageLoading'
