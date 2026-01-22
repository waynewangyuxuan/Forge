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
import type { IProjectRepository, IVersionRepository, IFeedbackRepository } from '@shared/interfaces/repositories'
import type { IFileSystemAdapter, IClaudeAdapter, IGitAdapter } from '@shared/interfaces/adapters'
import type { Settings } from '@shared/types/runtime.types'
import { ValidationError, NotFoundError, ClaudeUnavailableError, serializeError } from '@shared/errors'
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
import { createStateMachine } from '../../../domain/engines/state-machine'
import { loadScaffoldGeneratorPrompt, loadRegenerateScaffoldPrompt, loadClaudeMdTemplate, loadDevFlowStateMachine, getResolvedHookConfig } from '../../../infrastructure/config-loader'
import { executeGitHook, validateHookDefinition } from '../../../domain/engines/git-operations'

/**
 * Dependencies for scaffold generation
 */
export interface GenerateScaffoldDeps {
  projectRepo: IProjectRepository
  versionRepo: IVersionRepository
  feedbackRepo?: IFeedbackRepository // Optional - needed for regeneration
  fs: IFileSystemAdapter
  claude: IClaudeAdapter
  git?: IGitAdapter // Optional - graceful degradation if not provided
  settings?: Pick<Settings, 'commitOnScaffold' | 'pushStrategy'> // Git settings
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

  // Load state machine for dev flow
  const stateMachineConfig = loadDevFlowStateMachine()
  const stateMachine = createStateMachine(stateMachineConfig)

  // Track the scaffolding state for use in both success and error paths
  let scaffoldingState: string | null = null

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

    // Determine the appropriate event based on current state
    // GENERATE_SCAFFOLD: drafting → scaffolding
    // REGENERATE: reviewing → scaffolding
    const currentState = version.devStatus
    let scaffoldingEvent: string
    if (currentState === 'drafting') {
      scaffoldingEvent = 'GENERATE_SCAFFOLD'
    } else if (currentState === 'reviewing') {
      scaffoldingEvent = 'REGENERATE'
    } else {
      throw new ValidationError(
        `Cannot generate scaffold from state '${currentState}'. Must be in 'drafting' or 'reviewing' state.`,
        'devStatus'
      )
    }

    // Transition to scaffolding state using state machine
    scaffoldingState = stateMachine.transition(currentState, scaffoldingEvent)
    await versionRepo.updateStatus(input.versionId, { devStatus: scaffoldingState })

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

    let prompt: string
    const isRegenerating = currentState === 'reviewing'

    if (isRegenerating) {
      // Regeneration: use regenerate prompt with feedback and current TODO
      const currentTodo = await readFileOrEmpty(fs, path.join(project.path, 'META', 'TODO.md'))
      let feedbackContent = ''

      if (deps.feedbackRepo) {
        const feedback = await deps.feedbackRepo.findByVersionId(input.versionId)
        if (feedback) {
          feedbackContent = feedback.content
        }
      }

      if (!feedbackContent.trim()) {
        throw new ValidationError('Feedback is required for regeneration', 'feedback')
      }

      const regeneratePromptConfig = loadRegenerateScaffoldPrompt()
      prompt = renderPrompt(regeneratePromptConfig.template, {
        project_name: project.name,
        product_spec: productSpec,
        technical_spec: technicalSpec,
        regulation_spec: regulationSpec || undefined,
        current_todo: currentTodo,
        feedback: feedbackContent,
      })
    } else {
      // Initial generation: use scaffold-generator prompt
      const promptConfig = loadScaffoldGeneratorPrompt()
      prompt = renderPrompt(promptConfig.template, {
        project_name: project.name,
        product_spec: productSpec,
        technical_spec: technicalSpec,
        regulation_spec: regulationSpec || undefined,
      })
    }

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

    // Phase 5.5: Git commit (non-blocking)
    if (deps.git && deps.settings) {
      emitProgress({ versionId: input.versionId, message: 'Committing scaffold files...' })

      try {
        // Get hook config with defaults applied
        const mergedHook = getResolvedHookConfig('scaffold_complete')

        if (mergedHook) {
          // Validate hook structure
          if (!validateHookDefinition(mergedHook)) {
            emitProgress({
              versionId: input.versionId,
              message: 'Git skipped: invalid hook configuration',
            })
          } else {
            const gitResult = await executeGitHook({
              hookDefinition: mergedHook,
              context: {
                projectPath: project.path,
                versionName: version.versionName,
                projectName: project.name,
              },
              commitEnabled: deps.settings.commitOnScaffold ?? true,
              pushStrategy: deps.settings.pushStrategy ?? 'auto',
              git: deps.git,
            })

            // Only compute pushStatus when not skipped
            if (gitResult.success && !gitResult.skipped) {
              const pushStatus = gitResult.pushed
                ? ' (pushed)'
                : gitResult.pushFailed
                  ? ' (push failed - manual push needed)'
                  : ''
              emitProgress({
                versionId: input.versionId,
                message: `Committed: ${gitResult.commitHash?.slice(0, 7)}${pushStatus}`,
              })
            } else if (gitResult.skipped) {
              emitProgress({
                versionId: input.versionId,
                message: `Git skipped: ${gitResult.skippedReason}`,
              })
            }
          }
        }
      } catch (error) {
        // Git errors are non-fatal - just log
        console.warn('Git hook failed:', error)
        emitProgress({
          versionId: input.versionId,
          message: 'Git commit skipped due to error',
        })
      }
    }

    // Phase 6: Transition to reviewing state using state machine
    // SCAFFOLD_SUCCESS: scaffolding → reviewing
    // Use scaffoldingState (not hardcoded) to stay aligned with YAML config
    const reviewingState = stateMachine.transition(scaffoldingState!, 'SCAFFOLD_SUCCESS')
    await versionRepo.updateStatus(input.versionId, { devStatus: reviewingState })

    // Clear feedback after successful regeneration
    if (isRegenerating && deps.feedbackRepo) {
      await deps.feedbackRepo.delete(input.versionId)
    }

    emitCompleted({ versionId: input.versionId })

    return {
      success: true,
      scaffold,
      filesWritten,
    }
  } catch (error) {
    // Transition to error state using state machine if we transitioned to scaffolding
    // SCAFFOLD_ERROR: scaffolding → error
    // Note: If we failed before transitioning to scaffolding, we stay in current state
    // Use scaffoldingState (not hardcoded) to stay aligned with YAML config
    try {
      if (scaffoldingState !== null) {
        const errorState = stateMachine.transition(scaffoldingState, 'SCAFFOLD_ERROR')
        await versionRepo.updateStatus(input.versionId, { devStatus: errorState })
      }
    } catch {
      // Ignore status update error
    }

    // Serialize error to preserve structured error codes
    const serialized = serializeError(error)
    emitError({
      versionId: input.versionId,
      error: serialized.message,
      errorCode: serialized.code,
    })

    return {
      success: false,
      error: serialized.message,
      errorCode: serialized.code,
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
