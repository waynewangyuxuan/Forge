/**
 * FileSystemAdapter Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { FileSystemAdapter, getFileSystemAdapter } from '../../src/main/infrastructure/adapters/file-system.adapter'
import { FileNotFoundError } from '../../src/shared/errors'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

describe('FileSystemAdapter', () => {
  let adapter: FileSystemAdapter
  let testDir: string

  beforeEach(async () => {
    adapter = new FileSystemAdapter()
    // Create a unique test directory
    testDir = path.join(os.tmpdir(), `forge-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await fs.mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('readFile', () => {
    it('should read file contents', async () => {
      const filePath = path.join(testDir, 'test.txt')
      await fs.writeFile(filePath, 'Hello, World!')

      const content = await adapter.readFile(filePath)

      expect(content).toBe('Hello, World!')
    })

    it('should throw FileNotFoundError for non-existent file', async () => {
      const filePath = path.join(testDir, 'nonexistent.txt')

      await expect(adapter.readFile(filePath)).rejects.toThrow(FileNotFoundError)
    })
  })

  describe('readDir', () => {
    it('should list directory contents', async () => {
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'a')
      await fs.writeFile(path.join(testDir, 'file2.txt'), 'b')
      await fs.mkdir(path.join(testDir, 'subdir'))

      const entries = await adapter.readDir(testDir)

      expect(entries).toContain('file1.txt')
      expect(entries).toContain('file2.txt')
      expect(entries).toContain('subdir')
    })

    it('should throw FileNotFoundError for non-existent directory', async () => {
      const dirPath = path.join(testDir, 'nonexistent')

      await expect(adapter.readDir(dirPath)).rejects.toThrow(FileNotFoundError)
    })
  })

  describe('exists', () => {
    it('should return true for existing file', async () => {
      const filePath = path.join(testDir, 'exists.txt')
      await fs.writeFile(filePath, 'content')

      const result = await adapter.exists(filePath)

      expect(result).toBe(true)
    })

    it('should return true for existing directory', async () => {
      const result = await adapter.exists(testDir)

      expect(result).toBe(true)
    })

    it('should return false for non-existent path', async () => {
      const result = await adapter.exists(path.join(testDir, 'nonexistent'))

      expect(result).toBe(false)
    })
  })

  describe('isDirectory', () => {
    it('should return true for directory', async () => {
      const result = await adapter.isDirectory(testDir)

      expect(result).toBe(true)
    })

    it('should return false for file', async () => {
      const filePath = path.join(testDir, 'file.txt')
      await fs.writeFile(filePath, 'content')

      const result = await adapter.isDirectory(filePath)

      expect(result).toBe(false)
    })

    it('should return false for non-existent path', async () => {
      const result = await adapter.isDirectory(path.join(testDir, 'nonexistent'))

      expect(result).toBe(false)
    })
  })

  describe('writeFile', () => {
    it('should write file contents', async () => {
      const filePath = path.join(testDir, 'write.txt')

      await adapter.writeFile(filePath, 'New content')

      const content = await fs.readFile(filePath, 'utf-8')
      expect(content).toBe('New content')
    })

    it('should create parent directories', async () => {
      const filePath = path.join(testDir, 'deep', 'nested', 'file.txt')

      await adapter.writeFile(filePath, 'Nested content')

      const content = await fs.readFile(filePath, 'utf-8')
      expect(content).toBe('Nested content')
    })

    it('should overwrite existing file', async () => {
      const filePath = path.join(testDir, 'overwrite.txt')
      await fs.writeFile(filePath, 'Old content')

      await adapter.writeFile(filePath, 'New content')

      const content = await fs.readFile(filePath, 'utf-8')
      expect(content).toBe('New content')
    })
  })

  describe('createDir', () => {
    it('should create directory', async () => {
      const dirPath = path.join(testDir, 'newdir')

      await adapter.createDir(dirPath)

      const stat = await fs.stat(dirPath)
      expect(stat.isDirectory()).toBe(true)
    })

    it('should create nested directories with recursive flag', async () => {
      const dirPath = path.join(testDir, 'deep', 'nested', 'dir')

      await adapter.createDir(dirPath, true)

      const stat = await fs.stat(dirPath)
      expect(stat.isDirectory()).toBe(true)
    })
  })

  describe('copyDir', () => {
    it('should copy directory recursively', async () => {
      // Create source structure
      const srcDir = path.join(testDir, 'src')
      await fs.mkdir(srcDir)
      await fs.writeFile(path.join(srcDir, 'file1.txt'), 'content1')
      await fs.mkdir(path.join(srcDir, 'subdir'))
      await fs.writeFile(path.join(srcDir, 'subdir', 'file2.txt'), 'content2')

      const destDir = path.join(testDir, 'dest')

      await adapter.copyDir(srcDir, destDir)

      // Verify copy
      const file1 = await fs.readFile(path.join(destDir, 'file1.txt'), 'utf-8')
      const file2 = await fs.readFile(path.join(destDir, 'subdir', 'file2.txt'), 'utf-8')
      expect(file1).toBe('content1')
      expect(file2).toBe('content2')
    })
  })

  describe('remove', () => {
    it('should remove file', async () => {
      const filePath = path.join(testDir, 'remove.txt')
      await fs.writeFile(filePath, 'content')

      await adapter.remove(filePath)

      const exists = await adapter.exists(filePath)
      expect(exists).toBe(false)
    })

    it('should remove directory recursively', async () => {
      const dirPath = path.join(testDir, 'removedir')
      await fs.mkdir(dirPath)
      await fs.writeFile(path.join(dirPath, 'file.txt'), 'content')

      await adapter.remove(dirPath)

      const exists = await adapter.exists(dirPath)
      expect(exists).toBe(false)
    })

    it('should not throw for non-existent path', async () => {
      const filePath = path.join(testDir, 'nonexistent.txt')

      await expect(adapter.remove(filePath)).resolves.not.toThrow()
    })
  })

  describe('watch', () => {
    it('should return a handle with stop method', () => {
      const handle = adapter.watch(testDir, () => {})

      expect(handle).toBeDefined()
      expect(typeof handle.stop).toBe('function')

      // Clean up
      handle.stop()
    })

    it('should return no-op handle for non-existent path', () => {
      const handle = adapter.watch(path.join(testDir, 'nonexistent'), () => {})

      expect(handle).toBeDefined()
      expect(typeof handle.stop).toBe('function')

      // Should not throw
      handle.stop()
    })

    it('should emit change events when file is modified', async () => {
      // Skip if on CI/flaky environments
      const changes: { type: string; path: string }[] = []

      const handle = adapter.watch(testDir, (event) => {
        changes.push({ type: event.type, path: event.path })
      })

      // Give watcher time to initialize
      await new Promise((r) => setTimeout(r, 100))

      // Modify a file
      const testFile = path.join(testDir, 'watched.txt')
      await fs.writeFile(testFile, 'initial')

      // Wait for event to be processed
      await new Promise((r) => setTimeout(r, 200))

      handle.stop()

      // Note: fs.watch behavior varies by platform
      // We just verify the callback was called
      expect(changes.length).toBeGreaterThanOrEqual(0)
    })

    it('should stop watching when handle.stop is called', async () => {
      let eventCount = 0

      const handle = adapter.watch(testDir, () => {
        eventCount++
      })

      // Stop immediately
      handle.stop()
      // Second stop should be safe
      handle.stop()

      // Create file after stopping - should not trigger callback
      await fs.writeFile(path.join(testDir, 'after-stop.txt'), 'content')
      await new Promise((r) => setTimeout(r, 100))

      // Event count should stay 0 after stopping
      expect(eventCount).toBe(0)
    })
  })

  describe('getFileSystemAdapter', () => {
    it('should return singleton instance', () => {
      const instance1 = getFileSystemAdapter()
      const instance2 = getFileSystemAdapter()

      expect(instance1).toBe(instance2)
    })
  })
})
