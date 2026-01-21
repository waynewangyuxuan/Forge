/**
 * Scaffold Validator Engine Tests
 */

import { describe, it, expect } from 'vitest'
import {
  validateScaffold,
  parseScaffoldJson,
} from '../../src/main/domain/engines/scaffold-validator'
import type { ScaffoldOutput } from '../../src/shared/types'

// Valid scaffold fixture
const validScaffold: ScaffoldOutput = {
  project: {
    name: 'test-project',
    description: 'A test project',
  },
  context: {
    architecture: 'Clean architecture',
    conventions: 'TypeScript, ESLint',
  },
  milestones: [
    {
      id: 'M1',
      name: 'Setup',
      description: 'Initial setup',
      tasks: [
        {
          id: '001',
          title: 'Initialize project',
          description: 'Create package.json',
          verification: 'package.json exists',
          depends: [],
        },
        {
          id: '002',
          title: 'Add TypeScript',
          description: 'Configure TypeScript',
          verification: 'tsc compiles',
          depends: ['001'],
        },
      ],
    },
  ],
}

describe('validateScaffold', () => {
  describe('valid scaffolds', () => {
    it('should pass for valid scaffold', () => {
      const result = validateScaffold(validScaffold)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should pass for scaffold with empty depends array', () => {
      const scaffold: ScaffoldOutput = {
        ...validScaffold,
        milestones: [
          {
            ...validScaffold.milestones[0],
            tasks: [
              {
                id: '001',
                title: 'Test',
                description: 'Test',
                verification: 'Test',
                depends: [],
              },
            ],
          },
        ],
      }
      const result = validateScaffold(scaffold)
      expect(result.valid).toBe(true)
    })
  })

  describe('missing fields', () => {
    it('should fail for missing project', () => {
      const scaffold = { ...validScaffold, project: undefined } as unknown as ScaffoldOutput
      const result = validateScaffold(scaffold)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'MISSING_FIELD' && e.path === 'project')).toBe(
        true
      )
    })

    it('should fail for missing project.name', () => {
      const scaffold: ScaffoldOutput = {
        ...validScaffold,
        project: { name: '', description: 'test' },
      }
      const result = validateScaffold(scaffold)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.path === 'project.name')).toBe(true)
    })

    it('should fail for missing context', () => {
      const scaffold = { ...validScaffold, context: undefined } as unknown as ScaffoldOutput
      const result = validateScaffold(scaffold)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'MISSING_FIELD' && e.path === 'context')).toBe(
        true
      )
    })

    it('should fail for missing milestones', () => {
      const scaffold = { ...validScaffold, milestones: undefined } as unknown as ScaffoldOutput
      const result = validateScaffold(scaffold)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.path === 'milestones')).toBe(true)
    })

    it('should fail for empty milestones array', () => {
      const scaffold: ScaffoldOutput = { ...validScaffold, milestones: [] }
      const result = validateScaffold(scaffold)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'EMPTY_MILESTONES')).toBe(true)
    })

    it('should fail for empty tasks array', () => {
      const scaffold: ScaffoldOutput = {
        ...validScaffold,
        milestones: [{ id: 'M1', name: 'Test', description: 'Test', tasks: [] }],
      }
      const result = validateScaffold(scaffold)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'EMPTY_TASKS')).toBe(true)
    })
  })

  describe('duplicate task IDs', () => {
    it('should fail for duplicate task IDs', () => {
      const scaffold: ScaffoldOutput = {
        ...validScaffold,
        milestones: [
          {
            id: 'M1',
            name: 'Test',
            description: 'Test',
            tasks: [
              { id: '001', title: 'A', description: 'A', verification: 'A', depends: [] },
              { id: '001', title: 'B', description: 'B', verification: 'B', depends: [] },
            ],
          },
        ],
      }
      const result = validateScaffold(scaffold)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'DUPLICATE_TASK_ID')).toBe(true)
    })

    it('should fail for duplicate task IDs across milestones', () => {
      const scaffold: ScaffoldOutput = {
        ...validScaffold,
        milestones: [
          {
            id: 'M1',
            name: 'Test 1',
            description: 'Test',
            tasks: [{ id: '001', title: 'A', description: 'A', verification: 'A', depends: [] }],
          },
          {
            id: 'M2',
            name: 'Test 2',
            description: 'Test',
            tasks: [{ id: '001', title: 'B', description: 'B', verification: 'B', depends: [] }],
          },
        ],
      }
      const result = validateScaffold(scaffold)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'DUPLICATE_TASK_ID')).toBe(true)
    })
  })

  describe('duplicate milestone IDs', () => {
    it('should fail for duplicate milestone IDs', () => {
      const scaffold: ScaffoldOutput = {
        ...validScaffold,
        milestones: [
          {
            id: 'M1',
            name: 'Test 1',
            description: 'Test',
            tasks: [{ id: '001', title: 'A', description: 'A', verification: 'A', depends: [] }],
          },
          {
            id: 'M1',
            name: 'Test 2',
            description: 'Test',
            tasks: [{ id: '002', title: 'B', description: 'B', verification: 'B', depends: [] }],
          },
        ],
      }
      const result = validateScaffold(scaffold)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'DUPLICATE_MILESTONE_ID')).toBe(true)
    })
  })

  describe('missing milestone description', () => {
    it('should fail for missing milestone description', () => {
      const scaffold = {
        ...validScaffold,
        milestones: [
          {
            id: 'M1',
            name: 'Test',
            tasks: [{ id: '001', title: 'A', description: 'A', verification: 'A', depends: [] }],
          },
        ],
      } as unknown as ScaffoldOutput
      const result = validateScaffold(scaffold)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'MISSING_FIELD' && e.path?.includes('description'))).toBe(true)
    })

    it('should fail for empty milestone description', () => {
      const scaffold: ScaffoldOutput = {
        ...validScaffold,
        milestones: [
          {
            id: 'M1',
            name: 'Test',
            description: '',
            tasks: [{ id: '001', title: 'A', description: 'A', verification: 'A', depends: [] }],
          },
        ],
      }
      const result = validateScaffold(scaffold)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'MISSING_FIELD' && e.path?.includes('description'))).toBe(true)
    })
  })

  describe('invalid dependencies', () => {
    it('should fail for dependency on non-existent task', () => {
      const scaffold: ScaffoldOutput = {
        ...validScaffold,
        milestones: [
          {
            id: 'M1',
            name: 'Test',
            description: 'Test',
            tasks: [
              { id: '001', title: 'A', description: 'A', verification: 'A', depends: ['999'] },
            ],
          },
        ],
      }
      const result = validateScaffold(scaffold)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'INVALID_DEPENDENCY')).toBe(true)
    })

    it('should fail for missing depends field', () => {
      const scaffold = {
        ...validScaffold,
        milestones: [
          {
            id: 'M1',
            name: 'Test',
            description: 'Test',
            tasks: [
              { id: '001', title: 'A', description: 'A', verification: 'A' },
            ],
          },
        ],
      } as unknown as ScaffoldOutput
      const result = validateScaffold(scaffold)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'MISSING_FIELD' && e.path?.includes('depends'))).toBe(true)
    })

    it('should fail for depends: null', () => {
      const scaffold = {
        ...validScaffold,
        milestones: [
          {
            id: 'M1',
            name: 'Test',
            description: 'Test',
            tasks: [
              { id: '001', title: 'A', description: 'A', verification: 'A', depends: null },
            ],
          },
        ],
      } as unknown as ScaffoldOutput
      const result = validateScaffold(scaffold)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'MISSING_FIELD' && e.path?.includes('depends'))).toBe(true)
    })

    it('should fail for depends with non-array value', () => {
      const scaffold = {
        ...validScaffold,
        milestones: [
          {
            id: 'M1',
            name: 'Test',
            description: 'Test',
            tasks: [
              { id: '001', title: 'A', description: 'A', verification: 'A', depends: '001' },
            ],
          },
        ],
      } as unknown as ScaffoldOutput
      const result = validateScaffold(scaffold)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'INVALID_TYPE' && e.path?.includes('depends'))).toBe(true)
    })

    it('should fail for depends with non-string items', () => {
      const scaffold = {
        ...validScaffold,
        milestones: [
          {
            id: 'M1',
            name: 'Test',
            description: 'Test',
            tasks: [
              { id: '001', title: 'A', description: 'A', verification: 'A', depends: [123] },
            ],
          },
        ],
      } as unknown as ScaffoldOutput
      const result = validateScaffold(scaffold)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'INVALID_TYPE')).toBe(true)
    })

    it('should fail for empty string in depends array', () => {
      const scaffold: ScaffoldOutput = {
        ...validScaffold,
        milestones: [
          {
            id: 'M1',
            name: 'Test',
            description: 'Test',
            tasks: [
              { id: '001', title: 'A', description: 'A', verification: 'A', depends: [''] },
            ],
          },
        ],
      }
      const result = validateScaffold(scaffold)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'INVALID_DEPENDENCY')).toBe(true)
    })
  })

  describe('circular dependencies', () => {
    it('should fail for direct circular dependency', () => {
      const scaffold: ScaffoldOutput = {
        ...validScaffold,
        milestones: [
          {
            id: 'M1',
            name: 'Test',
            description: 'Test',
            tasks: [
              { id: '001', title: 'A', description: 'A', verification: 'A', depends: ['002'] },
              { id: '002', title: 'B', description: 'B', verification: 'B', depends: ['001'] },
            ],
          },
        ],
      }
      const result = validateScaffold(scaffold)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'CIRCULAR_DEPENDENCY')).toBe(true)
    })

    it('should fail for indirect circular dependency', () => {
      const scaffold: ScaffoldOutput = {
        ...validScaffold,
        milestones: [
          {
            id: 'M1',
            name: 'Test',
            description: 'Test',
            tasks: [
              { id: '001', title: 'A', description: 'A', verification: 'A', depends: ['003'] },
              { id: '002', title: 'B', description: 'B', verification: 'B', depends: ['001'] },
              { id: '003', title: 'C', description: 'C', verification: 'C', depends: ['002'] },
            ],
          },
        ],
      }
      const result = validateScaffold(scaffold)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'CIRCULAR_DEPENDENCY')).toBe(true)
    })

    it('should fail for self-referencing dependency', () => {
      const scaffold: ScaffoldOutput = {
        ...validScaffold,
        milestones: [
          {
            id: 'M1',
            name: 'Test',
            description: 'Test',
            tasks: [
              { id: '001', title: 'A', description: 'A', verification: 'A', depends: ['001'] },
            ],
          },
        ],
      }
      const result = validateScaffold(scaffold)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'CIRCULAR_DEPENDENCY')).toBe(true)
    })
  })
})

describe('parseScaffoldJson', () => {
  it('should parse valid JSON string', () => {
    const json = JSON.stringify(validScaffold)
    const result = parseScaffoldJson(json)
    expect(result).toEqual(validScaffold)
  })

  it('should parse JSON wrapped in markdown code block', () => {
    const json = '```json\n' + JSON.stringify(validScaffold) + '\n```'
    const result = parseScaffoldJson(json)
    expect(result).toEqual(validScaffold)
  })

  it('should parse JSON wrapped in code block without language', () => {
    const json = '```\n' + JSON.stringify(validScaffold) + '\n```'
    const result = parseScaffoldJson(json)
    expect(result).toEqual(validScaffold)
  })

  it('should return null for invalid JSON', () => {
    const result = parseScaffoldJson('not valid json')
    expect(result).toBeNull()
  })

  it('should return null for empty string', () => {
    const result = parseScaffoldJson('')
    expect(result).toBeNull()
  })

  it('should handle whitespace around JSON', () => {
    const json = '  \n' + JSON.stringify(validScaffold) + '  \n'
    const result = parseScaffoldJson(json)
    expect(result).toEqual(validScaffold)
  })
})
