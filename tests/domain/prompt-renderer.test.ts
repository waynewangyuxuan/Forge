/**
 * Prompt Renderer Engine Tests
 */

import { describe, it, expect } from 'vitest'
import {
  renderPrompt,
  extractVariables,
  validateVariables,
} from '../../src/main/domain/engines/prompt-renderer'

describe('renderPrompt', () => {
  it('should substitute simple variables', () => {
    const template = 'Hello, {{name}}!'
    const result = renderPrompt(template, { name: 'World' })
    expect(result).toBe('Hello, World!')
  })

  it('should substitute multiple variables', () => {
    const template = '{{greeting}}, {{name}}!'
    const result = renderPrompt(template, { greeting: 'Hello', name: 'World' })
    expect(result).toBe('Hello, World!')
  })

  it('should handle missing variables by keeping placeholder', () => {
    const template = 'Hello, {{name}}!'
    const result = renderPrompt(template, {})
    expect(result).toBe('Hello, {{name}}!')
  })

  it('should handle empty string variables', () => {
    const template = 'Hello, {{name}}!'
    const result = renderPrompt(template, { name: '' })
    expect(result).toBe('Hello, !')
  })

  it('should handle conditional blocks with truthy value', () => {
    const template = '{{#if optional}}Optional content{{/if}}'
    const result = renderPrompt(template, { optional: 'yes' })
    expect(result).toBe('Optional content')
  })

  it('should handle conditional blocks with falsy value', () => {
    const template = '{{#if optional}}Optional content{{/if}}'
    const result = renderPrompt(template, { optional: '' })
    expect(result).toBe('')
  })

  it('should handle conditional blocks with undefined value', () => {
    const template = '{{#if optional}}Optional content{{/if}}'
    const result = renderPrompt(template, {})
    expect(result).toBe('')
  })

  it('should handle variables inside conditional blocks', () => {
    const template = '{{#if regulation}}Regulation: {{regulation}}{{/if}}'
    const result = renderPrompt(template, { regulation: 'strict' })
    expect(result).toBe('Regulation: strict')
  })

  it('should handle multiline templates', () => {
    const template = `# Project: {{name}}

Description: {{description}}

{{#if notes}}
Notes: {{notes}}
{{/if}}`

    const result = renderPrompt(template, {
      name: 'Test',
      description: 'A test project',
      notes: 'Some notes',
    })

    expect(result).toContain('# Project: Test')
    expect(result).toContain('Description: A test project')
    expect(result).toContain('Notes: Some notes')
  })
})

describe('extractVariables', () => {
  it('should extract simple variables', () => {
    const template = 'Hello, {{name}}!'
    const vars = extractVariables(template)
    expect(vars).toContain('name')
  })

  it('should extract multiple unique variables', () => {
    const template = '{{a}} {{b}} {{a}}'
    const vars = extractVariables(template)
    expect(vars).toHaveLength(2)
    expect(vars).toContain('a')
    expect(vars).toContain('b')
  })

  it('should extract conditional variables', () => {
    const template = '{{#if optional}}content{{/if}}'
    const vars = extractVariables(template)
    expect(vars).toContain('optional')
  })

  it('should return empty array for template without variables', () => {
    const template = 'No variables here'
    const vars = extractVariables(template)
    expect(vars).toHaveLength(0)
  })
})

describe('validateVariables', () => {
  it('should return empty array when all variables provided', () => {
    const template = '{{a}} {{b}}'
    const missing = validateVariables(template, { a: '1', b: '2' })
    expect(missing).toHaveLength(0)
  })

  it('should return missing variable names', () => {
    const template = '{{a}} {{b}} {{c}}'
    const missing = validateVariables(template, { a: '1' })
    expect(missing).toContain('b')
    expect(missing).toContain('c')
    expect(missing).not.toContain('a')
  })

  it('should not treat empty string as missing', () => {
    const template = '{{a}}'
    const missing = validateVariables(template, { a: '' })
    expect(missing).toHaveLength(0)
  })
})
