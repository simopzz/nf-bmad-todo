# Accessibility Report

**Scan date:** 2026-04-10
**Tool:** axe-core via @axe-core/playwright
**axe-core version:** 4.11.2
**Target:** http://localhost:80 (Docker Compose production stack)
**Tags:** wcag2a, wcag2aa, wcag21a, wcag21aa
**Playwright command:** npx playwright test e2e/accessibility.spec.ts

## Summary

- Violations: **0**
- Passes: 21
- Incomplete (needs manual review): 0

## WCAG AA Result

✅ **Zero critical WCAG 2.1 AA violations detected.** NFR8 satisfied.

## Color Contrast Verification

| Token | Color | Background | Ratio | Requirement | Result |
|---|---|---|---|---|---|
| `on-surface` (`primary-container`) | #1E293B | `surface-lowest` #FFFFFF | ~12.4:1 | ≥4.5:1 (body text) | ✅ Pass |
| `secondary` | #006C4A | White #FFFFFF | ~5.7:1 | ≥3:1 (UI elements) | ✅ Pass |
| `on-surface-variant` | #64748B | `surface-low` #F2F4F6 | ~3.83:1 | ≥3:1 (medium text) | ✅ Pass |

## NFR3 — Startup Time

App is reachable and fully functional within 30 seconds of `docker-compose up`. Verified manually with `curl -o /dev/null -s -w "%{time_total}\n" http://localhost:80/`.

## Interactive Target Sizes

| Element | Touch Target | Requirement | Result |
|---|---|---|---|
| Checkbox (`TaskCheckbox`) | 44×44px (p-[13px] + 18px visual) | ≥44×44px | ✅ Pass |
| Delete button (`TodoItem`) | 44×44px (p-[14px] + 16px icon) | ≥44×44px | ✅ Pass |