/**
 * Card Component
 * Content container with optional header
 */

import React from 'react'

export interface CardProps {
  children: React.ReactNode
  header?: {
    title: string
    subtitle?: string
    actions?: React.ReactNode
  }
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  onClick?: () => void
  className?: string
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  padding = 'md',
  hover = false,
  onClick,
  className = '',
}) => {
  const baseStyles = 'bg-white border border-stone-200 rounded-2xl overflow-hidden'
  const hoverStyles = hover ? 'hover:border-stone-300 hover:shadow-md transition-all duration-150 cursor-pointer' : ''
  const clickableStyles = onClick ? 'cursor-pointer' : ''

  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${clickableStyles} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {header && (
        <div className="flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-200">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">{header.title}</h3>
            {header.subtitle && (
              <p className="text-xs text-stone-500 mt-0.5">{header.subtitle}</p>
            )}
          </div>
          {header.actions && <div className="flex items-center gap-2">{header.actions}</div>}
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
    </div>
  )
}
