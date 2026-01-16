/**
 * Generate Scaffold Use Case
 * Orchestrates the scaffold generation flow:
 * 1. Read spec files
 * 2. Render prompt
 * 3. Call Claude
 * 4. Validate output
 * 5. Write scaffold files
 * 6. Update version status
 */

import * as path from 'path'
import type { IProjectRepository, IVersionRepository } from '@shared/interfaces/repositories'
import type { IFileSystemAdapter, IClaudeAdapter } from '@shared/interfaces/adapters'
import { ValidationError, NotFoundError, ClaudeUnavailableError } from '@shared/errors'
import type {
  GenerateScaffoldInput,
  GenerateScaffoldResult,
  ScaffoldOutput,
} from '@shared/types/scaffold.types'
import type {
  ScaffoldProgressEvent,
  ScaffoldCompletedEvent,
  ScaffoldErrorEvent,
} from '@shared/types/ipc.types'
import { renderPrompt } from '../../../domain/engines/prompt-renderer'
import { validateScaffold, parseScaffoldJson } from '../../../domain/engines/scaffold-validator'
import { generateScaffoldFiles, generateClaudeMd } from '../../../domain/engines/scaffold-writer'
import { loadScaffoldGeneratorPrompt, loadClaudeMdTemplate } from '../../../infrastructure/config-loader'

/**
 * Dependencies for scaffold generation
 */
export interface GenerateScaffoldDeps {
  projectRepo: IProjectRepository
  versionRepo: IVersionRepository
  fs: IFileSystemAdapter
  claude: IClaudeAdapter
  emitProgress: (event: ScaffoldProgressEvent) => void
  emitCompleted: (event: ScaffoldCompletedEvent) => void
  emitError: (event: ScaffoldErrorEvent) => void
}

/**
 * Generate scaffold from spec files
 */
export async function generateScaffold(
  input: GenerateScaffoldInput,
  deps: GenerateScaffoldDeps
): Promise<GenerateScaffoldResult> {
  const { projectRepo, versionRepo, fs, claude, emitProgress, emitCompleted, emitError } = deps

  try {
    // Validate input
    if (!input.versionId || input.versionId.trim() === '') {
      throw new ValidationError('Version ID is required', 'versionId')
    }

    // Get version
    const version = await versionRepo.findById(input.versionId)
    if (!version) {
      throw new NotFoundError('Version', input.versionId)
    }

    // Get project
    const project = await projectRepo.findById(version.projectId)
    if (!project) {
      throw new NotFoundError('Project', version.projectId)
    }

    // Check Claude availability
    emitProgress({ versionId: input.versionId, message: 'Checking Claude CLI availability...' })
    if (!(await claude.isAvailable())) {
      throw new ClaudeUnavailableError()
    }

    // Update status to scaffolding
    await versionRepo.updateStatus(input.versionId, { devStatus: 'scaffolding' })

    // Phase 1: Read spec files
    emitProgress({ versionId: input.versionId, message: 'Reading spec files...' })
    const specDir = path.join(project.path, 'META', 'CORE')

    const productSpec = await readFileOrEmpty(fs, path.join(specDir, 'PRODUCT.md'))
    const technicalSpec = await readFileOrEmpty(fs, path.join(specDir, 'TECHNICAL.md'))
    const regulationSpec = await readFileOrEmpty(fs, path.join(specDir, 'REGULATION.md'))

    if (!productSpec.trim()) {
      throw new ValidationError('PRODUCT.md is required and cannot be empty', 'productSpec')
    }

    if (!technicalSpec.trim()) {
      throw new ValidationError('TECHNICAL.md is required and cannot be empty', 'technicalSpec')
    }

    // Phase 2: Render prompt
    emitProgress({ versionId: input.versionId, message: 'Preparing prompt...' })
    const promptConfig = loadScaffoldGeneratorPrompt()
    const prompt = renderPrompt(promptConfig.template, {
      project_name: project.name,
      product_spec: productSpec,
      technical_spec: technicalSpec,
      regulation_spec: regulationSpec || undefined,
    })

    // Phase 3: Call Claude
    emitProgress({ versionId: input.versionId, message: 'Generating scaffold with AI...' })
    const result = await claude.execute({
      prompt,
      workingDirectory: project.path,
      timeout: 300, // 5 minutes
    })

    if (!result.success) {
      throw new Error(`Claude execution failed: ${result.error || 'Unknown error'}`)
    }

    // Phase 4: Parse and validate
    emitProgress({ versionId: input.versionId, message: 'Parsing AI output...' })
    const scaffold = parseScaffoldJson(result.output)
    if (!scaffold) {
      throw new ValidationError('Failed to parse AI output as JSON. Raw output: ' + result.output.slice(0, 500), 'output')
    }

    emitProgress({ versionId: input.versionId, message: 'Validating scaffold structure...' })
    const validation = validateScaffold(scaffold)
    if (!validation.valid) {
      const errorMessages = validation.errors.map(e => `${e.code}: ${e.message}`).join('\n')
      throw new ValidationError(`Scaffold validation failed:\n${errorMessages}`, 'scaffold')
    }

    // Phase 5: Write files
    emitProgress({ versionId: input.versionId, message: 'Writing scaffold files...' })
    const filesWritten = await writeScaffoldFiles(fs, project.path, scaffold, project.name)

    // Phase 6: Update status to reviewing
    await versionRepo.updateStatus(input.versionId, { devStatus: 'reviewing' })

    emitCompleted({ versionId: input.versionId })

    return {
      success: true,
      scaffold,
      filesWritten,
    }
  } catch (error) {
    // Revert status to drafting on error
    try {
      await versionRepo.updateStatus(input.versionId, { devStatus: 'drafting' })
    } catch {
      // Ignore status update error
    }

    const errorMessage = error instanceof Error ? error.message : String(error)
    emitError({ versionId: input.versionId, error: errorMessage })

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Read a file, returning empty string if it doesn't exist
 */
async function readFileOrEmpty(fs: IFileSystemAdapter, filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath)
  } catch {
    return ''
  }
}

/**
 * Write all scaffold files to the project directory
 */
async function writeScaffoldFiles(
  fs: IFileSystemAdapter,
  projectPath: string,
  scaffold: ScaffoldOutput,
  projectName: string
): Promise<string[]> {
  const filesWritten: string[] = []

  // Generate scaffold files (TODO.md, MILESTONES/*.md, CONTEXT/*.md)
  const scaffoldFiles = generateScaffoldFiles(scaffold, { projectName })

  // Generate CLAUDE.md
  const claudeMdTemplate = loadClaudeMdTemplate()
  const claudeMdContent = generateClaudeMd(claudeMdTemplate, scaffold, projectName)

  // Ensure directories exist
  await fs.createDir(path.join(projectPath, 'META', 'MILESTONES'), true)
  await fs.createDir(path.join(projectPath, 'META', 'CONTEXT'), true)

  // Write scaffold files
  for (const file of scaffoldFiles) {
    const fullPath = path.join(projectPath, file.path)
    await fs.writeFile(fullPath, file.content)
    filesWritten.push(file.path)
  }

  // Write CLAUDE.md
  const claudeMdPath = path.join(projectPath, 'META', 'CLAUDE.md')
  await fs.writeFile(claudeMdPath, claudeMdContent)
  filesWritten.push('META/CLAUDE.md')

  return filesWritten
}
