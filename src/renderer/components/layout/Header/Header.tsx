/**
 * Header Component
 * Top navigation bar with logo and settings
 */

import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../../primitives/Button'

export const Header: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const isSettingsPage = location.pathname === '/settings'

  return (
    <header className="h-14 border-b border-stone-200 bg-white px-4 flex items-center justify-between flex-shrink-0">
      {/* Logo and Title */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <span className="text-lg font-bold text-stone-900">Forge</span>
      </button>

      {/* Settings Button */}
      <Button
        variant={isSettingsPage ? 'secondary' : 'ghost'}
        size="sm"
        iconOnly
        onClick={() => navigate('/settings')}
        icon={
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        }
        aria-label="Settings"
      />
    </header>
  )
}
