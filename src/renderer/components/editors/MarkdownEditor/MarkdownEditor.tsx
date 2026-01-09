/**
 * MarkdownEditor Component
 * CodeMirror 6 based Markdown editor
 */

import React, { useRef, useEffect } from 'react'
import { EditorView, keymap, placeholder as placeholderExt } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { oneDark } from '@codemirror/theme-one-dark'

export interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
  readOnly?: boolean
  className?: string
  darkMode?: boolean
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = '',
  minHeight = 400,
  readOnly = false,
  className = '',
  darkMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Initialize CodeMirror
  useEffect(() => {
    if (!containerRef.current) return

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newValue = update.state.doc.toString()
        onChangeRef.current(newValue)
      }
    })

    const extensions = [
      markdown(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      updateListener,
      EditorView.lineWrapping,
      EditorView.editable.of(!readOnly),
      EditorState.readOnly.of(readOnly),
      // Custom theme to match warm industrial design
      EditorView.theme({
        '&': {
          backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
          minHeight: `${minHeight}px`,
        },
        '.cm-content': {
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: '14px',
          lineHeight: '1.6',
          padding: '16px',
          caretColor: darkMode ? '#f59e0b' : '#d97706',
        },
        '.cm-focused': {
          outline: 'none',
        },
        '.cm-gutters': {
          backgroundColor: darkMode ? '#262626' : '#faf9f7',
          borderRight: `1px solid ${darkMode ? '#404040' : '#e5e5e5'}`,
        },
        '.cm-activeLineGutter': {
          backgroundColor: darkMode ? '#404040' : '#f5f5f4',
        },
        '.cm-activeLine': {
          backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
        },
        '.cm-selectionBackground': {
          backgroundColor: darkMode ? 'rgba(245,158,11,0.3)' : 'rgba(217,119,6,0.2)',
        },
        '&.cm-focused .cm-selectionBackground': {
          backgroundColor: darkMode ? 'rgba(245,158,11,0.3)' : 'rgba(217,119,6,0.2)',
        },
        '.cm-cursor': {
          borderLeftColor: darkMode ? '#f59e0b' : '#d97706',
        },
      }),
    ]

    // Add placeholder if provided
    if (placeholder) {
      extensions.push(placeholderExt(placeholder))
    }

    // Add dark theme if enabled
    if (darkMode) {
      extensions.push(oneDark)
    }

    const state = EditorState.create({
      doc: value,
      extensions,
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [readOnly, minHeight, placeholder, darkMode])

  // Update content when value changes externally
  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const currentValue = view.state.doc.toString()
    if (currentValue !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value,
        },
      })
    }
  }, [value])

  return (
    <div
      ref={containerRef}
      className={`
        overflow-hidden rounded-xl border border-[#e5e5e5]
        focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20
        ${readOnly ? 'bg-[#faf9f7]' : 'bg-white'}
        ${className}
      `}
    />
  )
}

MarkdownEditor.displayName = 'MarkdownEditor'
