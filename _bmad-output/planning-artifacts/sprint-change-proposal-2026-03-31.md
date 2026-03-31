# Sprint Change Proposal — Story 1.5: Developer Makefile

**Date:** 2026-03-31
**Triggered by:** Story 1.4 review (Minimal README & Developer Onboarding)
**Change Scope:** Minor — Direct Adjustment
**Status:** Approved

---

## 1. Issue Summary

During review of Story 1.4, a DX improvement opportunity was identified: common developer commands (docker compose up/down/build, pre-commit install, etc.) are scattered across documentation. A Makefile at the repository root would centralize these commands, simplify the README, and provide value during active development — not just at project completion.

The key insight: if the Makefile only appears in Epic 5 when development is nearly complete, it serves as documentation rather than a tool. Placing it in Epic 1 means every subsequent story benefits from short, memorable commands.

## 2. Impact Analysis

### Epic Impact

| Epic | Impact | Details |
|------|--------|---------|
| Epic 1 | New story added (1.5) | Developer Makefile with initial targets |
| Epic 2 | Additive subtask | Story 2.5 adds `make test-backend` |
| Epic 3 | Additive subtask | Story 3.2 adds `make dev-frontend` |
| Epic 4 | None | No new developer commands introduced |
| Epic 5 | Simplified | Story 5.1 adds `make test-e2e`/`make test-all`; Story 5.3 verifies completeness instead of creating from scratch |

### Artifact Impact

| Artifact | Change |
|----------|--------|
| Epics file | Story 1.5 added; Story 1.4 AC updated (reference Makefile); Story 5.3 AC updated (verify Makefile completeness) |
| Sprint status YAML | `1-5-developer-makefile: backlog` added |
| Story 1.4 file | Dev notes updated (anti-pattern: don't over-document Makefile in README) |
| PRD | No change |
| Architecture | No change |
| UX Design | No change |

## 3. Recommended Approach

**Direct Adjustment** — Add Story 1.5 to Epic 1 with minor AC updates to Stories 1.4 and 5.3.

**Rationale:**
- Low effort (~30 min implementation)
- Low risk (thin wrappers over existing commands, no new infrastructure)
- High DX value compounded across all subsequent stories
- No timeline impact — Story 1.5 can be implemented immediately after 1.4

## 4. Detailed Changes Applied

### New: Story 1.5 — Developer Makefile
- Added to epics.md after Story 1.4
- Targets: `help`, `up`, `up-d`, `down`, `nuke`, `build`, `logs`, `setup`
- Incremental growth convention documented for future stories

### Modified: Story 1.4 — Minimal README
- Added AC: README references Makefile targets alongside raw commands
- Added anti-pattern to story file: don't over-document Makefile in README

### Modified: Story 5.3 — Full README & Documentation
- Updated AC: `docker-compose up` → `docker-compose up` (or `make up`)
- Added AC: Makefile contains targets for all README-documented commands

### Modified: Sprint Status YAML
- Added `1-5-developer-makefile: backlog` under Epic 1

## 5. Implementation Handoff

**Scope:** Minor — direct implementation by development team.

**Sequence:**
1. Complete Story 1.4 (README) as currently specced — reference Makefile targets lightly
2. Implement Story 1.5 (Makefile) — thin wrappers, `.PHONY`, `make help`
3. Future stories add targets incrementally as documented in the convention

**Success criteria:** `make help` prints all available targets; each target executes the correct underlying command; README references `make` shortcuts.
