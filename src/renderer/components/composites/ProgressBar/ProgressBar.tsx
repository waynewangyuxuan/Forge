/**
 * ProgressBar Component
 * Displays execution progress with percentage
 */

import React from 'react'

export interface ProgressBarProps {
  value: number
  max: number
  label?: string
  showPercent?: boolean
  className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  label,
  showPercent = true,
  className = '',
}) => {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0

  return (
    <div className={`w-full ${className}`}>
      {/* Label and percentage */}
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showPercent && (
            <span className="text-sm text-gray-500">
              {value}/{max} ({percent}%)
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
