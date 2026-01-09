/**
 * Input Component
 * Text input with error state and icon support
 */

import React from 'react'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  error?: string
  icon?: React.ReactNode
  label?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ value, onChange, error, icon, label, className = '', disabled, ...props }, ref) => {
    const baseStyles =
      'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-[#1a1a1a] placeholder-[#a3a3a3] transition-all duration-150'

    const stateStyles = error
      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
      : 'border-[#e5e5e5] focus:border-amber-500 focus:ring-2 focus:ring-amber-100'

    const disabledStyles = disabled ? 'bg-[#f5f5f4] text-[#737373] cursor-not-allowed' : ''

    const iconPadding = icon ? 'pl-10' : ''

    return (
      <div className="w-full">
        {label && (
          <label className="block mb-1.5 text-sm font-medium text-[#525252]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a3a3]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`${baseStyles} ${stateStyles} ${disabledStyles} ${iconPadding} ${className} focus:outline-none`}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
