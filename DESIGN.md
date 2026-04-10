# Design System: The Editorial Monolith
 
## 1. Overview & Creative North Star
**Creative North Star: "The Singular Focus"**
 
This design system is a rejection of the cluttered, "utility-first" productivity era. It draws inspiration from high-end fashion mastheads and architectural minimalism. The goal is to transform a simple list into a cinematic experience. By removing sidebars, complex metadata, and traditional UI scaffolding, we create a "Monolith"—a single, centered column of intent.
 
The system breaks the "template" look through **extreme negative space** and **asymmetric balance**. We do not center everything; we use generous left-aligned typography to create a sense of momentum, balanced by purposeful "nothingness" on the right.
 
---
 
## 2. Colors & Tonal Depth
 
### The Palette
The core of the experience is built on a "Deep Midnight" foundation (`#0c0e14`), moving away from true black to provide a more sophisticated, indigo-tinted depth.
 
- **Primary (`#c6c6c6`):** Used sparingly for high-contrast moments—text and primary actions.
- **Surface Tiers:** 
    - `surface`: The base canvas (`#0c0e14`).
    - `surface-container-low`: For subtle grouping (`#10131b`).
    - `surface-container-high`: For active task focus (`#1a1f2d`).
 
### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or separating tasks. Boundaries must be defined solely through background shifts or vertical whitespace. A task is not "in a box"; it is a layer of light floating on the dark.
 
### Surface Hierarchy & Nesting
Treat the UI as stacked sheets of fine, dark paper. 
- Use `surface-container-lowest` (`#000000`) for the background of the "Add Task" area to make it feel like a void waiting to be filled.
- Use `surface-container-high` (`#1a1f2d`) for hovered states to create a "lift" effect.
 
### The "Glass & Gradient" Rule
For floating action buttons or modal overlays, use **Glassmorphism**. Apply `surface-bright` (`#242c3f`) at 60% opacity with a `24px` backdrop blur. This ensures that even when an element is "above" the list, the editorial soul of the list bleeds through.
 
---
 
## 3. Typography: The Manrope Scale
 
Manrope is utilized for its geometric purity and modern warmth. We use a high-contrast scale to create an editorial feel, where the "What" (the task) is significantly more prominent than the "How" (the status).
 
*   **Display-LG (3.5rem):** Used for the daily count or "Zero State" headlines. It should feel massive and authoritative.
*   **Headline-SM (1.5rem):** The default state for an active task. It treats each to-do as a headline, not a list item.
*   **Body-MD (0.875rem):** Reserved for timestamps or secondary "whisper" text using `on-surface-variant`.
*   **Label-SM (0.6875rem):** All-caps, tracked out (10-15%) for utility actions.
 
**Editorial Intent:** Use `on-surface` (`#dfe5fc`) for active tasks and `on-tertiary-fixed-variant` (`#4d5575`) for completed tasks. The drop in contrast should feel like a physical "fading away" of the chore.
 
---
 
## 4. Elevation & Depth
 
### The Layering Principle
Depth is achieved through **Tonal Layering**. Place a `surface-container-low` item on a `surface` background to create a soft, natural lift. No shadows are needed for static elements.
 
### Ambient Shadows
When a task is being "dragged" or reordered:
- **Shadow:** 0px 20px 40px rgba(0, 0, 0, 0.4).
- **Tint:** The shadow must be tinted with the `background` color (`#0c0e14`) to ensure it feels like a natural obstruction of light in a dark room.
 
### The "Ghost Border" Fallback
If a visual container requires a boundary (e.g., a focused input field), use the `outline-variant` (`#41485a`) at **20% opacity**. This creates a "breath" of a line rather than a hard edge.
 
---
 
## 5. Components
 
### The Task Row (List Item)
*   **Structure:** No dividers. Use `40px` of vertical padding between items.
*   **Interaction:** On hover, the background transitions to `surface-container-low` with a `4px` corner radius.
*   **Typography:** Headlines are `headline-sm`.
 
### The Editorial Checkbox
*   **Unchecked:** A simple `outline` circle (`#6f7589`) with a 1.5px stroke.
*   **Checked:** Transitions to `primary` (`#c6c6c6`) with a subtle `2px` inner glow.
*   **Motion:** The checkmark should draw in with a `200ms` cubic-bezier ease-out.
 
### Input Fields
*   **Style:** Minimalist. No background. No bottom line.
*   **Placeholder:** `on-surface-variant` (`#a5aac0`) at 40% opacity.
*   **Focus State:** The typography weight shifts from Medium to Bold; no border change.
 
### Buttons (The "Action Chip")
*   **Primary:** `primary-container` background with `on-primary-container` text.
*   **Shape:** 4px radius (`DEFAULT`).
*   **Padding:** `12px` top/bottom, `24px` left/right.
 
---
 
## 6. Do's and Don'ts
 
### Do
*   **Embrace the Void:** Use massive margins. The list should feel like it has room to breathe.
*   **Use Subtle Motion:** Every state change should have a `300ms` duration. Avoid "snapping."
*   **Tonal Logic:** Use `surface-dim` for the background and `surface-bright` for highlights.
 
### Don't
*   **No Dividers:** Never use a horizontal line to separate tasks. Use space.
*   **No Sidebars:** The app is a single flow. Do not introduce navigation drawers or lists.
*   **No Rounded Pills:** Stick strictly to the `4px` (`DEFAULT`) radius for containers. The only circles allowed are checkboxes.
*   **No High-Contrast Borders:** Avoid the "bootstrap" look of hard outlines. Rely on the palette's tonal shifts.
 
---
 
## 7. Signature Interaction: The "Focus Fade"
When a user begins typing a new task, all other tasks in the list should drop to 20% opacity (`on-surface-variant`). This "Focus Fade" ensures the system lives up to its North Star: The Singular Focus.
