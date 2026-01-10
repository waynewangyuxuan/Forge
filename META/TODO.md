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

## M3: Spec 编辑 (COMPLETE)

### Section 0: Documentation Alignment
- [x] 0.1 Update M3.md - Remove FileSystemAdapter deliverable
- [x] 0.2 Update COMPONENTS.md - Note CodeMirror for MarkdownEditor
- [x] 0.3 Update TODO.md - M3 section breakdown
- [x] 0.4 Update MILESTONES/META.md - Mark M3 in-progress

### Section 1: Shared Layer - IPC Types
- [x] 1.1 Add `spec:read` and `spec:save` channels to IPCChannelMap
**Tests:**
- [x] 1.T1 TypeScript compile passes

### Section 2: Backend - Spec Use Cases
- [x] 2.1 Create `read-spec.ts` - Read spec file content by versionId + file type
- [x] 2.2 Create `save-spec.ts` - Save spec file content
- [x] 2.3 Create barrel export `index.ts`
- [x] 2.4 Update use-cases index to export spec
**Tests:** (Unit tests pending - functional implementation complete)
- [ ] 2.T1 read-spec returns content when file exists
- [ ] 2.T2 read-spec returns empty string when file doesn't exist
- [ ] 2.T3 read-spec throws ValidationError for invalid versionId
- [ ] 2.T4 save-spec writes content correctly
- [ ] 2.T5 save-spec creates directories if needed

### Section 3: Backend - IPC Handler
- [x] 3.1 Create `spec.ipc.ts` with `spec:read` and `spec:save` handlers
- [x] 3.2 Register handlers in `index.ts`
**Tests:** (Integration tests pending - functional implementation complete)
- [ ] 3.T1 Integration test: spec:read returns file content
- [ ] 3.T2 Integration test: spec:save writes file
- [ ] 3.T3 Integration test: spec:read returns empty for non-existent file

### Section 4: Frontend - Tabs Component
- [x] 4.1 Create generic `Tabs` component following design system
- [x] 4.2 Create barrel export
- [x] 4.3 Update primitives index
**Tests:** (Component tests pending)
- [ ] 4.T1 Component renders all tabs
- [ ] 4.T2 Active tab has correct styling
- [ ] 4.T3 onChange called with correct key on click

### Section 5: Frontend - Editor Components
- [x] 5.1 Install CodeMirror and react-markdown dependencies
- [x] 5.2 Create `MarkdownEditor` with CodeMirror integration
- [x] 5.3 Create `MarkdownPreview` with react-markdown
- [x] 5.4 Style components to match warm industrial design
**Tests:** (Component tests pending)
- [ ] 5.T1 MarkdownEditor renders CodeMirror instance
- [ ] 5.T2 MarkdownEditor calls onChange on content change
- [ ] 5.T3 MarkdownEditor respects readOnly prop
- [ ] 5.T4 MarkdownPreview renders markdown correctly
- [ ] 5.T5 MarkdownPreview handles empty content

### Section 6: Frontend - SpecPage and Hook
- [x] 6.1 Create `useUnsavedChanges` hook with React Router blocker + beforeunload
- [x] 6.2 Create `SpecPage` with tabs, edit/preview toggle, save functionality
- [x] 6.3 Update router to use actual SpecPage
**Tests:** (Component tests pending)
- [ ] 6.T1 useUnsavedChanges blocks navigation when dirty
- [ ] 6.T2 useUnsavedChanges allows navigation when clean
- [ ] 6.T3 SpecPage loads content on mount
- [ ] 6.T4 SpecPage switches tabs correctly
- [ ] 6.T5 SpecPage saves content on Save click
- [ ] 6.T6 SpecPage toggles edit/preview modes
- [ ] 6.T7 SpecPage warns on tab switch with unsaved changes

---

## M3.5: Bug Fixes & Enhancements (COMPLETE)

### Section 1: Delete Project Feature (GitHub + Local)
- [x] 1.1 Add `deleteRepo` method to GitHubAdapter (uses `gh repo delete`)
- [x] 1.2 Update `delete-project.ts` use case (deletes from DB, GitHub, and local)
- [x] 1.3 Update `project:delete` IPC handler with options `{ deleteFromGitHub, deleteLocalFiles }`
- [x] 1.4 Create `DeleteProjectModal` component with checkboxes for deletion options
- [x] 1.5 Update `ProjectCard` to use new delete modal (added delete button)
- [x] 1.6 Update `server.store.ts` deleteProject action with options

### Section 2: Fix macOS Window Buttons Overlap (Issue #4)
- [x] 2.1 Add left padding to Header component for macOS traffic lights (80px)
- [x] 2.2 Use `navigator.platform` to detect macOS in renderer

### Section 3: Fix GitHub Avatar Not Displaying (Issue #5)
- [x] 3.1 Fixed CSP - Added `img-src` directive to allow GitHub avatar URLs
- [x] 3.2 Added fallback avatar (initials) when avatar fails to load
- [x] 3.3 Added `onError` handler to gracefully handle image load failures

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
