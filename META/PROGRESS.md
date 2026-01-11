# PROGRESS TRACKER
This tracker serves as a log of what we have accomplished. sections are separated by time(date granularity). APPEND ONLY.

---

## 2025-01-09 - M0: 项目脚手架 - Complete

- Electron 主进程 + 渲染进程基础结构搭建完成
- TypeScript 配置完成（main/renderer/shared 分离）
- React 18 + React Router v6 集成
- Tailwind CSS 配置完成
- ESLint + Prettier 配置完成
- electron-vite 热重载开发环境配置
- Preload 脚本实现 IPC 基础 API（invoke/on/once）
- `npm run typecheck` 通过

---

## 2025-01-09 - M1: Core Infrastructure Complete

### Summary
Completed M1 (Core Infrastructure) milestone. Established the foundational layer for the Forge application including database, repositories, IPC communication, and frontend state management.

### Completed Sections

#### Section 1: Shared Layer - Types & Interfaces
- Created `shared/types/project.types.ts` - Project, Version entity types
- Created `shared/types/execution.types.ts` - Execution, Task types
- Created `shared/types/runtime.types.ts` - RuntimeConfig, Run, Credential types
- Created `shared/types/ipc.types.ts` - Complete IPC channel type definitions with IPCChannelMap
- Created `shared/interfaces/repositories.ts` - IProjectRepository, IVersionRepository
- Created `shared/interfaces/adapters.ts` - IFileSystemAdapter, IClaudeAdapter, IGitAdapter
- Created `shared/errors.ts` - ForgeError with serialization, DuplicateError, NotFoundError
- Created `shared/constants.ts` - DevStatus, RuntimeStatus types, ErrorCodes

#### Section 2: Infrastructure - SQLite Database
- Installed `better-sqlite3` and `@types/better-sqlite3`
- Created `main/infrastructure/database/schema.ts` - All table SQL definitions
- Created `main/infrastructure/database/index.ts` - DB initialization with WAL mode
- Implemented cross-platform App Data path resolution
- Integrated database initialization into main process

#### Section 3: Infrastructure - Repositories
- Created `main/infrastructure/repositories/base.repo.ts` - BaseRepository with common ops
- Created `main/infrastructure/repositories/sqlite-project.repo.ts` - Full CRUD
- Created `main/infrastructure/repositories/sqlite-version.repo.ts` - Full CRUD
- Implemented cascade delete via foreign key constraints

#### Section 4: Infrastructure - Config Loader
- Installed `yaml` package
- Created `main/infrastructure/config-loader/yaml-config-loader.ts` with caching
- Created `config/state-machines/dev-flow.yaml` - Development flow state machine
- Created `config/state-machines/runtime-flow.yaml` - Runtime flow state machine
- Created `config/execution.yaml` - Global execution config

#### Section 5: Infrastructure - IPC Layer
- Created `main/infrastructure/ipc/project.ipc.ts` - Project CRUD handlers
- Created `main/infrastructure/ipc/version.ipc.ts` - Version CRUD handlers
- Created `main/infrastructure/ipc/system.ipc.ts` - Settings, folder selection, Claude check
- Created `main/infrastructure/ipc/index.ts` - Central registration
- Integrated IPC handlers into main process startup

#### Section 6: Frontend - Zustand Stores
- Created `renderer/stores/server.store.ts` - Projects, versions, settings, credentials
- Created `renderer/stores/realtime.store.ts` - Scaffold, execution, run subscriptions
- Created `renderer/stores/ui.store.ts` - Modals, toasts, sidebar, theme
- Created `shared/types/electron.d.ts` - window.api type declarations

#### Section 7: Integration & Verification
- Build: ✓
- Typecheck: ✓
- Lint: ✓ (only console warnings)
- Dev server: ✓

#### Unit Tests (62 tests passing)
- Repository tests: Project and Version CRUD, cascade delete
- Config loader tests: YAML parsing, state machines, caching
- Zustand store tests: UI store, Realtime store state management
- Added test helpers: createTestDatabase, setConfigDir

