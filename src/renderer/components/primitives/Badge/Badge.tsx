/**
 * Badge Component
 * Status labels with different variants
 */

import React from 'react'

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md'
  pill?: boolean
  children: React.ReactNode
  className?: string
}

const variantStyles = {
  default: 'bg-stone-100 text-stone-600',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
}

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  pill = true,
  children,
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center font-medium'
  const roundedStyle = pill ? 'rounded-full' : 'rounded-md'

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${roundedStyle} ${className}`}
    >
      {children}
    </span>
  )
}
