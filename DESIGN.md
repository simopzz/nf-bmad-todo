# Design System Specification: High-Productivity Editorial

## 1. Overview & Creative North Star: "The Disciplined Curator"

This design system is built upon the concept of **The Disciplined Curator**. In a world of cluttered productivity tools, this system moves beyond simple minimalism into "Editorial Functionalism." It treats every task as a piece of high-end content, utilizing a bold, authoritative palette and a sophisticated typographic scale to create a sense of calm, professional mastery.

We reject the "template" look of standard SaaS products. Instead of rigid grids and 1px borders, we utilize **Asymmetric Breathing Room** and **Tonal Depth**. The goal is to make the user feel like they are editing a premium journal rather than managing a database. The interface should feel "heavy" where it matters (primary actions) and "weightless" where it doesn't (background architecture).

---

## 2. Colors & Surface Philosophy

The palette is anchored by the deep, authoritative `primary_container` (#1E293B) and ignited by a sharp, emerald `secondary` (#006C4A).

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Boundaries must be defined solely through background color shifts.
* Use `surface_container_low` for secondary sidebars.
* Use `surface_container_lowest` for the main content "canvas."
* Use `surface_dim` for subtle background transitions.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, fine-paper sheets.
* **Base:** `surface` (#F7F9FB)
* **Secondary Layer:** `surface_container_low` (#F2F4F6)
* **Active/Hero Layer:** `surface_container_lowest` (#FFFFFF)
This nesting creates natural depth. If a task list sits on a `surface_container_low` background, the individual task cards should be `surface_container_lowest` to create a soft, tactile lift.

### The "Glass & Gradient" Rule
To avoid a flat, "out-of-the-box" feel:
* **CTAs:** Use a subtle linear gradient from `primary` to `primary_container` (135° angle) to provide a "soul" to buttons.
* **Floating Navigation:** Use `surface_container_highest` with a 60% opacity and a 12px `backdrop-blur` for overlays and mobile navigation bars.

---

## 3. Typography: The Editorial Voice

We use a dual-font strategy to balance character with legibility.

* **Headlines & Branding:** **Plus Jakarta Sans**. Used for `display` and `headline` scales. Its geometric nature provides a premium, "architectural" feel.
* **Utility & Content:** **Inter**. Used for `title`, `body`, and `label` scales. Inter’s tall x-height ensures maximum readability even at the small `label-sm` (0.6875rem) size.

**Hierarchy via Weight, Not Size:**
Do not rely on giant font sizes to show importance. Instead, use the `on_surface` (High Emphasis) vs `on_surface_variant` (Medium Emphasis) tokens combined with font weight. A `title-sm` in Semi-Bold often carries more "authority" than a `headline-sm` in Regular.

---

## 4. Elevation & Depth: Tonal Layering

We eschew traditional drop shadows for **Ambient Tonal Layering**.

* **The Layering Principle:** Place a `surface_container_lowest` card on a `surface_container_low` section. The delta in hex value creates a "Ghost Shadow" that is easier on the eyes than a CSS box-shadow.
* **Ambient Shadows:** For high-elevation elements (modals/floating action buttons), use a highly diffused shadow:
* `box-shadow: 0 12px 40px rgba(25, 28, 30, 0.06);` (Using a tinted version of `on_surface`).
* **The "Ghost Border" Fallback:** If accessibility requires a stroke (e.g., in high-contrast modes), use the `outline_variant` token at **15% opacity**. Never use 100% opaque outlines.

---

## 5. Components

### Buttons
* **Primary:** Gradient from `primary` to `primary_container`. Text in `on_primary`. Radius: `xl` (0.75rem).
* **Secondary:** Ghost style. No background, `on_surface` text, with a `surface_container_high` hover state.
* **Tertiary/Action:** `secondary` (#006C4A) text for "Success" actions like "Complete Task."

### Input Fields
* **Minimalist State:** No bottom line or border. Use `surface_container_low` as a subtle background fill.
* **Active State:** The background shifts to `surface_container_lowest` and a 2px `secondary` (Emerald) indicator appears on the left edge—never a full border wrap.

### Task Cards (Custom Todo Component)
* **No Dividers:** Use `spacing-6` (1.5rem) of vertical whitespace to separate tasks.
* **Selection:** When a task is hovered, shift the background to `surface_container_highest`.
* **Checkboxes:** Use a custom square with `md` (0.375rem) rounding. Unchecked: `outline`. Checked: `secondary` fill with an `on_secondary` checkmark.

### Chips (Category Tags)
* Use `surface_container_high` with `label-md` text. The small radius (`sm`) provides a sharp, professional look.

---

## 6. Do’s and Don’ts

### Do
* **DO** use whitespace as a functional element. If a screen feels cluttered, increase the spacing to `spacing-8` or `spacing-10`.
* **DO** use `on_surface_variant` for metadata (dates, sub-tasks) to keep the visual focus on the task title.
* **DO** use the `secondary` (Emerald) sparingly. It is a "laser pointer" for the user’s eye—use it for "Done" buttons or active progress bars.

### Don’t
* **DON'T** use 1px dividers between list items. Use background shifts or sheer distance.
* **DON'T** use "Pure Black" (#000000). Always use `primary` or `on_surface` to maintain the sophisticated charcoal tone.
* **DON'T** use standard Material Design elevation shadows. Stick to the tonal layering rules in Section 4.
* **DON'T** over-round corners. Stick strictly to `xl` (0.75rem) for large containers and `md` (0.375rem) for small elements. Avoid pill-shaped buttons unless they are icon-only FABs.