### Commits
- `d07c935` feat(m1): add shared layer types, interfaces, constants, errors
- `e0ade37` feat(m1): add SQLite database infrastructure
- `a262d70` feat(m1): add repository layer for projects and versions
- `bf54e90` feat(m1): add config-driven YAML loader with state machines
- `6f956bb` feat(m1): add IPC layer infrastructure
- `4114660` feat(m1): add Zustand stores for frontend state management
- `f8e7a66` test(m1): add unit tests for infrastructure layer

### Next Steps (M2)
- Implement Spec Editor page
- Add file system adapter for spec files
- Create scaffold generation flow
- Build Review page with TODO.md display

---

## 2025-01-09 - M2: Project Management - In Progress

### Summary
Implementing M2 (Project Management) milestone. Building the project and version management workflow with full end-to-end UI flow.

### Completed Sections

#### Section 1: Application Layer - Use Cases
- Created `main/application/use-cases/project/create-project.ts` - Creates project with directory structure
- Created `main/application/use-cases/project/list-projects.ts`
- Created `main/application/use-cases/project/get-project.ts`
- Created `main/application/use-cases/project/archive-project.ts`
- Created `main/application/use-cases/project/delete-project.ts`
- Created `main/application/use-cases/version/create-version.ts`
- Created `main/application/use-cases/version/list-versions.ts`
- Created `main/application/use-cases/version/get-version.ts`
- Created `main/application/use-cases/version/set-active-version.ts`

#### Section 2: FileSystem Adapter
- Created `main/infrastructure/adapters/file-system.adapter.ts`
- Implements IFileSystemAdapter for Node.js fs operations
- createProjectDirectory, pathExists, ensureDirectory, readFile, writeFile

#### Section 3: Refactor IPC Handlers
- Updated `main/infrastructure/ipc/project.ipc.ts` to use use cases
- Updated `main/infrastructure/ipc/version.ipc.ts` to use use cases
- project:create now uses CreateProjectUseCase (creates dir + db records)

#### Section 4: Frontend Primitives
- Created `renderer/components/primitives/Button/Button.tsx` - primary/secondary/ghost/destructive variants
- Created `renderer/components/primitives/Input/Input.tsx` - with error state, icon support
- Created `renderer/components/primitives/Card/Card.tsx` - with optional header
- Created `renderer/components/primitives/Modal/Modal.tsx` - with title, footer, backdrop
- Created `renderer/components/primitives/Badge/Badge.tsx` - success/warning/error/info variants
- Created `renderer/components/primitives/Spinner/Spinner.tsx` - sizes, colors

#### Section 5: ProjectListPage + ProjectCard
- Created `renderer/pages/ProjectListPage/ProjectListPage.tsx` - Main landing page
- Created `renderer/components/composites/ProjectCard/ProjectCard.tsx` - Project display card
- Grid layout, empty state, loading state

#### Section 6: CreateProjectModal
- Created `renderer/components/composites/CreateProjectModal/CreateProjectModal.tsx`
- Name input, path input with Browse button
- Create/Cancel buttons, loading state, error display

#### Section 7: Router Configuration
- Created `renderer/RootLayout.tsx` - Main layout wrapper
- Created `renderer/components/layout/Header/Header.tsx` - Top navigation
- Created `renderer/pages/ProjectLayout/ProjectLayout.tsx` - Project layout with sidebar
- Created `renderer/pages/SettingsPage/SettingsPage.tsx` - Placeholder
- Updated `renderer/router.tsx` - Nested routes for project pages

#### Section 8: Sidebar Component
- Created `renderer/components/layout/Sidebar/Sidebar.tsx`
- Project name, version selector, navigation links
- Development and Runtime sections, back to projects link

#### Section 9: OverviewPage
- Created `renderer/pages/OverviewPage/OverviewPage.tsx`
- Development status card with version info
- Runtime status card with trigger mode
- Version history section

