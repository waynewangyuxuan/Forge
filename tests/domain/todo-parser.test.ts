/**
 * Todo Parser Engine Unit Tests
 */

import { describe, it, expect } from 'vitest'
import {
  parseTodoIndex,
  parseMilestoneDetail,
  buildExecutionPlan,
  parseExecutionPlan,
} from '../../src/main/domain/engines/todo-parser'

describe('parseTodoIndex', () => {
  it('should parse project name from metadata', () => {
    const content = `# TODO

> Project: my-awesome-project
> Generated: 2024-01-01T00:00:00.000Z

## M1: Setup
- [ ] 001. Initialize project
`
    const result = parseTodoIndex(content)

    expect(result.projectName).toBe('my-awesome-project')
  })

  it('should parse milestone headers', () => {
    const content = `# TODO

## M1: Project Setup
- [ ] 001. Task one

## M2: Core Features
- [ ] 002. Task two
`
    const result = parseTodoIndex(content)

    expect(result.milestones).toHaveLength(2)
    expect(result.milestones[0].id).toBe('M1')
    expect(result.milestones[0].name).toBe('Project Setup')
    expect(result.milestones[1].id).toBe('M2')
    expect(result.milestones[1].name).toBe('Core Features')
  })

  it('should parse pending tasks', () => {
    const content = `# TODO

## M1: Setup
- [ ] 001. Initialize project
- [ ] 002. Add dependencies
`
    const result = parseTodoIndex(content)

    expect(result.milestones[0].tasks).toHaveLength(2)
    expect(result.milestones[0].tasks[0]).toEqual({
      id: '001',
      title: 'Initialize project',
      completed: false,
      milestoneId: 'M1',
    })
    expect(result.milestones[0].tasks[1]).toEqual({
      id: '002',
      title: 'Add dependencies',
      completed: false,
      milestoneId: 'M1',
    })
  })

  it('should parse completed tasks', () => {
    const content = `# TODO

## M1: Setup
- [x] 001. Completed task
- [X] 002. Also completed
- [ ] 003. Pending task
`
    const result = parseTodoIndex(content)

    expect(result.milestones[0].tasks[0].completed).toBe(true)
    expect(result.milestones[0].tasks[1].completed).toBe(true)
    expect(result.milestones[0].tasks[2].completed).toBe(false)
  })

  it('should handle empty content', () => {
    const result = parseTodoIndex('')

    expect(result.milestones).toHaveLength(0)
    expect(result.projectName).toBeUndefined()
  })

  it('should handle milestone with no tasks', () => {
    const content = `# TODO

## M1: Empty Milestone

## M2: Has Tasks
- [ ] 001. A task
`
    const result = parseTodoIndex(content)

    expect(result.milestones[0].tasks).toHaveLength(0)
    expect(result.milestones[1].tasks).toHaveLength(1)
  })
})

describe('parseMilestoneDetail', () => {
  it('should parse milestone header', () => {
    const content = `# M1: Project Setup

> This milestone sets up the project foundation.

## Tasks

### 001. Initialize project

**Description:**
Create the initial project structure

**Verification:**
Project files exist

**Depends:** none

---
`
    const result = parseMilestoneDetail(content)

    expect(result.id).toBe('M1')
    expect(result.name).toBe('Project Setup')
    expect(result.description).toBe('This milestone sets up the project foundation.')
  })

  it('should parse task details', () => {
    const content = `# M1: Setup

> Description

## Tasks

### 001. Initialize project

**Description:**
Create the initial project structure with
all required directories and files.

**Verification:**
Project files exist in the correct locations.

**Depends:** none

---
`
    const result = parseMilestoneDetail(content)

    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0].id).toBe('001')
    expect(result.tasks[0].title).toBe('Initialize project')
    expect(result.tasks[0].description).toContain('Create the initial project structure')
    expect(result.tasks[0].description).toContain('all required directories and files.')
    expect(result.tasks[0].verification).toContain('Project files exist')
    expect(result.tasks[0].depends).toHaveLength(0)
  })

  it('should parse task dependencies', () => {
    const content = `# M1: Setup

## Tasks

### 003. Final task

**Description:**
Depends on previous tasks

**Verification:**
All checks pass

**Depends:** 001, 002

---
`
    const result = parseMilestoneDetail(content)

    expect(result.tasks[0].depends).toEqual(['001', '002'])
  })

  it('should handle multiple tasks', () => {
    const content = `# M1: Setup

## Tasks

### 001. First task

**Description:**
First description

**Verification:**
First verification

**Depends:** none

---

### 002. Second task

**Description:**
Second description

**Verification:**
Second verification

**Depends:** 001

---
`
    const result = parseMilestoneDetail(content)

    expect(result.tasks).toHaveLength(2)
    expect(result.tasks[0].id).toBe('001')
    expect(result.tasks[1].id).toBe('002')
    expect(result.tasks[1].depends).toEqual(['001'])
  })

  it('should handle empty content', () => {
    const result = parseMilestoneDetail('')

    expect(result.id).toBe('')
    expect(result.name).toBe('')
    expect(result.tasks).toHaveLength(0)
  })
})

