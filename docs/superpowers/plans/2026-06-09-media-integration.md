# Media Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display every existing project image correctly across the public website when navigation begins at the root `index.html`.

**Architecture:** Static HTML pages receive explicit semantic image elements with page-correct relative paths. Shared CSS controls brand marks, show-card artwork, detail-page hero artwork, and responsive rendering. A Node test validates local references, expected media placement, and actual WebP signatures without adding project dependencies.

**Tech Stack:** HTML5, CSS, Node.js built-in modules, static local HTTP server

---

### Task 1: Add Media Integration Regression Test

**Files:**
- Create: `tests/media-integration.test.mjs`

- [ ] **Step 1: Write the failing test**

Create a Node script that:

- checks the six known media files exist;
- validates every `.webp` file starts with `RIFF` and contains `WEBP`;
- verifies public page image references resolve relative to their HTML file;
- verifies the root and show overview cards contain all three expected show images;
- verifies each show detail page contains the expected hero image;
- verifies public navigation and footer markup uses the primary logo.

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node tests/media-integration.test.mjs
```

Expected: failure because the existing `.webp` files contain PNG data and the HTML pages do not reference the images.

### Task 2: Normalize Existing Image Files

**Files:**
- Modify in place: `assets/media/shows/brain-loading/brain-loading-hero.webp`
- Modify in place: `assets/media/shows/brain-loading/brain-loading-card.webp`
- Modify in place: `assets/media/shows/brain-loading/brain-loading-planet.webp`
- Modify in place: `assets/media/shows/comedy-eiskalt/comedy-eiskalt-planet.webp`
- Modify in place: `assets/media/shows/comedy-check-in/comedy-check-in-planet.webp`

- [ ] **Step 1: Convert the five PNG-encoded files to valid WebP**

Use an available local image encoder while preserving filenames, dimensions, and transparency.

- [ ] **Step 2: Verify file signatures**

Run:

```bash
file assets/media/shows/*/*.webp
```

Expected: each file is identified as WebP.

### Task 3: Add Shared Image Presentation Styles

**Files:**
- Modify: `assets/css/styles.css`

- [ ] **Step 1: Add logo image styling**

Allow `.logo` to contain the actual SVG while preserving the current circular brand treatment.

- [ ] **Step 2: Add show-card artwork styling**

Place a centered image in the current card-art area with `object-fit: contain`, show-specific glow, and responsive sizing.

- [ ] **Step 3: Add detail hero styling**

Create a reusable `.show-hero-media` figure with show-specific visual variants and an image that remains contained without clipping transparent artwork.

### Task 4: Integrate Existing Images in Public HTML

**Files:**
- Modify: `index.html`
- Modify: `shows/index.html`
- Modify: `shows/brain-loading.html`
- Modify: `shows/comedy-eiskalt.html`
- Modify: `shows/comedy-check-in.html`
- Modify: `termine.html`
- Modify: `kalender.html`
- Modify: `archiv.html`
- Modify: `comedians-bewerben.html`
- Modify: `steffen-buchen.html`
- Modify: `shows/brain-loading-termine.html`
- Modify: `shows/comedy-eiskalt-termine.html`
- Modify: `shows/comedy-check-in-termine.html`

- [ ] **Step 1: Replace public brand emoji markup**

Use `assets/media/brand/steffen-vorholt-logo-primary.svg` on root pages and `../assets/media/brand/steffen-vorholt-logo-primary.svg` on show pages.

- [ ] **Step 2: Add artwork to root show cards**

Use the Brain Loading card image and the two temporary planet fallbacks with descriptive German alternative text.

- [ ] **Step 3: Add artwork to show overview cards**

Use the same artwork with paths relative to `shows/index.html`.

- [ ] **Step 4: Replace show detail placeholders**

Use the Brain Loading hero and the Eiskalt and Check-In planet fallbacks in reusable hero figures.

- [ ] **Step 5: Preserve intentional missing-media placeholders**

Keep the Steffen stage and social-proof placeholders because their source media has not been uploaded.

### Task 5: Verify Static Startup and Rendering

**Files:**
- Test: `tests/media-integration.test.mjs`

- [ ] **Step 1: Run automated media checks**

Run:

```bash
node tests/media-integration.test.mjs
```

Expected: all checks pass.

- [ ] **Step 2: Start the local site**

Run:

```bash
python3 -m http.server 8000
```

Expected: the site is available at `http://localhost:8000/`.

- [ ] **Step 3: Inspect root and show pages**

Confirm desktop and mobile rendering for:

```text
/
/shows/
/shows/brain-loading.html
/shows/comedy-eiskalt.html
/shows/comedy-check-in.html
```

- [ ] **Step 4: Verify all internal public routes return successfully**

Request each public HTML route and confirm no local image request returns an error.

## Repository Note

The working directory is not a Git repository, so commit steps are intentionally omitted.