#### Section 10: Style System - Warm Industrial
- Applied demo.jsx "Warm Industrial" aesthetic to all components
- Color palette: #faf9f7 background, #e5e5e5 borders, amber accents
- Updated all primitives, layouts, and pages with consistent styling
- Added `META/FRONTEND/templates/demo.jsx` as style reference

### Commits
- `f5920d8` feat(m2): add project and version use cases
- `c3dc4ef` feat(m2): add file system adapter
- `8be2a9e` refactor(m2): wire IPC handlers to use cases
- `e6cbe40` feat(m2): add UI primitive components
- `d45cee8` feat(m2): add ProjectListPage and ProjectCard
- `0e43959` feat(m2): add CreateProjectModal
- `29466ac` feat(m2): configure router with nested routes
- `1a60a36` feat(m2): add Sidebar component
- `6796732` feat(m2): add OverviewPage
- `e80cdad` style(m2): apply Warm Industrial design system from demo.jsx

### Next Steps
- Section 10: Integration & Verification testing
- End-to-end flow verification (create project, navigate, archive, delete)
- Run tests, verify build

---

## 2026-01-09 - M2.5: GitHub Integration - Complete

### Summary
Implemented GitHub-first project creation workflow. Every project is now bound to a GitHub repository. Projects are created on GitHub first, then cloned locally.

### Completed Sections

#### Section 1: Shared Types & Errors
- Created `shared/types/github.types.ts` - GitHubAuthStatus, GitHubUser, GitHubRepo, CreateRepoOptions
- Updated `shared/constants.ts` - Added GitHub error codes
- Updated `shared/errors.ts` - Added GitHubNotAuthenticatedError, GitHubCLINotFoundError, GitHubRepoExistsError, GitHubOperationError
- Updated `shared/types/runtime.types.ts` - Added cloneRoot to Settings

#### Section 2: Database Schema Migration
- Updated `main/infrastructure/database/schema.ts` - SCHEMA_VERSION=2, added github_repo/github_owner columns
- Updated `main/infrastructure/database/index.ts` - Added migration logic v1→v2
- Updated `shared/types/project.types.ts` - Added githubRepo, githubOwner to Project interface
- Updated `main/infrastructure/repositories/sqlite-project.repo.ts` - Handle new GitHub fields

#### Section 3: Settings Persistence
- Created `main/infrastructure/repositories/sqlite-settings.repo.ts` - SQLiteSettingsRepository
- Updated `main/infrastructure/ipc/system.ipc.ts` - Use repository instead of in-memory cache

#### Section 4: GitHubAdapter Implementation
- Created `main/infrastructure/adapters/github.adapter.ts` - GitHubAdapter using gh CLI
- Added `shared/interfaces/adapters.ts` - IGitHubAdapter interface
- Implemented: isAvailable, checkAuth, createRepo, cloneRepo, getAuthenticatedUser

#### Section 5: GitHub IPC Handlers
- Created `main/infrastructure/ipc/github.ipc.ts` - GitHub IPC handlers
- Updated `shared/types/ipc.types.ts` - Added GitHub channel types
- Channels: github:checkAuth, github:createRepo, github:cloneRepo

#### Section 6: Update CreateProjectUseCase
- Rewrote `main/application/use-cases/project/create-project.ts` - GitHub-first workflow
- Updated `main/infrastructure/ipc/project.ipc.ts` - Pass GitHub dependencies
- Updated `shared/types/project.types.ts` - Changed CreateProjectInput (removed path, added description/private)

#### Section 7: useGitHubAuth Hook
- Created `renderer/hooks/useGitHubAuth.ts` - React hook for GitHub auth status
- Created `renderer/hooks/index.ts` - Hooks index

#### Section 8: Update CreateProjectModal
- Rewrote `renderer/components/composites/CreateProjectModal/CreateProjectModal.tsx`
- Removed path selection, added description and private repo options
- GitHub-specific error handling

#### Section 9: Update SettingsPage
- Rewrote `renderer/pages/SettingsPage/SettingsPage.tsx`
- GitHub connection status with user avatar
- Clone root configuration with folder browser

