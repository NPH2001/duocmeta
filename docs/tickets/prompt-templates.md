# Prompt Templates for Codex

## 1. Implement Single Ticket

```text
Read AGENTS.md first.
Read relevant docs.
Implement ticket BE-024 only.
Do not start coding immediately.
First summarize task, list impacted files, provide short plan.
Then implement.
After completion report summary, files changed, tests, risks.
```

## 2. Implement Frontend Ticket

```text
Read AGENTS.md.
Read docs.
Implement FE-006 only.
Do not modify backend files.
Follow SEO and frontend structure rules.
```

## 3. Implement Backend Ticket

```text
Read AGENTS.md.
Read docs.
Implement BE-001 only.
Follow router/service/repository layering.
Add tests where appropriate.
```

## 4. Review Existing Work

```text
Read AGENTS.md and docs.
Review implementation of BE-024 against acceptance criteria.
List bugs, risks, missing tests, architecture mismatches.
Do not rewrite code yet.
```

## 5. Refactor Limited Scope

```text
Read AGENTS.md.
Refactor only files related to cart module.
Improve maintainability without changing behavior.
List all changes.
```

## 6. Write Tests Only

```text
Read AGENTS.md.
Write tests for checkout flow only.
Do not change production logic unless required to fix testability.
```

## 7. Migration Only

```text
Read AGENTS.md.
Create Alembic migration for products and categories changes only.
Do not modify unrelated modules.
```

## 8. Continue Current Work

```text
Read AGENTS.md.
Read WORKLOG.md and CURRENT_TASK.md.
Continue current ticket only.
```

## Prompt Rule

Always specify:

* exact ticket id
* allowed scope
* forbidden scope
* output format
* ask for plan first on complex tasks
