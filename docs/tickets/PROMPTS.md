# PROMPTS.md

Production-ready prompt templates for Codex execution.

Use these templates to keep output consistent, reduce ambiguity, and enforce senior-level engineering workflow.

---

# Core Rules (Apply to Every Prompt)

Always include:

* exact ticket ID
* relevant docs to read
* allowed scope
* forbidden scope
* verification commands
* final output format
* ask for plan first on non-trivial tasks

Never submit vague prompts like:

```text
Build checkout system
Fix backend
Improve frontend
```

Use constrained prompts only.

---

# Standard Completion Format

Every completed task must end with:

```text
1. Summary
2. Files Changed
3. Tests Run + Results
4. Risks / Follow-ups
```

---

# Standard Planning Format

Before coding:

```text
1. Task Summary
2. Impacted Files
3. Short Implementation Plan
```

---

# 1. Generic Single-Ticket Template

```text
Read AGENTS.md first.
Read only docs relevant to <TICKET_ID>.

Work on <TICKET_ID> only.

Allowed scope:
- <files/modules>

Forbidden scope:
- <files/modules>

Verification:
- <commands>

Rules:
- Do not start coding immediately.
- Do not make unrelated refactors.
- Do not change architecture.
- If blocked by unresolved decisions, use docs/product/open-decisions.md defaults and state assumptions explicitly.

First provide:
1. Task Summary
2. Impacted Files
3. Short Implementation Plan

Then implement.

After completion report:
1. Summary
2. Files Changed
3. Tests Run + Results
4. Risks / Follow-ups
```

---

# 2. Backend Feature Ticket

Use for:

* BE-xxx tickets
* APIs
* services
* migrations
* auth
* checkout
* payment

```text
Read AGENTS.md first.
Read docs relevant to BE-024.

Work on BE-024 only.

Allowed scope:
- backend/app/api/**
- backend/app/services/**
- backend/app/repositories/**
- backend/app/schemas/**
- backend/tests/**
- backend/alembic/** if required

Forbidden scope:
- frontend/**
- infra/**
- unrelated modules

Verification:
- Run pytest backend/tests/
- Run ruff check backend/
- Run mypy backend/ if configured

Rules:
- Follow router/service/repository separation.
- Every schema change requires migration.
- Do not place business logic in route handlers.
- Keep backward compatibility when possible.

First provide:
1. Task Summary
2. Impacted Files
3. Short Implementation Plan

Then implement.

After completion report:
1. Summary
2. Files Changed
3. Tests Run + Results
4. Risks / Follow-ups
```

---

# 3. Frontend Feature Ticket

Use for:

* FE-xxx tickets
* pages
* UI flows
* SEO pages
* components

```text
Read AGENTS.md first.
Read docs relevant to FE-006.

Work on FE-006 only.

Allowed scope:
- frontend/src/**
- frontend/tests/**

Forbidden scope:
- backend/**
- infra/**
- unrelated admin or commerce modules

Verification:
- Run npm run lint
- Run npm run typecheck
- Run npm test for affected module only

Rules:
- Keep SSR/SEO pages optimized.
- Do not move business logic from backend into frontend.
- Reuse shared components where practical.
- Keep accessibility baseline.

First provide:
1. Task Summary
2. Impacted Files
3. Short Implementation Plan

Then implement.

After completion report:
1. Summary
2. Files Changed
3. Tests Run + Results
4. Risks / Follow-ups
```

---

# 4. Full-Stack Ticket

Use for:

* cart flow
* checkout flow
* account pages
* order history
* integrated features