#### Section 10: Integration Testing
- TypeCheck: ✓
- Lint: ✓ (only pre-existing warnings)
- Tests: 62 passing
- Build: ✓

### Commits
- `8313a83` feat(m2.5): add GitHub types and error classes
- `e59f885` feat(m2.5): add GitHub fields to projects schema
- `af8d701` feat(m2.5): persist settings to SQLite database
- `310fc7d` feat(m2.5): implement GitHubAdapter using gh CLI
- `a7d6bf8` feat(m2.5): add GitHub IPC handlers
- `b9b6381` feat(m2.5): implement GitHub-first project creation
- `f819cfa` feat(m2.5): add useGitHubAuth hook
- `dd76c79` feat(m2.5): implement SettingsPage with GitHub connection status

### Key Changes
- Projects are GitHub-first: every project is bound to a GitHub repository
- Path is derived from cloneRoot + repoName (no manual path selection)
- GitHub CLI (gh) is used for all GitHub operations (no OAuth tokens stored)
- Settings now persist to SQLite database

---

## 2026-01-09 - M3: Spec 编辑 - Complete

### Summary
Implemented Spec file editing functionality with CodeMirror-based Markdown editor. Users can now create and edit PRODUCT.md, TECHNICAL.md, and REGULATION.md files through the UI.

### Completed Sections

#### Section 0: Documentation Alignment
- Updated M3.md to remove FileSystemAdapter (already exists from M2)
- Updated COMPONENTS.md for CodeMirror usage
- Updated TODO.md with M3 section breakdown
- Updated MILESTONES/META.md status

#### Section 1: Shared Layer - IPC Types
- Added `spec:read` and `spec:save` channels to IPCChannelMap
- TypeScript compile passes

#### Section 2: Backend - Spec Use Cases
- Created `read-spec.ts` - reads spec file content by versionId + file type
- Created `save-spec.ts` - saves spec file content
- Returns empty string if file doesn't exist (graceful handling)

#### Section 3: Backend - IPC Handler
- Created `spec.ipc.ts` with `spec:read` and `spec:save` handlers
- Registered handlers in IPC index

#### Section 4: Frontend - Tabs Component
- Created reusable `Tabs` primitive component
- Amber bottom border indicator for active tab
- Follows design system conventions

#### Section 5: Frontend - Editor Components
- Installed CodeMirror and react-markdown dependencies
- Created `MarkdownEditor` with CodeMirror 6 integration
- Created `MarkdownPreview` with react-markdown
- Custom theme matching Warm Industrial design system

#### Section 6: Frontend - SpecPage and Hook
- Created `useUnsavedChanges` hook with React Router blocker + beforeunload
- Created `SpecPage` with 3 tabs (PRODUCT/TECHNICAL/REGULATION)
- Edit/preview toggle, manual save functionality
- Unsaved changes warning on tab switch and navigation

### Commits
- `7116857` feat(m3): implement Spec editing with CodeMirror editor

### Key Features
- Three spec files: PRODUCT.md, TECHNICAL.md, REGULATION.md
- CodeMirror 6 editor with Markdown syntax highlighting
- Toggle between edit and preview modes
- Manual save with unsaved changes indicator
- Navigation protection for unsaved changes
- Files stored in `{projectRoot}/META/CORE/`

### Tests
- TypeCheck: ✓
- Lint: ✓ (pre-existing warnings only)
- Tests: 62 passing

---

## 2026-01-09 - Test Coverage Improvement - Complete

### Summary
Increased test coverage from ~77% to 96.84%, exceeding the 95% target. Added comprehensive unit tests across infrastructure, application, stores, and renderer layers.

### New Test Files Created

#### Infrastructure Tests
- `tests/infrastructure/github.adapter.test.ts` - GitHubAdapter tests
  - checkAuth: authenticated, not authenticated, command not found, Windows errors
  - createRepo: URL parsing, private/public repos, description option, error handling
  - getRepoInfo: edge cases
- `tests/infrastructure/file-system.adapter.test.ts` - FileSystemAdapter tests
  - watch: file modifications, cleanup
- `tests/infrastructure/ipc.test.ts` - IPC handler tests

