#!/usr/bin/env node
/**
 * Ensures native modules (better-sqlite3) are built for the correct runtime.
 * Tracks the last build target and only rebuilds when switching between Node.js and Electron.
 *
 * Usage:
 *   node scripts/ensure-native-modules.mjs electron  # For npm run dev
 *   node scripts/ensure-native-modules.mjs node      # For npm run test
 */

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CACHE_FILE = join(ROOT, 'node_modules', '.native-build-target')

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

try {
  if (target === 'electron') {
    execSync('npx electron-rebuild -f -w better-sqlite3', {
      cwd: ROOT,
      stdio: 'inherit',
    })
  } else {
    execSync('npm rebuild better-sqlite3', {
      cwd: ROOT,
      stdio: 'inherit',
    })
  }

  // Cache the successful build target
  writeFileSync(CACHE_FILE, target)
  console.log(`Native modules ready for ${target}`)
} catch (error) {
  console.error(`Failed to rebuild native modules for ${target}`)
  process.exit(1)
}
