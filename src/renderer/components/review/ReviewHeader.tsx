/**
 * ReviewHeader
 * Top bar for the Review page with title and optional actions.
 */

import React from 'react'

export interface ReviewHeaderProps {
  title?: string
  actions?: React.ReactNode
}

export const ReviewHeader: React.FC<ReviewHeaderProps> = ({
  title = 'Review',
  actions,
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-light tracking-tight text-[#1a1a1a]">
        {title}
      </h1>
      {actions}
    </div>
  )
}

ReviewHeader.displayName = 'ReviewHeader'
