# Home Hero Layout Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a temporary homepage control that switches between the existing video card and a full-height right-side video with a dark left fade.

**Architecture:** The homepage hero receives a two-button segmented control and stable data attributes. A small JavaScript initializer applies the selected mode, updates accessible pressed states, and persists the desktop preference in `localStorage`; CSS owns both visual layouts and forces card mode below the tablet breakpoint.

**Tech Stack:** HTML5, CSS, browser JavaScript, Node.js built-in assertion test

---

### Task 1: Extend the Regression Test

**Files:**
- Modify: `tests/media-integration.test.mjs`

- [ ] **Step 1: Add assertions for the comparison controls**

Assert that `index.html` contains:

```html
data-hero-layout-toggle
data-hero-mode="card"
data-hero-mode="full"
```

Assert that `assets/js/main.js` contains the `setupHeroLayoutToggle` initializer and the `homeHeroMode` storage key.

- [ ] **Step 2: Run the test and confirm failure**

Run:

```bash
node tests/media-integration.test.mjs
```

Expected: failure because the toggle markup and initializer do not yet exist.

### Task 2: Add Toggle Markup

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Identify the homepage hero**

Add `home-hero` and `data-home-hero` to the existing hero header.

- [ ] **Step 2: Add the segmented control**

Place a `role="group"` control at the top right of the hero with:

```html
<button type="button" data-hero-mode="card" aria-pressed="true">Karte</button>
<button type="button" data-hero-mode="full" aria-pressed="false">Vollfläche</button>
```

### Task 3: Implement the Two Visual Modes

**Files:**
- Modify: `assets/css/styles.css`

- [ ] **Step 1: Position the test toggle**

Style the control as a compact segmented pill above the right hero area with clear selected, hover, and focus-visible states.

- [ ] **Step 2: Preserve card mode**

Keep the current rotated card, border, radius, shadow, and stickers as the default.

- [ ] **Step 3: Add full-surface mode**

When `.is-full-video` is present:

- expand the stage to the right edge of the viewport;
- remove card radius, border, shadow, and rotation;
- fill the stage with the video;
- add dark gradient overlays that fade and softly blur toward the left;
- hide stickers;
- keep text and controls above the media layer.

- [ ] **Step 4: Add responsive fallback**

At `max-width: 1050px`, hide the toggle and force the visual result back to card dimensions regardless of stored preference.

### Task 4: Add Toggle Behavior

**Files:**
- Modify: `assets/js/main.js`

- [ ] **Step 1: Create `setupHeroLayoutToggle`**

The initializer:

- exits on non-home pages;
- reads `homeHeroMode`;
- applies only `card` or `full`;
- toggles `.is-full-video`;
- synchronizes `aria-pressed`;
- writes changes to `localStorage`;
- responds to button clicks without navigation.

- [ ] **Step 2: Initialize the behavior**

Call `setupHeroLayoutToggle()` with the existing page initializers.

### Task 5: Verify Both Views

**Files:**
- Test: `tests/media-integration.test.mjs`

- [ ] **Step 1: Run automated checks**

Run:

```bash
node tests/media-integration.test.mjs
```

Expected: all media and hero-toggle checks pass.

- [ ] **Step 2: Run the local server**

Run:

```bash
python3 -m http.server 8000
```

- [ ] **Step 3: Capture both desktop states**

Use Chrome to capture card mode and full-surface mode. Confirm the full mode reaches the right edge, fades left, and keeps text readable.

- [ ] **Step 4: Capture mobile**

Use a narrow viewport and confirm the toggle is hidden and the video remains in card mode.

## Repository Note

The working directory is not a Git repository, so commit steps are omitted.
