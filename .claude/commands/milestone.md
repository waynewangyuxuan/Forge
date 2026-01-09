# Milestone Development Workflow

This skill guides the full milestone implementation process for the Forge project.

## Pre-Milestone

Before starting a milestone:

1. **Read documentation**:
   - `META/MILESTONES/Mx.md` - milestone requirements
   - `META/CORE/PRODUCT.md` - product context
   - `META/CORE/REGULATION.md` - code conventions
   - `META/FILE-STRUCTURE.md` - where files go

2. **Create/checkout branch**:
   ```bash
   git checkout -b ms<number>
   ```

3. **Plan sections** in TODO.md:
   - Break deliverables into logical sections
   - Each section = atomic + testable + committable
   - Include tests for each section

## During Milestone

### Section Workflow

For EACH section:

1. **Mark section in-progress** (TodoWrite tool)

2. **Implement** the section tasks

3. **Verify**:
   ```bash
   npm run typecheck && npm run lint
   ```

4. **Commit** (one commit per section):
   ```bash
   git add -A
   git commit -m "feat(m<n>): <section description>"
   ```

5. **Update TODO.md** - mark tasks complete

6. **Mark section complete** (TodoWrite tool)

7. **Move to next section**

### Commit Message Format

```
<type>(m<n>): <short description>

- Bullet point 1
- Bullet point 2

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

## Post-Milestone

After all sections complete:

1. **Update documentation**:
   - `META/TODO.md` - mark milestone complete
   - `META/MILESTONES/META.md` - update status
   - `META/PROGRESS.md` - add completion summary

2. **Final verification**:
   ```bash
   npm run typecheck && npm run lint && npm test
   ```

3. **Commit docs update**:
   ```bash
   git commit -m "docs(m<n>): mark milestone complete"
   ```

4. **Push to remote**:
   ```bash
   git push -u origin ms<number>
   ```

## Key Rules

- **One commit per section** - never bundle sections
- **Verify before every commit** - typecheck + lint
- **Update TODO.md** after each section
- **Follow FILE-STRUCTURE.md** for file placement
- **Follow REGULATION.md** for code style