describe('buildExecutionPlan', () => {
  it('should combine todo index and milestone details', () => {
    const todoIndex = {
      projectName: 'test-project',
      milestones: [
        {
          id: 'M1',
          name: 'Setup',
          tasks: [
            { id: '001', title: 'Init', completed: true, milestoneId: 'M1' },
            { id: '002', title: 'Config', completed: false, milestoneId: 'M1' },
          ],
        },
      ],
    }

    const milestoneDetails = [
      {
        id: 'M1',
        name: 'Setup',
        description: 'Setup the project',
        tasks: [
          {
            id: '001',
            title: 'Init',
            description: 'Initialize',
            verification: 'Check files',
            depends: [],
          },
          {
            id: '002',
            title: 'Config',
            description: 'Configure',
            verification: 'Check config',
            depends: ['001'],
          },
        ],
      },
    ]

    const plan = buildExecutionPlan(todoIndex, milestoneDetails)

    expect(plan.totalTasks).toBe(2)
    expect(plan.completedTasks).toBe(1)
    expect(plan.milestones).toHaveLength(1)
    expect(plan.milestones[0].completedCount).toBe(1)
    expect(plan.milestones[0].totalCount).toBe(2)
  })

  it('should set correct task status', () => {
    const todoIndex = {
      milestones: [
        {
          id: 'M1',
          name: 'Test',
          tasks: [
            { id: '001', title: 'Done', completed: true, milestoneId: 'M1' },
            { id: '002', title: 'Pending', completed: false, milestoneId: 'M1' },
          ],
        },
      ],
    }

    const plan = buildExecutionPlan(todoIndex, [])

    expect(plan.milestones[0].tasks[0].status).toBe('completed')
    expect(plan.milestones[0].tasks[1].status).toBe('pending')
  })

  it('should handle missing milestone details gracefully', () => {
    const todoIndex = {
      milestones: [
        {
          id: 'M1',
          name: 'Test',
          tasks: [{ id: '001', title: 'Task', completed: false, milestoneId: 'M1' }],
        },
      ],
    }

    // No milestone details provided
    const plan = buildExecutionPlan(todoIndex, [])

    expect(plan.milestones[0].description).toBeUndefined()
    expect(plan.milestones[0].tasks[0].description).toBeUndefined()
    expect(plan.milestones[0].tasks[0].depends).toEqual([])
  })
})

describe('parseExecutionPlan', () => {
  it('should parse complete execution plan from raw content', () => {
    const todoContent = `# TODO

> Project: my-project

## M1: Setup
- [x] 001. Initialize project
- [ ] 002. Add dependencies

## M2: Features
- [ ] 003. Implement feature
`

    const milestoneContents = [
      {
        filename: 'M1-setup.md',
        content: `# M1: Setup

> Set up the project foundation

## Tasks

### 001. Initialize project

**Description:**
Create project structure

**Verification:**
Files exist

**Depends:** none

---

### 002. Add dependencies

**Description:**
Install npm packages

**Verification:**
node_modules exists

**Depends:** 001

---
`,
      },
      {
        filename: 'M2-features.md',
        content: `# M2: Features

> Implement core features

## Tasks

### 003. Implement feature

**Description:**
Build the main feature

**Verification:**
Feature works

**Depends:** 001, 002

---
`,
      },
    ]

    const plan = parseExecutionPlan(todoContent, milestoneContents)

    expect(plan.totalTasks).toBe(3)
    expect(plan.completedTasks).toBe(1)
    expect(plan.milestones).toHaveLength(2)

    // Check M1
    expect(plan.milestones[0].id).toBe('M1')
    expect(plan.milestones[0].name).toBe('Setup')
    expect(plan.milestones[0].description).toBe('Set up the project foundation')
    expect(plan.milestones[0].tasks[0].status).toBe('completed')
    expect(plan.milestones[0].tasks[1].depends).toEqual(['001'])

    // Check M2
    expect(plan.milestones[1].id).toBe('M2')
    expect(plan.milestones[1].tasks[0].depends).toEqual(['001', '002'])
  })
})
