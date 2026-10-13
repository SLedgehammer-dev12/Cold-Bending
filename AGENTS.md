# ColdBend Pro — Agent Instructions

Pipeline cold field bend engineering app (`app.js`, `index.html`, `style.css`, `lib/`).
Compliant with ASME B31.8 Md. 841.2.3, ASME B31.4 Md. 406.2.1, employer specs.

## Strict loop (mandatory)

Work in single-improvement iterations only:

1. **Analyze** — exactly ONE highest-impact item (bugs → perf → UX → features → quality).
2. **Justify** — what / why / risk if not fixed.
3. **Proposal** — file-level solution, no code yet.
4. **Ask Permission** — use the question tool: "Do you want me to implement this improvement?" Never implement without explicit approval.
5. **Implement** — minimal diffs; never regress thinning/ovality/springback/pulls/Method-2/ripple/seam formulas.
6. **Verify** — `node --check app.js`, how to test, expected result, edge cases.

After implementing, wait. On "next", restart at step 1.

## invariants

- `updateUI()` → pulls table → print card → 2D sketch → 3D pipe must stay in sync.
- Print IDs (`prt*`), matrix IDs (`matVal*`), KPI IDs (`kpi*`) must stay wired.
- Turkish UI strings; dark + light themes; A4 print layout.
