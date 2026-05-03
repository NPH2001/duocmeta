# CURRENT_TASK

Single source of truth for what Codex should work on **right now**.

This file must always contain only one active task or one small approved batch.

If this file is empty or outdated, Codex should stop and request clarification.

---

# Current Status

**Project:** Ecommerce Monorepo
**Phase:** PHASE 13 - Performance & hardening
**Priority Level:** High
**Owner:** Codex
**Last Updated:** 2026-05-03

---

# Active Ticket

## Awaiting next documented ticket

---

# Recently Completed

## FE-025 - Floating contact shortcuts

### Objective

Add persistent quick contact methods in the lower-right corner of the storefront for phone, Zalo, and Messenger.

### Completed Scope

- Added a global fixed contact shortcut component with icon-only circular buttons.
- Added phone, Zalo, and Messenger links configurable through public frontend environment variables.
- Added accessible labels, titles, and safe external-link attributes.
- Added EN/VI translation keys for contact labels.
- Mounted the component in the root layout so it appears across the website.
- Added source-level smoke coverage for contact shortcut wiring.

### Assumptions

- Example contact links are provided in `frontend/.env.example`; production must replace them with real phone/Zalo/Messenger URLs.
- Contact shortcuts are storefront-level UI and do not change backend commerce/business rules.

---

# Objective

All documented tickets in the current architecture backlog queue through FE-025 are complete. Add the next approved ticket or batch before continuing implementation.

---

# Working Rules

- Do not start undocumented implementation work
- Continue only after the next ticket has scope and acceptance criteria
