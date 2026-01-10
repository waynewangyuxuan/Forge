/**
 * MarkdownPreview Component
 * Renders Markdown content with styled output
 */

import React from 'react'
import ReactMarkdown from 'react-markdown'

export interface MarkdownPreviewProps {
  content: string
  className?: string
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  className = '',
}) => {
  if (!content) {
    return (
      <div
        className={`
          flex items-center justify-center min-h-[400px]
          text-[#a3a3a3] text-sm italic
          ${className}
        `}
      >
        No content to preview
      </div>
    )
  }

  return (
    <div
      className={`
        prose prose-stone max-w-none
        prose-headings:font-light prose-headings:tracking-tight
        prose-h1:text-2xl prose-h1:border-b prose-h1:border-[#e5e5e5] prose-h1:pb-2
        prose-h2:text-xl prose-h2:mt-6
        prose-h3:text-lg
        prose-p:text-[#525252] prose-p:leading-relaxed
        prose-a:text-amber-600 prose-a:no-underline hover:prose-a:underline
        prose-code:bg-[#f5f5f4] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-normal prose-code:before:content-[''] prose-code:after:content-['']
        prose-pre:bg-[#1a1a1a] prose-pre:text-[#e5e5e5] prose-pre:rounded-xl
        prose-ul:list-disc prose-ol:list-decimal
        prose-li:text-[#525252]
        prose-blockquote:border-l-amber-500 prose-blockquote:bg-amber-50/50 prose-blockquote:py-1 prose-blockquote:not-italic
        prose-hr:border-[#e5e5e5]
        prose-table:border-collapse
        prose-th:bg-[#faf9f7] prose-th:border prose-th:border-[#e5e5e5] prose-th:px-3 prose-th:py-2
        prose-td:border prose-td:border-[#e5e5e5] prose-td:px-3 prose-td:py-2
        p-6 rounded-xl border border-[#e5e5e5] bg-white
        ${className}
      `}
    >
      <ReactMarkdown
        components={{
          // Custom checkbox rendering for task lists
          input: ({ checked, ...props }) => {
            if (props.type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 rounded border-[#e5e5e5] text-amber-500 focus:ring-amber-500"
                  {...props}
                />
              )
            }
            return <input {...props} />
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

MarkdownPreview.displayName = 'MarkdownPreview'
