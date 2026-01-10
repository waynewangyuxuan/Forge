/**
 * Tabs Component
 * Tab navigation with bottom border indicator
 */

import React from 'react'

export interface Tab {
  key: string
  label: string
  icon?: React.ReactNode
}

export interface TabsProps {
  tabs: Tab[]
  activeKey: string
  onChange: (key: string) => void
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeKey,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex border-b border-[#e5e5e5] ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey

        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`
              relative px-4 py-3 text-sm font-medium transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-inset
              ${
                isActive
                  ? 'text-amber-600'
                  : 'text-[#737373] hover:text-[#525252]'
              }
            `}
            role="tab"
            aria-selected={isActive}
          >
            <span className="flex items-center gap-2">
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              {tab.label}
            </span>
            {/* Active indicator */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
            )}
          </button>
        )
      })}
    </div>
  )
}

Tabs.displayName = 'Tabs'
