# Home Hero Layout Toggle Design

## Goal

Allow temporary visual comparison of two homepage hero treatments without reloading the page.

## Variants

### Card

The existing rotated video card remains visible on the right side of the hero. The three floating stickers remain visible.

### Full Surface

The video fills the entire right side of the hero without a card border, radius, or rotation. A layered dark gradient and soft blur fade the video toward the left so the heading and calls to action remain readable. Stickers are hidden in this mode.

## Toggle

A compact segmented control labeled `Karte` and `Vollfläche` sits at the top right inside the hero. The selected button exposes `aria-pressed="true"`.

The toggle switches a class on the homepage hero. The selected mode is stored in `localStorage` under `homeHeroMode` and restored on the next visit.

## Responsive Behavior

The comparison is intended for desktop. Below the existing tablet breakpoint, the hero always renders in card mode and the toggle is hidden. The stored desktop preference is preserved.

## Scope

Only `index.html`, shared CSS, homepage JavaScript behavior, and the media regression test change. Show pages and other components remain unchanged.

## Verification

- Both toggle buttons are keyboard-accessible.
- Switching does not reload the page.
- The full-surface mode fills the right hero column and fades toward the text.
- Card mode restores the existing presentation and stickers.
- Reloading restores the selected desktop mode.
- Mobile rendering remains in card mode.
