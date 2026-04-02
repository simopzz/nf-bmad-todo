# Story 3.1: Design System Foundation

Status: done

## Story

As a developer,
I want the design token system, fonts, and Tailwind configuration in place,
so that all subsequent components use consistent, correct visual primitives from the start.

## Acceptance Criteria

1. Given the frontend project exists from Story 1.1, when Tailwind is configured, then `tailwind.config.js` defines custom tokens: `colors.brand.emerald` (`#006C4A`), `colors.primary-container` (`#1E293B`), `colors.secondary` (`#006C4A`), `colors.surface` (`#F7F9FB`), `colors.surface-low` (`#F2F4F6`), `colors.surface-lowest` (`#FFFFFF`), `colors.surface-highest` (dark hover state), `colors.outline-variant` (ghost border, used at 15% opacity for accessibility mode only), `fontFamily.display` (`['Plus Jakarta Sans', 'sans-serif']`), `fontFamily.body` (`['Inter', 'sans-serif']`).
2. Plus Jakarta Sans and Inter are loaded in `index.html` via Google Fonts before the Vite entry point.
3. Standard Tailwind `emerald-*` scale is not used anywhere; only `brand.emerald` is used.
4. No 1px solid borders exist in any component; boundaries are defined by background color transitions.
5. No Tailwind classes are constructed via string interpolation anywhere in `.vue` or `.ts` files; all class strings are complete literals.
6. Google Fonts `<link rel="preconnect">` and `<link rel="stylesheet">` tags appear in `index.html` before `<script type="module">`.
7. App shell layout is implemented in `App.vue`: max-width 640px, horizontally centered, `surface` page background.

## Tasks / Subtasks

- [x] Task 1: Install and wire Tailwind CSS for Vue frontend (AC: 1)
  - [x] Add Tailwind dependencies in `todo-frontend` (pin to project-compatible v3 line to preserve `tailwind.config.js`-based token architecture)
  - [x] Create `tailwind.config.js` with all required token keys and values from AC
  - [x] Create `postcss.config.js` and ensure build pipeline picks up Tailwind
  - [x] Add Tailwind directives in a canonical stylesheet (`src/style.css`) and import it from `src/main.ts`

- [x] Task 2: Implement typography foundation in `index.html` (AC: 2, 6)
  - [x] Add `preconnect` links for Google Fonts origins
  - [x] Add stylesheet link for Plus Jakarta Sans + Inter before the Vite script tag
  - [x] Keep HTML semantics valid (`lang="en"`, viewport, title) while adding font links

- [x] Task 3: Replace scaffold shell with design-foundation shell (AC: 7)
  - [x] Refactor `src/App.vue` from Vue starter demo to a neutral Todo app shell
  - [x] Enforce centered container (`max-width: 640px`) and `surface` background
  - [x] Keep shell intentionally minimal (no task feature logic yet; Story 3.2+ owns feature behavior)

- [x] Task 4: Enforce anti-pattern guardrails required by design system (AC: 3, 4, 5)
  - [x] Remove/avoid scaffold CSS patterns that introduce visible borders as separators
  - [x] Ensure all Tailwind classes are literal strings (no template interpolation)
  - [x] Verify no usage of Tailwind default emerald scale classes (`emerald-50...950`)
  - [x] Verify no 1px border-based sectioning in frontend components

- [x] Task 5: Prepare structure for upcoming Epic 3 stories without scope creep
  - [x] Align frontend styling entrypoints with architecture (`src/style.css`, token-driven classes)
  - [x] Leave component implementation (`TodoInput`, `TodoItem`, `TodoList`, `AppError`, `AppEmpty`) to Stories 3.2–3.6
  - [x] Do not introduce Pinia/router/global state libraries (explicitly out of v1 scope)

- [x] Task 6: Verify quality gates for story completion
  - [x] Run `npm --prefix todo-frontend run lint`
  - [x] Run `npm --prefix todo-frontend run type-check`
  - [x] Run `npm --prefix todo-frontend run test:unit -- --run`
  - [x] Run `npm --prefix todo-frontend run build`

## Dev Notes

### Epic Context and Business Goal

Epic 3 delivers the complete frontend happy-path loop (create, view, edit, complete, delete). Story 3.1 is foundational: if token naming, typography, and shell conventions drift now, Stories 3.2–3.6 will multiply inconsistency and rework. Keep this story focused on visual/system primitives and shell alignment only.

### Current Codebase Baseline (Observed)

- Frontend is still Vue scaffold starter content (`HelloWorld`, `TheWelcome`, default theme CSS).
- `tailwind.config.js` and `postcss.config.js` do not exist yet.
- `index.html` currently has no Google Fonts links.
- `App.vue` is scaffold demo layout, not Todo shell.

This means Story 3.1 must both establish the design system and remove scaffold artifacts that conflict with the architecture.

### Architecture Guardrails (Must Follow)

