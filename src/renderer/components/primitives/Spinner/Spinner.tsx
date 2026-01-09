/**
 * Spinner Component
 * Loading indicator with different sizes and colors
 */

import React from 'react'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'amber' | 'white' | 'stone'
  className?: string
}

const sizeStyles = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

const colorStyles = {
  amber: 'text-amber-500',
  white: 'text-white',
  stone: 'text-stone-500',
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'amber',
  className = '',
}) => {
  return (
    <svg
      className={`animate-spin ${sizeStyles[size]} ${colorStyles[color]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
