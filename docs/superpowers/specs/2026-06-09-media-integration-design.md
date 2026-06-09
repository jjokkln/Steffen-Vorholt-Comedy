# Media Integration Design

## Goal

All media already present in the project should be visibly and reliably integrated when the website is opened through the root `index.html`. Missing media should remain clearly identifiable without causing broken images.

## Existing Media

- `assets/media/brand/steffen-vorholt-logo-primary.svg`
- `assets/media/shows/brain-loading/brain-loading-hero.webp`
- `assets/media/shows/brain-loading/brain-loading-card.webp`
- `assets/media/shows/brain-loading/brain-loading-planet.webp`
- `assets/media/shows/comedy-eiskalt/comedy-eiskalt-planet.webp`
- `assets/media/shows/comedy-check-in/comedy-check-in-planet.webp`

## Integration

The primary logo replaces the microphone emoji in public navigation bars and footers. Relative paths must account for root pages and pages below `shows/`.

The three show cards on `index.html` and `shows/index.html` display their existing show artwork:

- Brain Loading uses `brain-loading-card.webp`.
- Comedy Eiskalt temporarily uses `comedy-eiskalt-planet.webp`.
- Comedy Check-In temporarily uses `comedy-check-in-planet.webp`.

The show detail heroes display:

- Brain Loading uses `brain-loading-hero.webp`.
- Comedy Eiskalt temporarily uses `comedy-eiskalt-planet.webp`.
- Comedy Check-In temporarily uses `comedy-check-in-planet.webp`.

The planet files remain reusable artwork and are not renamed to hero or card filenames. This makes the temporary fallback explicit and allows later uploads to replace the correct media role without ambiguity.

## Image Rendering

Content images use semantic `<img>` elements with descriptive German alternative text. CSS supplies consistent containers, `object-fit`, responsive sizing, border treatment, and show-specific glow effects.

The existing files carrying a `.webp` extension but containing PNG data are converted in place to valid WebP files before use. Their filenames and references remain unchanged.

## Missing Media

Missing Steffen hero media and social clips remain represented by styled placeholders. No missing filename is referenced from an `<img>` or `<video>` element, preventing broken-media icons.

The upload list remains defined by `infos.md` and `docs/media-manifest.md`.

## Verification

- Open the root `index.html` directly and navigate through all public pages.
- Confirm that all referenced local files exist and resolve relative to each page.
- Confirm that every `.webp` asset is detected as WebP data.
- Confirm responsive rendering at desktop and mobile widths.
- Confirm that missing assets produce intentional placeholders, not browser errors.
