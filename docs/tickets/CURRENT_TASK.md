# CURRENT_TASK

Single source of truth for what Codex should work on **right now**.

This file must always contain only one active task or one small approved batch.

If this file is empty or outdated, Codex should stop and request clarification.

---

# Current Status

**Project:** Ecommerce Monorepo  
**Phase:** PHASE 12 - Audit, monitoring, quality  
**Priority Level:** High  
**Owner:** Codex  
**Last Updated:** 2026-04-28

---

# Active Ticket

## OPS-003 - Error tracking integration

---

# Objective

Add basic frontend/backend error tracking integration.

OPS-002 implementation has been added and the next active ticket is ready for planning.

---

# Working Rules

- Work only on `OPS-003`
- Follow existing backend/frontend architecture
- Do not introduce paid-provider lock-in without explicit approval
- Do not expose secrets or sensitive exception details
- Reuse existing logging and request correlation patterns where possible
