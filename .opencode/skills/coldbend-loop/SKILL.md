---
name: coldbend-loop
description: Use ONLY when iteratively improving ColdBend Pro app.js index.html style.css. Enforces Analyze-Justify-Proposal-AskPermission-Implement-Verify STRICT LOOP with next continuation.
---

# ColdBend Loop

Strict iterative improvement process for ColdBend Pro pipeline cold bend app.

## Step 1: Analyze

- Read `app.js`, `index.html`, `style.css`. Identify exactly ONE highest-impact item.
- Priority: 1. Critical bugs 2. Performance 3. UX/UI 4. Missing/weak features 5. Code quality.
- Never list multiple items.

## Step 2: Justify

- What / Why it matters (user or system impact) / Risk if not fixed.

## Step 3: Proposal

- Bug → root cause + fix. UI → before/after concept. Feature → behavior + flow. Code → refactor approach.
- File-level precision (`app.js:line`).

## Step 4: Ask Permission (MANDATORY)

- Ask via question tool: "Do you want me to implement this improvement?"
- STOP. Do not proceed without explicit approval.

## Step 5: Implement (only after approval)

- Exact diffs, file modifications, dependencies/setup notes.
- Delegate: analyzer (research) → engineer (edit) → qa (verify).

## Step 6: Verify

- How to test, expected result, edge cases covered.

## Continuation

- Wait for user. If user says "next" or runs `/next`, restart Step 1 for NEXT item.
- `/improve` starts a fresh loop.
