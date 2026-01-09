# TODO TRACKER
This tracker serves as a log of what we need to do in the next iteration of development. sections are separated by time(date granularity). APPEND ONLY.

---

## 2025-01-09

### M1: 核心基础设施

#### 1. Shared Layer - Types & Interfaces

- [ ] 1.1 Create `shared/types/project.types.ts` - Project, Version entity types
- [ ] 1.2 Create `shared/types/execution.types.ts` - Execution, Task types
- [ ] 1.3 Create `shared/types/runtime.types.ts` - RuntimeConfig, Run types
- [ ] 1.4 Create `shared/types/ipc.types.ts` - IPC channel input/output types
- [ ] 1.5 Create `shared/interfaces/repositories.ts` - IProjectRepository, IVersionRepository
- [ ] 1.6 Create `shared/interfaces/adapters.ts` - IFileSystemAdapter (placeholder)
- [ ] 1.7 Create `shared/errors.ts` - ForgeError base class, DuplicateError, NotFoundError, etc.
- [ ] 1.8 Create `shared/constants.ts` - DevStatus, RuntimeStatus enums

**Tests:**
- [ ] 1.T1 Unit test for error classes serialization

#### 2. Infrastructure - SQLite Database

- [ ] 2.1 Install `better-sqlite3` and `@types/better-sqlite3`
- [ ] 2.2 Create `main/infrastructure/database/index.ts` - DB initialization
- [ ] 2.3 Create `main/infrastructure/database/schema.ts` - Table creation SQL
- [ ] 2.4 Create `main/infrastructure/database/migrations.ts` - Migration runner (simple version)
- [ ] 2.5 Implement App Data path resolution (cross-platform)
- [ ] 2.6 Add database initialization to main process startup

**Tests:**
- [ ] 2.T1 Integration test: database file creation
- [ ] 2.T2 Integration test: schema creation and table existence

#### 3. Infrastructure - Repositories

- [ ] 3.1 Create `main/infrastructure/repositories/base.repo.ts` - Base repository class
- [ ] 3.2 Create `main/infrastructure/repositories/sqlite-project.repo.ts`
- [ ] 3.3 Create `main/infrastructure/repositories/sqlite-version.repo.ts`
- [ ] 3.4 Implement CRUD operations for ProjectRepository
- [ ] 3.5 Implement CRUD operations for VersionRepository

**Tests:**
- [ ] 3.T1 Unit test: ProjectRepository.create
- [ ] 3.T2 Unit test: ProjectRepository.findById, findAll
- [ ] 3.T3 Unit test: ProjectRepository.archive, delete
- [ ] 3.T4 Unit test: VersionRepository.create
- [ ] 3.T5 Unit test: VersionRepository.findByProject
- [ ] 3.T6 Unit test: VersionRepository.updateStatus

#### 4. Infrastructure - Config Loader

- [ ] 4.1 Install `yaml` package
- [ ] 4.2 Create `main/infrastructure/config-loader/yaml-config-loader.ts`
- [ ] 4.3 Create `config/state-machines/dev-flow.yaml` - Dev flow state machine
- [ ] 4.4 Create `config/state-machines/runtime-flow.yaml` - Runtime flow state machine
- [ ] 4.5 Create `config/execution.yaml` - Global execution config (placeholder)
- [ ] 4.6 Implement config caching mechanism

**Tests:**
- [ ] 4.T1 Unit test: YAML parsing and validation
- [ ] 4.T2 Unit test: Config loader error handling (missing file, invalid YAML)

#### 5. Infrastructure - IPC Layer

- [ ] 5.1 Create `main/infrastructure/ipc/index.ts` - IPC registration entry point
- [ ] 5.2 Create `main/infrastructure/ipc/project.ipc.ts` - Project handlers
- [ ] 5.3 Create `main/infrastructure/ipc/version.ipc.ts` - Version handlers
- [ ] 5.4 Create `main/infrastructure/ipc/system.ipc.ts` - System handlers (getAppInfo, selectFolder)
- [ ] 5.5 Implement error serialization for IPC (preserve error codes)
- [ ] 5.6 Register IPC handlers in main process startup
- [ ] 5.7 Update preload to expose typed API

**Tests:**
- [ ] 5.T1 Integration test: IPC invoke returns correct data
- [ ] 5.T2 Integration test: IPC error handling and serialization

#### 6. Frontend - Zustand Stores

- [ ] 6.1 Install `zustand` (already in package.json, verify)
- [ ] 6.2 Create `renderer/stores/server.store.ts` - Server data store skeleton
- [ ] 6.3 Create `renderer/stores/realtime.store.ts` - Realtime store skeleton
- [ ] 6.4 Create `renderer/stores/ui.store.ts` - UI state store
- [ ] 6.5 Implement basic `fetchProjects` action in server store
- [ ] 6.6 Wire up store to test IPC connectivity

**Tests:**
- [ ] 6.T1 Unit test: Store actions update state correctly

#### 7. Integration & Verification

- [ ] 7.1 Create simple test page to verify IPC round-trip
- [ ] 7.2 Verify SQLite DB created in correct App Data location
- [ ] 7.3 Verify YAML configs load on startup
- [ ] 7.4 End-to-end: Create project via IPC, verify in DB

#### 8. Documentation & Cleanup

- [ ] 8.1 Create `main/infrastructure/database/DATABASE_META.md`
- [ ] 8.2 Create `main/infrastructure/ipc/IPC_META.md`
- [ ] 8.3 Update PROGRESS.md with M1 completion details
- [ ] 8.4 Run linter and fix any issues
- [ ] 8.5 Final review and commit

---

### Potential Additional Tasks (discovered during implementation)

- [ ] P1. TypeScript path aliases setup (`@shared`, `@main`, `@renderer`)
- [ ] P2. Vitest configuration for main process tests
- [ ] P3. Test utilities and fixtures setup
- [ ] P4. UUID generation utility (use `crypto.randomUUID()`)
- [ ] P5. Date formatting utility (ISO 8601)
- [ ] P6. Logger setup for main process
- [ ] P7. Electron app data path utility