#### Application Tests
- `tests/application/use-cases/project/*.test.ts` - Project use case tests
- `tests/application/use-cases/version/*.test.ts` - Version use case tests
- `tests/application/use-cases/spec/*.test.ts` - Spec use case tests

#### Store Tests
- `tests/stores/server.store.test.ts` - ServerStore comprehensive tests
  - Error handling for all store actions
  - createVersion with existing versions
  - setCurrentVersion edge cases
- `tests/stores/ui.store.test.ts` - Additional tests
  - openModal with confirmDelete and data
  - confirmAction without callback
  - Selector tests
- `tests/stores/realtime.store.test.ts` - Additional tests
  - Hook selector tests
  - Event handler edge cases

#### Renderer Tests
- `tests/renderer/pages/SettingsPage.test.tsx` - SettingsPage tests
  - handleSaveCloneRoot: success, error, empty validation
  - handleBrowse: folder selection, cancellation, error handling
  - GitHub loading state
- `tests/renderer/pages/OverviewPage.test.tsx` - OverviewPage tests
  - Loading states
  - Different devStatus and runtimeStatus values
  - handleOpenInEditor error handling

#### Shared Tests
- `tests/shared/*.test.ts` - Shared utility tests

### Configuration Updates
- Updated `vitest.config.ts` to exclude non-source files:
  - META/**
  - scripts/**
  - **/demo.*

### Test Setup
- Created `tests/setup.ts` with test environment configuration

### Coverage Results
- **Final Coverage: 96.84%** (target: 95%)
- All tests passing
- TypeCheck: ✓
- Lint: ✓

---

## 2026-01-10 - IPC Error Handling Fix & DeleteProjectModal Improvements

### Summary
Fixed a bug where IPC handler rejections caused the DeleteProjectModal UI to get stuck, and improved the UX for GitHub scope errors.

### Problem
- Some IPC handlers in main process throw errors using `serializeError(error)`
- When they throw, `window.api.invoke(...)` rejects instead of returning a value
- `DeleteProjectModal` was written assuming `await deleteProject(...)` always resolves to an `IPCResult`
- If it rejected, the code never reached the `if (!result.ok)` branch, leaving `loading: true` forever

### Fix (Two-Layer Defense)

#### Layer 1: Store Normalization ([server.store.ts:127-141](src/renderer/stores/server.store.ts#L127-L141))
- Wrapped IPC invoke in try/catch
- Convert Promise rejections into `{ ok: false, error: ipcError }` IPCResult
- Now `deleteProject()` always returns an `IPCResult`, matching its contract

#### Layer 2: Component Resilience ([DeleteProjectModal.tsx:105-112](src/renderer/components/composites/DeleteProjectModal/DeleteProjectModal.tsx#L105-L112))
- Added try/catch around the entire operation
- Added `finally` block to always clear loading state
- Ensures UI never gets stuck regardless of how errors occur

### UX Improvements

#### Scope Error Recovery Flow ([DeleteProjectModal.tsx:116-150](src/renderer/components/composites/DeleteProjectModal/DeleteProjectModal.tsx#L116-L150))
- Added `handleDeleteLocalOnly` function as fallback when GitHub deletion fails
- When `GITHUB_MISSING_SCOPE` error occurs, modal shows alternative "Delete Local Files Only" button
- User can proceed without granting `delete_repo` scope by keeping GitHub repo but removing local files
- Project becomes "Inactive" in Forge, can be re-cloned later

#### Improved Warning Messages ([DeleteProjectModal.tsx:265-287](src/renderer/components/composites/DeleteProjectModal/DeleteProjectModal.tsx#L265-L287))
- Clearer messaging based on deletion options selected
- GitHub + local deletion: explicit "permanent and cannot be undone" warning
- Local-only deletion: explains project becomes "Inactive" in Forge
- Remove from Forge only: explains files are preserved

### Key Insight
When frontend code expects `IPCResult<T>`, the store layer should normalize IPC rejections into the same shape, providing a consistent contract for UI components.

---
