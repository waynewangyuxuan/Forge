/**
 * PageHeader
 * Shared header bar for pages with title and optional actions.
 */

import React from 'react'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-light tracking-tight text-[#1a1a1a]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[#a3a3a3] mt-1 font-mono">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}

PageHeader.displayName = 'PageHeader'
