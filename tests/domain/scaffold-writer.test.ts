/**
 * Scaffold Writer Engine Tests
 */

import { describe, it, expect } from 'vitest'
import {
  generateScaffoldFiles,
  generateClaudeMd,
} from '../../src/main/domain/engines/scaffold-writer'
import type { ScaffoldOutput } from '../../src/shared/types'

const validScaffold: ScaffoldOutput = {
  project: {
    name: 'test-project',
    description: 'A test project for demonstration',
  },
  context: {
    architecture: 'Clean architecture with layers',
    conventions: 'TypeScript, ESLint, Prettier',
  },
  milestones: [
    {
      id: 'M1',
      name: 'Project Setup',
      description: 'Initial project configuration',
      tasks: [
        {
          id: '001',
          title: 'Initialize npm project',
          description: 'Run npm init and create package.json',
          verification: 'package.json exists with correct name',
          depends: [],
        },
        {
          id: '002',
          title: 'Configure TypeScript',
          description: 'Add tsconfig.json with strict settings',
          verification: 'tsc compiles without errors',
          depends: ['001'],
        },
      ],
    },
    {
      id: 'M2',
      name: 'Core Features',
      description: 'Implement core functionality',
      tasks: [
        {
          id: '003',
          title: 'Create data model',
          description: 'Define TypeScript interfaces for data',
          verification: 'Types compile without errors',
          depends: ['002'],
        },
      ],
    },
  ],
}

describe('generateScaffoldFiles', () => {
  const options = { projectName: 'test-project', timestamp: '2024-01-15T10:00:00Z' }

  it('should generate correct number of files', () => {
    const files = generateScaffoldFiles(validScaffold, options)

    // TODO.md + 2 milestone files + 2 context files = 5
    expect(files).toHaveLength(5)
  })

  it('should generate TODO.md with correct path', () => {
    const files = generateScaffoldFiles(validScaffold, options)
    const todoFile = files.find((f) => f.path === 'META/TODO.md')

    expect(todoFile).toBeDefined()
  })

  it('should generate TODO.md with project name and timestamp', () => {
    const files = generateScaffoldFiles(validScaffold, options)
    const todoFile = files.find((f) => f.path === 'META/TODO.md')!

    expect(todoFile.content).toContain('Project: test-project')
    expect(todoFile.content).toContain('2024-01-15T10:00:00Z')
  })

  it('should generate TODO.md with all tasks as unchecked', () => {
    const files = generateScaffoldFiles(validScaffold, options)
    const todoFile = files.find((f) => f.path === 'META/TODO.md')!

    expect(todoFile.content).toContain('- [ ] 001. Initialize npm project')
    expect(todoFile.content).toContain('- [ ] 002. Configure TypeScript')
    expect(todoFile.content).toContain('- [ ] 003. Create data model')
  })

  it('should generate TODO.md with milestone headers', () => {
    const files = generateScaffoldFiles(validScaffold, options)
    const todoFile = files.find((f) => f.path === 'META/TODO.md')!

    expect(todoFile.content).toContain('## M1: Project Setup')
    expect(todoFile.content).toContain('## M2: Core Features')
  })

  it('should generate TODO.md with task count summary', () => {
    const files = generateScaffoldFiles(validScaffold, options)
    const todoFile = files.find((f) => f.path === 'META/TODO.md')!

    expect(todoFile.content).toContain('Total: 3 tasks across 2 milestones')
  })

  it('should generate milestone files with kebab-case names', () => {
    const files = generateScaffoldFiles(validScaffold, options)

    expect(files.some((f) => f.path === 'META/MILESTONES/M1-project-setup.md')).toBe(true)
    expect(files.some((f) => f.path === 'META/MILESTONES/M2-core-features.md')).toBe(true)
  })

  it('should generate milestone files with task details', () => {
    const files = generateScaffoldFiles(validScaffold, options)
    const m1File = files.find((f) => f.path === 'META/MILESTONES/M1-project-setup.md')!

    expect(m1File.content).toContain('# M1: Project Setup')
    expect(m1File.content).toContain('### 001. Initialize npm project')
    expect(m1File.content).toContain('**Description:**')
    expect(m1File.content).toContain('Run npm init and create package.json')
    expect(m1File.content).toContain('**Verification:**')
    expect(m1File.content).toContain('package.json exists with correct name')
  })

  it('should generate milestone files with dependencies', () => {
    const files = generateScaffoldFiles(validScaffold, options)
    const m1File = files.find((f) => f.path === 'META/MILESTONES/M1-project-setup.md')!

    expect(m1File.content).toContain('**Depends:** none')
    expect(m1File.content).toContain('**Depends:** 001')
  })

  it('should generate context files', () => {
    const files = generateScaffoldFiles(validScaffold, options)

    const archFile = files.find((f) => f.path === 'META/CONTEXT/architecture.md')
    const convFile = files.find((f) => f.path === 'META/CONTEXT/conventions.md')

    expect(archFile).toBeDefined()
    expect(archFile!.content).toContain('# Architecture')
    expect(archFile!.content).toContain('Clean architecture with layers')

    expect(convFile).toBeDefined()
    expect(convFile!.content).toContain('# Conventions')
    expect(convFile!.content).toContain('TypeScript, ESLint, Prettier')
  })

  it('should use current timestamp if not provided', () => {
    const files = generateScaffoldFiles(validScaffold, { projectName: 'test' })
    const todoFile = files.find((f) => f.path === 'META/TODO.md')!

    // Should contain a timestamp in ISO format
    expect(todoFile.content).toMatch(/Generated: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })
})

describe('generateClaudeMd', () => {
  const template = `# CLAUDE.md

## Project Summary
{{project_summary}}

## Tech Stack
{{tech_stack}}
`

  it('should substitute project_summary variable', () => {
    const result = generateClaudeMd(template, validScaffold, 'my-project')

    expect(result).toContain('**my-project**: A test project for demonstration')
  })

  it('should substitute tech_stack variable', () => {
    const result = generateClaudeMd(template, validScaffold, 'my-project')

    expect(result).toContain('Clean architecture with layers')
  })

  it('should preserve template structure', () => {
    const result = generateClaudeMd(template, validScaffold, 'my-project')

    expect(result).toContain('# CLAUDE.md')
    expect(result).toContain('## Project Summary')
    expect(result).toContain('## Tech Stack')
  })
})