```text
Read AGENTS.md first.
Read docs relevant to FE-008 and BE-024.

Work only on approved tickets:
- FE-008
- BE-024

Allowed scope:
- frontend/src/features/checkout/**
- backend/app/modules/checkout/**
- tests related to checkout

Forbidden scope:
- unrelated products modules
- infra changes
- random refactors

Verification:
- Run backend checkout tests
- Run frontend checkout tests
- Run lint/typecheck

Rules:
- Backend remains source of truth.
- Totals must be validated server-side.
- Use idempotency rules.

First provide:
1. Task Summary
2. Impacted Files
3. Short Implementation Plan

Then implement.

After completion report:
1. Summary
2. Files Changed
3. Tests Run + Results
4. Risks / Follow-ups
```

---

# 5. Review Existing Work

Use for:

* code review
* PR review
* architecture validation
* regression inspection

```text
Read AGENTS.md first.
Read docs relevant to BE-024.

Review implementation of BE-024 only.

Check for:
- missing acceptance criteria
- bugs
- architecture violations
- missing tests
- security issues
- maintainability risks

Do not rewrite code yet.

Output:
1. Findings
2. Severity (High / Medium / Low)
3. Missing Tests
4. Recommended Fixes
```

---

# 6. Refactor Limited Scope

Use for:

* cleanup
* maintainability pass
* debt reduction

```text
Read AGENTS.md first.

Refactor only cart module.

Allowed scope:
- cart files only

Forbidden scope:
- API contract changes
- DB schema changes
- unrelated modules

Verification:
- Run affected tests
- Run lint

Rules:
- No behavior changes.
- Improve readability and maintainability only.

After completion report:
1. Summary
2. Files Changed
3. Tests Run + Results
4. Risks
```

---

# 7. Tests Only

Use for:

* improving coverage
* regression tests
* critical path validation

```text
Read AGENTS.md first.

Write tests only for checkout flow.

Forbidden:
- production logic changes unless absolutely required for testability

Verification:
- Run newly added tests
- Run nearby existing tests

After completion report:
1. Summary
2. Files Changed
3. Tests Run + Results
4. Gaps Remaining
```

---

# 8. Migration Only

Use for:

* schema changes
* indexes
* constraints

```text
Read AGENTS.md first.
Read docs/database/* first.

Create migration for products and categories only.

Forbidden:
- service changes
- UI changes
- unrelated schema edits

Verification:
- Run alembic upgrade head
- Run alembic downgrade -1
- Run alembic upgrade head

Rules:
- Prefer backward-compatible migration.
- Large data migrations must be safe.

After completion report:
1. Summary
2. Migration Files
3. Verification Results
4. Risks
```

---

# 9. Continue Current Work

Use when resuming a session.

```text
Read AGENTS.md first.
Read docs/tickets/WORKLOG.md.
Read docs/tickets/CURRENT_TASK.md.

Continue current task only.

Do not start new tickets.

First provide:
1. Current understanding
2. Remaining work
3. Short plan

Then continue.

After completion report:
1. Summary
2. Files Changed
3. Tests Run + Results
4. Risks / Follow-ups
```

---

# 10. Hotfix / Production Bug

Use for urgent incidents.

```text
Read AGENTS.md first.

Investigate production issue:
<Order duplication on checkout>

Scope:
- only relevant checkout/payment files

Verification:
- reproduce bug
- fix bug
- run regression tests

Rules:
- Minimal safe patch.
- No broad refactors.
- Preserve compatibility.

After completion report:
1. Root Cause
2. Fix Summary
3. Files Changed
4. Tests Run + Results
5. Follow-up Recommendations
```

---

# Recommended Ticket Workflow

For every task:

```text
1. Read AGENTS.md
2. Read relevant docs
3. Read CURRENT_TASK.md
4. Use one template
5. Review output
6. Update WORKLOG.md
```

---

# Senior Engineer Prompting Principles

Prefer prompts that are:

* narrow
* verifiable
* testable
* scoped
* architecture-aware
* repeatable

Avoid prompts that are:

* vague
* multi-project
* no verification
* no constraints
* no ownership boundaries

---

# Final Reminder

Good prompts produce good engineers.

Bad prompts produce random code.
