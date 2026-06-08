---
name: plan
description: Decompose specs into small, verifiable tasks with dependency ordering
---

# /plan — Planning & Task Breakdown

> "Vertical slices, not horizontal layers."

## Purpose

Transform a specification into an ordered list of small, verifiable tasks. Each task delivers end-to-end functionality.

## Prerequisites

- A specification exists (`.claude/features/[feature-name]/SPEC.md` or described requirements)
- Understanding of the codebase structure

## Workflow

### Phase 1: Analysis (Read-Only)

1. **Read the spec** — Understand objectives and acceptance criteria
2. **Survey the codebase** — Identify relevant files, patterns, and integration points
3. **Map dependencies** — Which components depend on which?

> **Do NOT modify code during planning.**

### Phase 2: Vertical Slicing

Break work into **vertical slices** — each slice delivers complete functionality through all layers:

```
❌ Horizontal (anti-pattern):
   Task 1: Create all DB models
   Task 2: Create all services
   Task 3: Create all API routes

✅ Vertical (correct):
   Task 1: POST /tasks — create a task (DB schema + repository + service + route)
   Task 2: GET /tasks — list tasks with pagination (repository + service + route)
   Task 3: PATCH /tasks/:id — mark task complete (repository + service + route)
```

### Phase 3: Task Definition

Each task must include:

```markdown
## Task: [Short description]

**Objective**: [What this achieves]

**Files to modify**:
- `src/infrastructure/database/prisma/schema.prisma`
- `src/domain/repositories/task.repository.ts`
- `src/domain/services/task.service.ts`
- `src/app/routes/v1/tasks.routes.ts`
- `src/app/controllers/task.controller.ts`

**Acceptance Criteria**:
- [ ] User can [action]
- [ ] [Validation] is enforced
- [ ] Test covers [scenario]

**Dependencies**: [Task IDs this depends on]

**Verification**:
- [ ] Unit tests pass
- [ ] Integration test added
- [ ] Manual verification: [steps]
```

### Phase 4: Ordering

Order tasks by:
1. **Foundation first** — DB models, types, shared utilities
2. **Risk-first** — Tackle uncertain/complex items early
3. **Dependencies** — Respect the dependency graph
4. **Quick wins** — Early momentum with smaller tasks

### Phase 5: Checkpoints

Insert checkpoints between major phases:

```markdown
---
## Checkpoint: Core CRUD Complete

**Verify before proceeding**:
- [ ] All CRUD operations work
- [ ] Test coverage > 80%
- [ ] No console errors
- [ ] Performance acceptable

---
```

## Output

Save to `.claude/features/[feature-name]/` directory (same folder as SPEC.md):

- `.claude/features/[feature-name]/plan.md` — Full planning document with context
- `.claude/features/[feature-name]/todo.md` — Actionable task checklist

```markdown
# TODO: [Feature Name]

## Phase 1: Foundation
- [ ] Task 1.1: [Description]
- [ ] Task 1.2: [Description]

## Checkpoint: Foundation Complete

## Phase 2: Core Features
- [ ] Task 2.1: [Description]
- [ ] Task 2.2: [Description]

## Checkpoint: Core Complete

## Phase 3: Polish
- [ ] Task 3.1: [Description]
```

## Next Step

After plan is approved, run `/build` to implement tasks incrementally.
