/**
 * ReviewLayout
 * Shared shell for the Review page: header, notices, tabs, scrollable content, feedback slot.
 */

import React from 'react'

export interface ReviewLayoutProps {
  header: React.ReactNode
  statusNotice?: React.ReactNode
  errorNotice?: React.ReactNode
  tabs: React.ReactNode
  content: React.ReactNode
  feedback?: React.ReactNode
}

export const ReviewLayout: React.FC<ReviewLayoutProps> = ({
  header,
  statusNotice,
  errorNotice,
  tabs,
  content,
  feedback,
}) => {
  return (
    <div
      className="flex flex-col h-full min-h-0 overflow-hidden p-6"
      data-page="review"
    >
      {header}
      {statusNotice}
      {errorNotice}
      {tabs}

      <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {content}
        </div>
        {feedback}
      </div>
    </div>
  )
}

ReviewLayout.displayName = 'ReviewLayout'
