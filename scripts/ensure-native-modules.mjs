#!/usr/bin/env node
/**
 * Ensures native modules (better-sqlite3) are built for the correct runtime.
 * Tracks the last build target and only rebuilds when switching between Node.js and Electron.
 *
 * Usage:
 *   node scripts/ensure-native-modules.mjs electron  # For npm run dev
 *   node scripts/ensure-native-modules.mjs node      # For npm run test
 */

import { spawn, execSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CACHE_FILE = join(ROOT, 'node_modules', '.native-build-target')
const SQLITE_DIR = join(ROOT, 'node_modules', 'better-sqlite3')

// Timeout for rebuild (30 seconds)
const REBUILD_TIMEOUT_MS = 30_000

const target = process.argv[2] // 'electron' or 'node'

if (!target || !['electron', 'node'].includes(target)) {
  console.error('Usage: ensure-native-modules.mjs <electron|node>')
  process.exit(1)
}

// Check cached target
let cachedTarget = null
if (existsSync(CACHE_FILE)) {
  try {
    cachedTarget = readFileSync(CACHE_FILE, 'utf-8').trim()
  } catch {
    // Ignore read errors
  }
}

if (cachedTarget === target) {
  // Already built for this target, skip rebuild
  process.exit(0)
}

console.log(`Rebuilding native modules for ${target}...`)

/**
 * Run command with timeout, returns promise
 */
function runWithTimeout(command, args, cwd, timeoutMs) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { cwd, stdio: 'inherit', shell: true })

    const timer = setTimeout(() => {
      proc.kill('SIGKILL')
      reject(new Error(`Command timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    proc.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command exited with code ${code}`))
      }
    })

    proc.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

async function rebuild() {
  try {
    if (target === 'electron') {
      await runWithTimeout(
        'npx',
        ['electron-rebuild', '-f', '-w', 'better-sqlite3'],
        ROOT,
        REBUILD_TIMEOUT_MS * 2 // Electron rebuild takes longer
      )
    } else {
      // Use npm rebuild - it tries prebuild-install first (downloads prebuilt binary),
      // then falls back to node-gyp compilation if download fails.
      // The timeout prevents infinite hangs on network issues.
      await runWithTimeout(
        'npm',
        ['rebuild', 'better-sqlite3'],
        ROOT,
        REBUILD_TIMEOUT_MS
      )
    }

    // Cache the successful build target
    writeFileSync(CACHE_FILE, target)
    console.log(`Native modules ready for ${target}`)
  } catch (error) {
    console.error(`Failed to rebuild native modules for ${target}: ${error.message}`)
    console.error('Tip: If stuck, try: rm -rf node_modules/better-sqlite3/build && npm install')
    process.exit(1)
  }
}

rebuild()