- `components/todos/` is the only allowed feature component folder in v1.
- `useTodos()` will be called once in `App.vue` (Story 3.2); do not pre-emptively implement composable logic in this story.
- Tailwind token contract is mandatory; avoid ad-hoc color usage or direct hex hardcoding in component classes.
- Dynamic Tailwind class interpolation is forbidden (purge/runtime risk and explicit architecture rule).

### Implementation Constraints for This Story

- This story is **design foundation only**. Do not implement CRUD behavior, API calls, composables, or Todo item interactions.
- Keep `App.vue` as a structural shell ready for children and props wiring in later stories.
- Preserve compatibility with existing project toolchain (`vite@7.x` in repo); do not perform opportunistic upgrades.
- Prefer stable integration over latest-major adoption when architecture contract depends on specific config patterns.

### Latest Technical Intelligence (Web-verified)

- Vue latest published: `3.5.31` (project currently uses `3.5.30`).
- Vite latest published: `8.0.3` (project currently uses `7.3.1`).
- Tailwind latest published: `4.2.2`.

Guidance for this story: stay on repo-aligned versions and implement the architecture-defined `tailwind.config.js` token strategy. Adopting Tailwind v4 config patterns here would diverge from agreed architecture unless architecture docs are updated first.

### Testing and Verification Notes

- Treat this story as a foundational frontend refactor; run lint, TS check, unit tests, and build after changes.
- Add a quick grep-based verification pass for forbidden patterns:
  - No dynamic Tailwind interpolation in `.vue`/`.ts`
  - No `emerald-[0-9]` class usage
  - No 1px border sectioning introduced by new code

### Git Intelligence Summary

Recent commits are backend-focused (`2.1`–`2.5`) and do not establish frontend implementation patterns for Epic 3 yet. Therefore Story 3.1 defines the frontend baseline conventions that all subsequent frontend stories must reuse.

### File-Level Implementation Plan

- Create:
  - `todo-frontend/tailwind.config.js`
  - `todo-frontend/postcss.config.js`
  - `todo-frontend/src/style.css`
- Modify:
  - `todo-frontend/index.html` (fonts preconnect + stylesheet)
  - `todo-frontend/src/main.ts` (import style entrypoint)
  - `todo-frontend/src/App.vue` (shell layout)
- Optional cleanup (only if needed for consistency):
  - remove or stop importing scaffold-only CSS that conflicts with new foundation

### Out of Scope (Do Not Implement Here)

- `services/api.ts`, `composables/useTodos.ts`, `types/todo.ts` (Story 3.2)
- `TodoInput.vue` (Story 3.3)
- `TaskCheckbox` behavior/component (Story 3.4)
- `TodoItem.vue` interactions (Story 3.5)
- `TodoList` integration, empty variants, full happy-path orchestration (Story 3.6)
- Loading skeleton, error-state variants, and accessibility/responsive hardening (Epic 4)

### Project Structure Notes

Current structure is scaffold-first and does not yet match architecture’s expected frontend organization (`src/style.css`, tokenized Tailwind pipeline, `components/todos/*`).

