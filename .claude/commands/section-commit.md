# Section-Based Commit Workflow

This skill enforces the Forge project's section-based development model where each section is committed independently.

## Workflow

When implementing a milestone, follow this commit methodology:

1. **Section as atomic unit**: Each section is a complete, testable, and committable unit of work
2. **Commit after each section**: Do NOT bundle multiple sections into one commit
3. **Verify before commit**: Run typecheck and lint before each commit

## Commit Flow

```
Section 0 (if docs) → verify → commit
     ↓
Section 1 → verify → commit
     ↓
Section 2 → verify → commit
     ↓
... continue for each section ...
```

## Commit Message Format

Use this format for section commits:

```
<type>(m<milestone>): <section description>

<bullet points of what was done>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

Example:
```
feat(m3): implement spec IPC handlers

- Create spec.ipc.ts with read and save handlers
- Register handlers in IPC index
- TypeCheck passes

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## Verification Checklist

Before each section commit:
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` has no new errors
- [ ] Section functionality is complete
- [ ] Files are staged (`git add`)

## Instructions

When you complete a section:

1. Run verification:
   ```bash
   npm run typecheck && npm run lint
   ```

2. Stage and commit:
   ```bash
   git add -A
   git commit -m "<message following format above>"
   ```

3. Update TODO.md to mark section tasks as complete

4. Move to next section

## Important Rules

- **NEVER** bundle multiple sections into one commit
- **ALWAYS** verify (typecheck + lint) before committing
- **ALWAYS** update TODO.md after completing each section
- Keep commit messages concise but descriptive
