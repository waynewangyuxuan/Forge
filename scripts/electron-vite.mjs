import { spawn } from 'node:child_process'
import { join } from 'node:path'

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Usage: node scripts/electron-vite.mjs <dev|build|preview> [args...]')
  process.exit(1)
}

const commandName = process.platform === 'win32' ? 'electron-vite.cmd' : 'electron-vite'
const commandPath = join(process.cwd(), 'node_modules', '.bin', commandName)
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const child = spawn(commandPath, args, {
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32'
})
child.on('exit', (code) => process.exit(code ?? 1))
child.on('error', (err) => {
  console.error(err)
  process.exit(1)
})
