/**
 * Prompt Renderer Engine
 * Handles template variable substitution for prompt templates
 *
 * Domain engine: Pure functions, zero I/O dependencies
 */

export interface PromptVariables {
  [key: string]: string | undefined
}

/**
 * Render a prompt template by substituting variables
 *
 * Supports:
 * - {{variable}} - simple substitution
 * - {{#if variable}}...{{/if}} - conditional blocks
 *
 * @param template - Template string with {{variable}} placeholders
 * @param variables - Key-value pairs for substitution
 * @returns Rendered string with variables substituted
 */
export function renderPrompt(
  template: string,
  variables: PromptVariables
): string {
  let result = template

  // Handle conditional blocks: {{#if variable}}...{{/if}}
  const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g
  result = result.replace(conditionalRegex, (_match, varName: string, content: string) => {
    const value = variables[varName]
    // Include content if variable is defined and non-empty
    if (value !== undefined && value !== null && value !== '') {
      return content
    }
    return ''
  })

  // Handle simple variable substitution: {{variable}}
  const variableRegex = /\{\{(\w+)\}\}/g
  result = result.replace(variableRegex, (_match, varName: string) => {
    const value = variables[varName]
    if (value !== undefined && value !== null) {
      return value
    }
    // Leave placeholder if variable not found (for debugging)
    return `{{${varName}}}`
  })

  return result
}

/**
 * Extract variable names from a template
 *
 * @param template - Template string with {{variable}} placeholders
 * @returns Array of unique variable names
 */
export function extractVariables(template: string): string[] {
  const variables = new Set<string>()

  // Match simple variables
  const variableRegex = /\{\{(\w+)\}\}/g
  let match
  while ((match = variableRegex.exec(template)) !== null) {
    variables.add(match[1])
  }

  // Match conditional variables
  const conditionalRegex = /\{\{#if\s+(\w+)\}\}/g
  while ((match = conditionalRegex.exec(template)) !== null) {
    variables.add(match[1])
  }

  return Array.from(variables)
}

/**
 * Validate that all required variables are provided
 *
 * @param template - Template string
 * @param variables - Provided variables
 * @returns Array of missing variable names (empty if all provided)
 */
export function validateVariables(
  template: string,
  variables: PromptVariables
): string[] {
  const required = extractVariables(template)
  const missing: string[] = []

  for (const varName of required) {
    if (variables[varName] === undefined) {
      missing.push(varName)
    }
  }

  return missing
}
