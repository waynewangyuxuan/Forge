/**
 * Scaffold Writer Engine
 * Transforms ScaffoldOutput JSON into multiple markdown files
 *
 * Domain engine: Pure functions that generate file content
 * Actual file I/O is handled by the use case via IFileSystemAdapter
 */

import type { ScaffoldOutput, ScaffoldMilestone, ScaffoldTask } from '@shared/types'

/**
 * A file to be written by the use case
 */
export interface ScaffoldFile {
  path: string // Relative path from project root, e.g., "META/TODO.md"
  content: string
}

/**
 * Options for scaffold file generation
 */
export interface ScaffoldWriterOptions {
  projectName: string
  timestamp?: string // ISO 8601, defaults to now
}

/**
 * Generate all scaffold files from ScaffoldOutput
 *
 * @param scaffold - Validated scaffold output from AI
 * @param options - Writer options
 * @returns Array of files to write
 */
export function generateScaffoldFiles(
  scaffold: ScaffoldOutput,
  options: ScaffoldWriterOptions
): ScaffoldFile[] {
  const timestamp = options.timestamp || new Date().toISOString()
  const files: ScaffoldFile[] = []

  // 1. Generate TODO.md (lightweight index)
  files.push({
    path: 'META/TODO.md',
    content: generateTodoMd(scaffold, options.projectName, timestamp),
  })

  // 2. Generate MILESTONES/*.md (detailed tasks per milestone)
  for (const milestone of scaffold.milestones) {
    const filename = generateMilestoneFilename(milestone)
    files.push({
      path: `META/MILESTONES/${filename}`,
      content: generateMilestoneMd(milestone),
    })
  }

  // 3. Generate CONTEXT/architecture.md
  files.push({
    path: 'META/CONTEXT/architecture.md',
    content: generateContextFile('Architecture', scaffold.context.architecture),
  })

  // 4. Generate CONTEXT/conventions.md
  files.push({
    path: 'META/CONTEXT/conventions.md',
    content: generateContextFile('Conventions', scaffold.context.conventions),
  })

  return files
}

/**
 * Generate TODO.md - lightweight task index
 */
function generateTodoMd(
  scaffold: ScaffoldOutput,
  projectName: string,
  timestamp: string
): string {
  const lines: string[] = []

  lines.push('# TODO')
  lines.push('')
  lines.push(`> Project: ${projectName}`)
  lines.push(`> Generated: ${timestamp}`)
  lines.push('')

  let totalTasks = 0

  for (const milestone of scaffold.milestones) {
    lines.push(`## ${milestone.id}: ${milestone.name}`)

    for (const task of milestone.tasks) {
      lines.push(`- [ ] ${task.id}. ${task.title}`)
      totalTasks++
    }

    lines.push('')
  }

  lines.push('---')
  lines.push(`Total: ${totalTasks} tasks across ${scaffold.milestones.length} milestones`)
  lines.push('')

  return lines.join('\n')
}

/**
 * Generate milestone filename from milestone data
 */
function generateMilestoneFilename(milestone: ScaffoldMilestone): string {
  // Convert name to kebab-case for filename
  const slug = milestone.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return `${milestone.id}-${slug}.md`
}

/**
 * Generate MILESTONES/M{N}-*.md - detailed task descriptions
 */
function generateMilestoneMd(milestone: ScaffoldMilestone): string {
  const lines: string[] = []

  lines.push(`# ${milestone.id}: ${milestone.name}`)
  lines.push('')
  lines.push(`> ${milestone.description}`)
  lines.push('')
  lines.push('## Tasks')
  lines.push('')

  for (const task of milestone.tasks) {
    lines.push(generateTaskSection(task))
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Generate a single task section for milestone file
 */
function generateTaskSection(task: ScaffoldTask): string {
  const lines: string[] = []

  lines.push(`### ${task.id}. ${task.title}`)
  lines.push('')
  lines.push('**Description:**')
  lines.push(task.description)
  lines.push('')
  lines.push('**Verification:**')
  lines.push(task.verification)
  lines.push('')

  if (task.depends.length > 0) {
    lines.push(`**Depends:** ${task.depends.join(', ')}`)
  } else {
    lines.push('**Depends:** none')
  }

  lines.push('')
  lines.push('---')

  return lines.join('\n')
}

/**
 * Generate CONTEXT/*.md files
 */
function generateContextFile(title: string, content: string): string {
  const lines: string[] = []

  lines.push(`# ${title}`)
  lines.push('')
  lines.push(content)
  lines.push('')

  return lines.join('\n')
}

/**
 * Generate CLAUDE.md from template and scaffold data
 *
 * @param template - CLAUDE.md template with placeholders
 * @param scaffold - Scaffold output for variable substitution
 * @param projectName - Project name
 * @returns Rendered CLAUDE.md content
 */
export function generateClaudeMd(
  template: string,
  scaffold: ScaffoldOutput,
  projectName: string
): string {
  // Simple variable substitution
  let content = template

  // Project summary
  const projectSummary = `**${projectName}**: ${scaffold.project.description}`
  content = content.replace(/\{\{project_summary\}\}/g, projectSummary)

  // Tech stack - extract from architecture context
  content = content.replace(/\{\{tech_stack\}\}/g, scaffold.context.architecture)

  return content
}
