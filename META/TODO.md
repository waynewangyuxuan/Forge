# TODO TRACKER
This tracker serves as a log of what we need to do in the next iteration of development. sections are separated by time(date granularity). APPEND ONLY.

---

## 2025-01-09 - M1: Core Infrastructure (COMPLETE)

All tasks completed. See PROGRESS.md for details.

---

## M2: Project Management (IN PROGRESS)

### Completed Sections

#### 1. Application Layer - Use Cases
- [x] Create project use cases (create, list, get, archive, delete)
- [x] Create version use cases (create, list, get, set-active)

#### 2. FileSystem Adapter
- [x] Create `main/infrastructure/adapters/file-system.adapter.ts`
- [x] Implement directory operations for project structure

#### 3. Refactor IPC Handlers
- [x] Wire IPC handlers to use cases instead of direct repo calls

#### 4. Frontend Primitives
- [x] Create Button, Input, Card, Modal, Badge, Spinner components

#### 5. ProjectListPage + ProjectCard
- [x] Create `renderer/pages/ProjectListPage/` - Project list view
- [x] Create `renderer/components/composites/ProjectCard/` - Project card

#### 6. CreateProjectModal
- [x] Create modal with name, path inputs and Browse button

#### 7. Router Configuration
- [x] Set up React Router with nested routes
- [x] Create RootLayout, Header, ProjectLayout

#### 8. Sidebar Component
- [x] Create Sidebar with navigation and version selector

#### 9. OverviewPage
- [x] Create project overview with status cards

#### 10. Style System
- [x] Apply Warm Industrial design from demo.jsx
- [x] Update all components with consistent color palette

### Remaining Tasks

#### Integration & Verification
- [ ] End-to-end test: Create project flow
- [ ] End-to-end test: Navigate project pages
- [ ] End-to-end test: Archive/delete project
- [ ] Manual verification in dev mode

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
