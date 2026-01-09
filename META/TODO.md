# TODO TRACKER
This tracker serves as a log of what we need to do in the next iteration of development. sections are separated by time(date granularity). APPEND ONLY.

---

## 2025-01-09 - M1: Core Infrastructure (COMPLETE)

All tasks completed. See PROGRESS.md for details.

---

## M2: Project Management (COMPLETE)

All tasks completed. See PROGRESS.md for details.

---

## M2.5: GitHub Integration (COMPLETE)

### Completed Sections

#### 1. Shared Types & Errors
- [x] Create `shared/types/github.types.ts`
- [x] Add GitHub error codes to constants
- [x] Add GitHub error classes to errors.ts

#### 2. Database Schema Migration
- [x] Update schema to v2 with github_repo/github_owner columns
- [x] Add migration logic v1→v2
- [x] Update Project interface and repository

#### 3. Settings Persistence
- [x] Create SQLiteSettingsRepository
- [x] Update system IPC to use repository

#### 4. GitHubAdapter Implementation
- [x] Create GitHubAdapter using gh CLI
- [x] Add IGitHubAdapter interface

#### 5. GitHub IPC Handlers
- [x] Create github.ipc.ts with checkAuth, createRepo, cloneRepo

#### 6. Update CreateProjectUseCase
- [x] Implement GitHub-first workflow
- [x] Update project IPC with new dependencies

#### 7. useGitHubAuth Hook
- [x] Create useGitHubAuth hook for frontend

#### 8. Update CreateProjectModal
- [x] Remove path selection
- [x] Add description and private repo options

#### 9. Update SettingsPage
- [x] GitHub connection status display
- [x] Clone root configuration

#### 10. Integration Testing
- [x] All tests passing
- [x] Build successful

---

## Next: M3 Preparation

### M3: Spec 编辑与 Scaffold 生成

#### 1. Spec IPC Handlers
- [ ] Create `main/infrastructure/ipc/spec.ipc.ts`
- [ ] Implement `spec:read`, `spec:save` handlers
- [ ] Implement `spec:generateScaffold` handler (stub)

#### 2. Frontend Pages
- [ ] Create `renderer/pages/SpecPage/` - Spec editor view

#### 3. Components
- [ ] Create MarkdownEditor component (simple textarea initially)

#### 4. Integration
- [ ] Wire up spec editing flow
- [ ] Test IPC communication with real UI

---

### Potential Tasks (discovered during M1/M2)
- [x] P1. TypeScript path aliases setup (`@shared`) - Done
- [x] P2. Vitest configuration for main process tests - Done
- [x] P3. Test utilities and fixtures setup - Done
- [x] P4. UUID generation utility (`crypto.randomUUID()`) - Done
- [x] P5. Date formatting utility (ISO 8601) - Done
- [ ] P6. Logger setup for main process
- [x] P7. Electron app data path utility - Done
- [ ] P8. Add tests for M2 use cases
- [ ] P9. Add tests for M2 components (optional)
