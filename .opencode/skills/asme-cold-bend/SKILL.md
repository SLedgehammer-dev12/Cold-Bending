---
name: asme-cold-bend
description: Use when checking ColdBend Pro ASME B31.8 841.2.3, ASME B31.4 406.2.1, BOTAS TANAP formulas, thinning ovality springback pulls ripple seam clock calculations in app.js.
---

# ASME Cold Bend Domain

Reference for ColdBend Pro `runCalculations()` in `app.js`.

## Standards

- ASME B31.8 Md.841.2.3 Table 841.2.3-1 radius multipliers + Method 2 deflection rate per OD; ripple limit 1.0% OD (a)(7); girth weld in bend → 100% RT (a)(5).
- ASME B31.4 Md.406.2.1 liquid lines radius rules.
- BOTAS/TANAP strict: NPS>24 → 40D; ovality ≤2.5% for ILI pig passage.

## Formulas (must not regress)

- `R_bend = k*D`, `Rmin = minMult*D`, `theta_max = L_arc/R`, `L_arc = L - (Lt1+Lt2)`.
- Thinning: `delta_t = t_nom*D/(2R+D)`, `t_extrados = t_nom - delta_t`; thickening `t_nom*D/(2R-D)`.
- Barlow: `t_min = P*D/(2*S*F*E*T) + CA`, P in MPa (bar*0.1), E=1.0, T=1.0.
- Ovality natural `(1/16)*(D/t)*(D/R)*100%`; mandrel `*0.32 capped 1.15%`; limit 2.5%.
- Springback ratio `(3.5*S*R)/(E*D)*0.055`, E=207000 MPa; `machine = target + springback`.
- Pulls: `maxPull = SMYS>=450 ? 1.0° : 1.25°`; pitch 0.40m if D>=600 else 0.30m; `n = max(2, max(round(L_bent/pitch), ceil(machine/maxPull)))`.
- Method 2 limit per NPS: ≤12:3.2, ≤14:2.7, ≤16:2.4, ≤18:2.1, else 1.9 °/D. Rate `(D/R)*(180/pi)`.
- Ripple est: mandrel `0.002*D`, else D/t>45 `0.014*D` else `0.0055*D`; limit `0.01*D`.
- Seam clock: overbend/sagbend neutral = 3/9 o'clock ±10°; sidebend neutral = 12/6 o'clock ±10°; SMLS exempt.

## UI sync invariants

- `updateUI()` → `renderPullsTable()` → `updatePrintableCard()` → `render2DSketch()` → `update3DPipe()`.
- Print IDs `prt*`, matrix `matVal*`, KPI `kpi*` must stay wired in `index.html` + `setupEventListeners()`.
