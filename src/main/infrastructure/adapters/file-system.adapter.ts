/**
 * File System Adapter
 * Implements IFileSystemAdapter using Node.js fs module
 */

import * as fs from 'fs'
import * as fsPromises from 'fs/promises'
import * as path from 'path'
import {
  IFileSystemAdapter,
  FileChangeEvent,
  WatchHandle,
} from '@shared/interfaces/adapters'
import { FileNotFoundError } from '@shared/errors'

/**
 * Node.js implementation of IFileSystemAdapter
 */
export class FileSystemAdapter implements IFileSystemAdapter {
  /**
   * Read file contents as string
   */
  async readFile(filePath: string): Promise<string> {
    try {
      return await fsPromises.readFile(filePath, 'utf-8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new FileNotFoundError(filePath)
      }
      throw error
    }
  }

  /**
   * Read directory contents
   */
  async readDir(dirPath: string): Promise<string[]> {
    try {
      return await fsPromises.readdir(dirPath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new FileNotFoundError(dirPath)
      }
      throw error
    }
  }

  /**
   * Check if path exists
   */
  async exists(targetPath: string): Promise<boolean> {
    try {
      await fsPromises.access(targetPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if path is a directory
   */
  async isDirectory(targetPath: string): Promise<boolean> {
    try {
      const stat = await fsPromises.stat(targetPath)
      return stat.isDirectory()
    } catch {
      return false
    }
  }

  /**
   * Write content to file
   * Creates parent directories if needed
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    // Ensure parent directory exists
    const dir = path.dirname(filePath)
    await this.createDir(dir, true)

    await fsPromises.writeFile(filePath, content, 'utf-8')
  }

  /**
   * Create directory
   * If recursive is true, creates parent directories as needed
   */
  async createDir(dirPath: string, recursive = false): Promise<void> {
    await fsPromises.mkdir(dirPath, { recursive })
  }

  /**
   * Copy directory recursively
   */
  async copyDir(src: string, dest: string): Promise<void> {
    // Ensure destination directory exists
    await this.createDir(dest, true)

    const entries = await fsPromises.readdir(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)

      if (entry.isDirectory()) {
        await this.copyDir(srcPath, destPath)
      } else {
        await fsPromises.copyFile(srcPath, destPath)
      }
    }
  }

  /**
   * Remove file or directory
   */
  async remove(targetPath: string): Promise<void> {
    try {
      const stat = await fsPromises.stat(targetPath)

      if (stat.isDirectory()) {
        await fsPromises.rm(targetPath, { recursive: true })
      } else {
        await fsPromises.unlink(targetPath)
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Already doesn't exist, that's fine
        return
      }
      throw error
    }
  }

  /**
   * Atomically rename a file or directory
   * Used for safe file updates (write to temp, then rename)
   */
  async rename(oldPath: string, newPath: string): Promise<void> {
    await fsPromises.rename(oldPath, newPath)
  }

  /**
   * Watch a path for changes
   * Returns a handle with stop() method to stop watching
   */
  watch(
    targetPath: string,
    callback: (event: FileChangeEvent) => void
  ): WatchHandle {
    // Note: For production use, consider using chokidar for better
    // cross-platform support. This is a simple implementation using
    // Node.js native fs.watch.

    let watcher: fs.FSWatcher | null = null

    try {
      watcher = fs.watch(
        targetPath,
        { recursive: true },
        (eventType, filename) => {
          if (!filename) return

          const fullPath = path.join(targetPath, filename)

          // Map Node.js events to our event types
          // Note: fs.watch is limited - it only gives 'rename' or 'change'
          // For better event detection, use chokidar
          const type: FileChangeEvent['type'] =
            eventType === 'rename' ? 'add' : 'change'

          callback({ type, path: fullPath })
        }
      )
    } catch {
      // Path doesn't exist or can't be watched
      // Return a no-op handle
      return { stop: () => {} }
    }

    return {
      stop: () => {
        if (watcher) {
          watcher.close()
          watcher = null
        }
      },
    }
  }
}

/**
 * Create singleton instance
 */
let instance: FileSystemAdapter | null = null

export function getFileSystemAdapter(): FileSystemAdapter {
  if (!instance) {
    instance = new FileSystemAdapter()
  }
  return instance
}