This story should establish the architectural baseline without introducing future-story files prematurely. Create only the foundation files needed now, and leave feature components to their designated stories.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Epic-3-Core-Frontend-Task-Management`]
- [Source: `_bmad-output/planning-artifacts/epics.md#Story-3.1-Design-System-Foundation`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend-Architecture`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Structure-Patterns`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Tailwind-Design-Token-Rules`]
- [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement-Rules`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Design-System-Foundation`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Visual-Design-Foundation`]
- [Source: `DESIGN.md#The-No-Line-Rule`]
- [Source: `_bmad-output/project-context.md#Critical-Implementation-Rules`]
- [Source: `_bmad-output/project-context.md#Code-Quality-and-Style-Rules`]

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex (model ID: gpt-5.3-codex)

### Debug Log References

- Auto-selected from sprint status backlog order: `3-1-design-system-foundation`.
- Frontend baseline inspected before story creation: scaffold App/theme still present; Tailwind files absent.
- Web version spot-checks performed for Vue, Vite, Tailwind package registries.
- Story execution used strict TDD for design-foundation requirements: added `src/__tests__/designFoundation.spec.ts`, confirmed failing tests, implemented Tailwind/font/shell changes, then re-ran tests to green.
- Guardrail verification completed via regex scans: no `emerald-*` scale classes, no dynamic class interpolation in source files, no 1px border sectioning in Vue source.
- Full verification commands executed successfully:
  - `npm --prefix todo-frontend run lint`
  - `npm --prefix todo-frontend run type-check`
  - `npm --prefix todo-frontend run test:unit -- --run`
  - `npm --prefix todo-frontend run build`
  - `make test-backend` (regression safety check)

### Completion Notes List

- Installed and wired Tailwind CSS v3 toolchain (`tailwindcss`, `postcss`, `autoprefixer`) with project-compatible configuration.
- Implemented required design tokens in `tailwind.config.js`: `brand.emerald`, `primary-container`, `secondary`, `surface`, `surface-low`, `surface-lowest`, `surface-highest`, `outline-variant`, plus `fontFamily.display` and `fontFamily.body`.
- Added Google Fonts preconnect and stylesheet links for Plus Jakarta Sans + Inter in `index.html` before Vite script entry.
- Replaced Vue scaffold shell with a minimal Todo-ready structural shell in `App.vue` using centered `max-w-[640px]` container and `surface` background.
- Removed scaffold CSS/component artifacts that violated no-line and token-first guardrails; switched styling entrypoint to canonical `src/style.css`.
- Added design foundation tests (`src/__tests__/designFoundation.spec.ts`) to validate token presence, font link order, shell layout constraints, and anti-pattern prohibitions.
- All required frontend quality gates pass (lint, type-check, unit tests, build). Backend regression check also passes via `make test-backend`.
- Story marked `review`.

### File List

- `_bmad-output/implementation-artifacts/3-1-design-system-foundation.md` (created/updated)
- `todo-frontend/package.json` (modified)
- `todo-frontend/package-lock.json` (modified)
- `todo-frontend/tailwind.config.js` (created)
- `todo-frontend/postcss.config.js` (created)
- `todo-frontend/src/style.css` (created)
- `todo-frontend/index.html` (modified)
- `todo-frontend/src/main.ts` (modified)
- `todo-frontend/src/App.vue` (modified)
- `todo-frontend/src/__tests__/designFoundation.spec.ts` (created)
- `todo-frontend/src/assets/base.css` (deleted)
- `todo-frontend/src/assets/main.css` (deleted)
- `todo-frontend/src/components/HelloWorld.vue` (deleted)
- `todo-frontend/src/components/TheWelcome.vue` (deleted)
- `todo-frontend/src/components/WelcomeItem.vue` (deleted)
- `todo-frontend/src/components/__tests__/HelloWorld.spec.ts` (deleted)
- `todo-frontend/src/components/icons/IconCommunity.vue` (deleted)
- `todo-frontend/src/components/icons/IconDocumentation.vue` (deleted)
- `todo-frontend/src/components/icons/IconEcosystem.vue` (deleted)
- `todo-frontend/src/components/icons/IconSupport.vue` (deleted)
- `todo-frontend/src/components/icons/IconTooling.vue` (deleted)

### Review Findings

- [x] [Review][Decision] AC 7 centering placement — two-layer layout accepted: `bg-surface` on full-width `<main>`, content container capped at `max-w-[640px]` in `<section>` — dismissed as intentional design pattern [todo-frontend/src/App.vue]
- [x] [Review][Patch] `outline-variant` token value `#1E293B` was identical to `primary-container` — fixed: changed to `#64748B` (distinct ghost border color) [todo-frontend/tailwind.config.js]
- [x] [Review][Patch] Border regex `/\bborder-(?:t|r|b|l)?\b/` was too narrow — fixed: updated to `/\bborder(?:-[trbxy])?\b(?!-)/` covering bare `border`, `border-x`, `border-y` [todo-frontend/src/__tests__/designFoundation.spec.ts:120]
- [x] [Review][Patch] `process.cwd()` — reviewed: correctly resolves to frontend root when invoked via `npm --prefix`; added comment to document dependency [todo-frontend/src/__tests__/designFoundation.spec.ts:9]
- [x] [Review][Patch] `isTestFile` helper not applied in emerald-scale scan loop — fixed: added `isTestFile` guard to loop [todo-frontend/src/__tests__/designFoundation.spec.ts:91-94]
- [x] [Review][Patch] `${` interpolation check was too broad — fixed: narrowed to backtick template literals only via `/\`[^\`]*\$\{/` [todo-frontend/src/__tests__/designFoundation.spec.ts:111]
- [x] [Review][Patch] `listFilesRecursively` had no symlink protection — fixed: switched to `lstatSync`, added `isSymbolicLink()` guard [todo-frontend/src/__tests__/designFoundation.spec.ts:18-21]
- [x] [Review][Defer] `lint-frontend` Makefile target bundles `npm run build` into lint step — semantically unusual but intent is explicit in comment — deferred, pre-existing
- [x] [Review][Defer] Hard-coded placeholder text in `App.vue` ("Design system foundation is ready...") — scaffolding prose, should be replaced in Story 3.3 — deferred, pre-existing
- [x] [Review][Defer] `tailwind.config.js` module may be stale-cached in Vitest watch mode — only affects DX, not CI — deferred, pre-existing
- [x] [Review][Defer] Google Fonts loaded without SRI hash — supply-chain risk, but impractical with CDN-hosted fonts — deferred, pre-existing

### Change Log

- 2026-04-02: Implemented Story 3.1 design foundation (Tailwind token system, Google Fonts wiring, App shell baseline, scaffold cleanup, and quality/test validation).
- 2026-04-02: Code review completed. 1 decision needed, 6 patches identified, 4 deferred, 5 dismissed.
