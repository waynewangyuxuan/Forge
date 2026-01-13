# ISSUE-010: IPC Error Handling Unification

**GitHub Issue**: [#10](https://github.com/waynewang/Forge/issues/10)
**Status**: In Progress
**Created**: 2026-01-11

---

## Problem Summary

IPC has two inconsistent patterns:
- **Throw pattern** (17 handlers): `throw serializeError(error)` - error codes may be lost in Electron serialization
- **Result envelope** (1 handler): `{ ok: true, data } | { ok: false, error }` - error codes survive reliably

This causes real bugs: `CreateProjectModal` depends on `err.code` which may be `undefined` after IPC.

---

## Solution: Unify to IPCResult<T> Envelope Pattern

All IPC handlers will return `IPCResult<T>` instead of throwing. This matches the existing `project:delete` implementation.

---

## Implementation Sections

### Section 1: Update IPC Types
**File**: `src/shared/types/ipc.types.ts`

Update `IPCChannelMap` to wrap all outputs in `IPCResult<T>`:
```typescript
'project:list': { input: ProjectListInput; output: IPCResult<Project[]> }
'project:create': { input: CreateProjectInput; output: IPCResult<Project> }
'github:checkAuth': { input: void; output: IPCResult<GitHubCheckAuthOutput> }
// ... all other channels
```

### Section 2: Update IPC Handlers

Convert all handlers from throw to envelope pattern.

**Files**:
- `src/main/infrastructure/ipc/project.ipc.ts` (4 handlers)
- `src/main/infrastructure/ipc/version.ipc.ts` (4 handlers)
- `src/main/infrastructure/ipc/spec.ipc.ts` (2 handlers)
- `src/main/infrastructure/ipc/github.ipc.ts` (3 handlers)
- `src/main/infrastructure/ipc/system.ipc.ts` (5 handlers)

**Before**:
```typescript
ipcMain.handle('project:list', async (_event, input) => {
  try {
    return await listProjects(...)
  } catch (error) {
    throw serializeError(error)
  }
})
```

**After**:
```typescript
ipcMain.handle('project:list', async (_event, input): Promise<IPCResult<Project[]>> => {
  try {
    const data = await listProjects(...)
    return { ok: true, data }
  } catch (error) {
    return { ok: false, error: serializeError(error) }
  }
})
```

### Section 3: Simplify Preload Layer
**File**: `src/preload/index.ts`

Remove try-catch since all results are now envelopes:
```typescript
invoke: async (channel: string, data?: unknown) => {
  return await ipcRenderer.invoke(channel, data)
}
```

### Section 4: Update Server Store
**File**: `src/renderer/stores/server.store.ts`

Two patterns based on caller needs:

**Pattern A: Fetch operations (list/fetchVersions/fetchSettings)**
Store uses `unwrapResult` internally, throws on error. Callers use try/catch as before:
```typescript
fetchProjects: async () => {
  const result = await invokeTyped('project:list', {})
  const projects = unwrapResult(result)  // throws if !ok
  set({ projects })
}
```

**Pattern B: Mutations needing error codes (create/delete)**
Return `IPCResult<T>` to UI for structured error handling:
```typescript
createProject: async (input): Promise<IPCResult<Project>> => {
  const result = await invokeTyped('project:create', input)
  if (result.ok) {
    set((s) => ({ projects: [...s.projects, result.data] }))
  }
  return result
}
```

**Key**: Reuse existing `unwrapResult` from `src/renderer/lib/ipc.ts` - don't hand-write null checks.

| Method | Pattern | Reason |
|--------|---------|--------|
| fetchProjects, fetchVersions, fetchSettings, fetchCredentials | A (unwrap) | No error code dispatch needed |
| createProject, createVersion, addCredential | B (IPCResult) | UI needs error codes for field validation |
| deleteProject | B (IPCResult) | Already done, reference implementation |
| archiveProject, activateProject | B (IPCResult) | May need error codes |

### Section 5: Update UI Components
**File**: `src/renderer/components/composites/CreateProjectModal/CreateProjectModal.tsx`

Use `result.ok` pattern instead of try-catch:
```typescript
const result = await createProject({ ... })
if (!result.ok) {
  const { error } = result
  if (error.code === ErrorCodes.GITHUB_NOT_AUTHENTICATED) {
    showToast({ type: 'error', message: 'Please connect GitHub in Settings first' })
  }
  // ... other error codes
  return
}
showToast({ type: 'success', message: `Project "${result.data.name}" created` })
```

### Section 6: Fix hasLocalFiles Bug
**File**: `src/main/application/use-cases/project/delete-project.ts`

Current bug: Returns `hasLocalFiles: false` even when local deletion failed.

**Option A (Quick fix)**: Invert the flag logic
```typescript
const localDeleteFailed = warnings.some(w => w.code === WarningCodes.LOCAL_DELETE_FAILED)
return {
  outcome: 'deactivated',
  project: { ...project, hasLocalFiles: localDeleteFailed },  // true if failed, false if succeeded
  warnings,
}
```

**Option B (Data-driven, recommended)**: Check actual filesystem state
```typescript
// After delete attempt, verify actual state
const stillExists = await fs.pathExists(project.path)
return {
  outcome: 'deactivated',
  project: { ...project, hasLocalFiles: stillExists },
  warnings,
}
```

Option B is preferred because it derives state from facts (filesystem) rather than inferring from operation outcome.

### Section 7: Update Tests
**File**: `tests/infrastructure/ipc.test.ts`

Update assertions to expect IPCResult envelope:
```typescript
it('should handle project:list', async () => {
  const result = await invokeHandler('project:list', {})
  expect(result.ok).toBe(true)
  expect(result.data).toHaveLength(1)
})
```

---

## Critical Files

| File | Changes |
|------|---------|
| `src/shared/types/ipc.types.ts` | Wrap all channel outputs in IPCResult<T> |
| `src/main/infrastructure/ipc/*.ts` | Convert throw → return envelope |
| `src/preload/index.ts` | Remove try-catch |
| `src/renderer/stores/server.store.ts` | Handle IPCResult for all actions |
| `src/renderer/components/composites/CreateProjectModal/CreateProjectModal.tsx` | Use result.ok pattern |
| `src/main/application/use-cases/project/delete-project.ts` | Fix hasLocalFiles bug |
| `tests/infrastructure/ipc.test.ts` | Update assertions |

---

## Implementation Order

1. Section 1: Types (non-breaking)
2. Section 2: IPC handlers (one file at a time)
3. Section 3: Preload simplification
4. Section 4: Server store
5. Section 5: UI components
6. Section 6: hasLocalFiles bug fix
7. Section 7: Tests

---

## Verification

After implementation:
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes (all 62+ tests)
- [ ] Manual test: Create project with GitHub not authenticated → shows correct error
- [ ] Manual test: Create project with existing repo name → shows field error
- [ ] Manual test: Delete project with missing scope → shows scope error with command
- [ ] No `throw serializeError(error)` remains in IPC handlers
