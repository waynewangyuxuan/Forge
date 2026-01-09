/**
 * SettingsPage
 * Application settings page (placeholder for M2)
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/primitives/Button'

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          icon={
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          }
        >
          Back
        </Button>
        <h1 className="text-2xl font-bold text-stone-900">Settings</h1>
      </div>

      <div className="bg-stone-50 rounded-xl p-6 text-center text-stone-500">
        Settings page will be implemented in a future milestone.
      </div>
    </div>
  )
}
