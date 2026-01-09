# TODO TRACKER
This tracker serves as a log of what we need to do in the next iteration of development. sections are separated by time(date granularity). APPEND ONLY.

---

## 2025-01-09 - M1: Core Infrastructure (COMPLETE)

All tasks completed. See PROGRESS.md for details.

---

## Next: M2 Preparation

### M2: Spec 编辑与 Scaffold 生成

#### 1. File System Adapter
- [ ] Create `main/infrastructure/adapters/file-system.adapter.ts`
- [ ] Implement read/write for spec files (PRODUCT.md, TECHNICAL.md, REGULATION.md)
- [ ] Implement directory operations for project structure

#### 2. Spec IPC Handlers
- [ ] Create `main/infrastructure/ipc/spec.ipc.ts`
- [ ] Implement `spec:read`, `spec:save` handlers
- [ ] Implement `spec:generateScaffold` handler (stub)

#### 3. Frontend Pages
- [ ] Create `renderer/pages/ProjectListPage/` - Project list view
- [ ] Create `renderer/pages/SpecPage/` - Spec editor view
- [ ] Set up React Router with routes

#### 4. Components
- [ ] Create basic primitives (Button, Input, Card, etc.)
- [ ] Create MarkdownEditor component (simple textarea initially)
- [ ] Create navigation/sidebar components

#### 5. Integration
- [ ] Wire up project creation flow end-to-end
- [ ] Wire up spec editing flow
- [ ] Test IPC communication with real UI

---

### Potential Tasks (discovered during M1)
- [x] P1. TypeScript path aliases setup (`@shared`) - Done
- [x] P2. Vitest configuration for main process tests - Done
- [x] P3. Test utilities and fixtures setup - Done
- [x] P4. UUID generation utility (`crypto.randomUUID()`) - Done
- [x] P5. Date formatting utility (ISO 8601) - Done
- [ ] P6. Logger setup for main process
- [x] P7. Electron app data path utility - Done
