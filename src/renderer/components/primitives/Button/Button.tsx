/**
 * Button Component
 * Primary UI button with multiple variants
 */

import React from 'react'
import { Spinner } from '../Spinner/Spinner'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  iconOnly?: boolean
}

const variantStyles = {
  primary:
    'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100',
  secondary:
    'bg-[#f5f5f4] text-[#525252] hover:bg-[#e5e5e5] active:bg-[#d4d4d4] disabled:opacity-50',
  ghost:
    'bg-transparent text-amber-600 hover:bg-amber-50 active:bg-amber-100 disabled:opacity-50',
  destructive:
    'bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 disabled:opacity-50',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
}

const iconOnlySizeStyles = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconOnly = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2'

    const sizeStyle = iconOnly ? iconOnlySizeStyles[size] : sizeStyles[size]

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyle} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Spinner
            size={size === 'lg' ? 'md' : 'sm'}
            color={variant === 'primary' ? 'white' : 'amber'}
          />
        ) : icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        {!iconOnly && children && (
          <span className={loading ? 'opacity-0' : ''}>{children}</span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
