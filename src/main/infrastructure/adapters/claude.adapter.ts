/**
 * Claude CLI Adapter
 * Implements IClaudeAdapter using Claude Code CLI
 */

import { spawn, exec, ChildProcess } from 'node:child_process'
import { promisify } from 'node:util'
import type {
  IClaudeAdapter,
  ClaudeExecuteOptions,
  ClaudeResult,
  ClaudeStreamChunk,
} from '@shared/interfaces/adapters'
import { ClaudeUnavailableError, ClaudeTimeoutError } from '@shared/errors'

const execAsync = promisify(exec)

/**
 * Claude CLI adapter
 */
export class ClaudeCliAdapter implements IClaudeAdapter {
  /**
   * Map of running processes by session ID for abort functionality
   */
  private runningProcesses = new Map<string, ChildProcess>()

  /**
   * Check if Claude CLI is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await execAsync('claude --version')
      return true
    } catch {
      return false
    }
  }

  /**
   * Get Claude CLI version
   */
  async getVersion(): Promise<string | null> {
    try {
      const { stdout } = await execAsync('claude --version')
      // Parse version from output like "claude-code 1.0.0" or similar
      const match = stdout.match(/\d+\.\d+\.\d+/)
      return match ? match[0] : stdout.trim()
    } catch {
      return null
    }
  }

  /**
   * Execute a prompt and return the result
   */
  async execute(options: ClaudeExecuteOptions): Promise<ClaudeResult> {
    // Check availability first
    if (!(await this.isAvailable())) {
      throw new ClaudeUnavailableError()
    }

    const timeoutMs = (options.timeout ?? 600) * 1000 // Convert seconds to ms
    const sessionId = options.sessionId || `session-${Date.now()}`

    return new Promise((resolve, reject) => {
      const args = this.buildArgs(options)

      const process = spawn('claude', args, {
        cwd: options.workingDirectory,
        shell: true,
        env: { ...global.process.env },
      })

      // Track process for abort
      this.runningProcesses.set(sessionId, process)

      let stdout = ''
      let stderr = ''

      // Timeout handling
      const timeoutHandle = setTimeout(() => {
        this.runningProcesses.delete(sessionId)
        process.kill('SIGTERM')
        reject(new ClaudeTimeoutError(timeoutMs))
      }, timeoutMs)

      process.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString()
      })

      process.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString()
      })

      process.on('close', (code) => {
        clearTimeout(timeoutHandle)
        this.runningProcesses.delete(sessionId)

        resolve({
          success: code === 0,
          output: stdout,
          error: stderr || undefined,
          exitCode: code ?? 1,
        })
      })

      process.on('error', (error) => {
        clearTimeout(timeoutHandle)
        this.runningProcesses.delete(sessionId)
        reject(error)
      })

      // Write prompt to stdin and close
      if (process.stdin) {
        process.stdin.write(options.prompt)
        process.stdin.end()
      }
    })
  }

  /**
   * Execute with streaming output
   */
  async *executeStream(options: ClaudeExecuteOptions): AsyncIterable<ClaudeStreamChunk> {
    // Check availability first
    if (!(await this.isAvailable())) {
      throw new ClaudeUnavailableError()
    }

    const timeoutMs = (options.timeout ?? 600) * 1000
    const sessionId = options.sessionId || `session-${Date.now()}`
    const args = this.buildArgs(options)

    const process = spawn('claude', args, {
      cwd: options.workingDirectory,
      shell: true,
      env: { ...global.process.env },
    })

    // Track process for abort
    this.runningProcesses.set(sessionId, process)

    // Create a queue for streaming chunks
    const chunks: ClaudeStreamChunk[] = []
    let done = false
    let error: Error | null = null

    // Timeout handling
    const timeoutHandle = setTimeout(() => {
      this.runningProcesses.delete(sessionId)
      process.kill('SIGTERM')
      error = new ClaudeTimeoutError(timeoutMs)
      done = true
    }, timeoutMs)

    process.stdout?.on('data', (data: Buffer) => {
      chunks.push({ type: 'stdout', content: data.toString() })
    })

    process.stderr?.on('data', (data: Buffer) => {
      chunks.push({ type: 'stderr', content: data.toString() })
    })

    process.on('close', (code) => {
      clearTimeout(timeoutHandle)
      this.runningProcesses.delete(sessionId)
      chunks.push({ type: 'status', content: `exit:${code}` })
      done = true
    })

    process.on('error', (err) => {
      clearTimeout(timeoutHandle)
      this.runningProcesses.delete(sessionId)
      error = err
      done = true
    })

    // Write prompt to stdin and close
    if (process.stdin) {
      process.stdin.write(options.prompt)
      process.stdin.end()
    }

    // Yield chunks as they come in
    while (!done || chunks.length > 0) {
      if (chunks.length > 0) {
        yield chunks.shift()!
      } else if (!done) {
        // Wait a bit for more chunks
        await new Promise((resolve) => setTimeout(resolve, 10))
      }
    }

    if (error) {
      throw error
    }
  }

  /**
   * Abort a running execution by session ID
   */
  async abort(sessionId: string): Promise<void> {
    const process = this.runningProcesses.get(sessionId)
    if (process) {
      process.kill('SIGTERM')
      this.runningProcesses.delete(sessionId)
    }
  }

  /**
   * Build CLI arguments from options
   */
  private buildArgs(options: ClaudeExecuteOptions): string[] {
    const args: string[] = []

    // Use print mode for non-interactive output
    args.push('--print')

    // Working directory is set via cwd, but we can also pass it explicitly
    // args.push('--cwd', options.workingDirectory)

    // Allow specific tools if provided
    if (options.allowedTools && options.allowedTools.length > 0) {
      args.push('--allowedTools', options.allowedTools.join(','))
    }

    return args
  }
}

/**
 * Singleton instance
 */
let instance: ClaudeCliAdapter | null = null

export function getClaudeAdapter(): ClaudeCliAdapter {
  if (!instance) {
    instance = new ClaudeCliAdapter()
  }
  return instance
}
